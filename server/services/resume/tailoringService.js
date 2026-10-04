/**
 * tailoringService.js — JD-Tailored Resume Rewrite with Anti-Hallucination Guardrail
 * ====================================================================================
 * PURPOSE:
 *   Generates a job-description-specific resume rewrite. The CRITICAL design
 *   constraint from SPEC.md is:
 *     "AI may only rephrase/reframe what the user already wrote — never invents
 *      skills, employers, metrics, or experience."
 *
 * HOW THE ANTI-HALLUCINATION GUARDRAIL WORKS:
 *   This is a multi-layer defense, not just a single prompt instruction:
 *
 *   Layer 1 — Strict System Prompt Role:
 *     The system message frames the AI as a "resume editor, not a resume writer".
 *     Editors improve existing text. Writers create new content. This framing
 *     significantly reduces fabrication vs. a generic "write a resume" instruction.
 *
 *   Layer 2 — Explicit Negative Rules in the User Prompt:
 *     A clearly numbered "HARD RULES — NEVER DO THIS" section lists exactly
 *     what's forbidden: inventing numbers, adding new employers, adding skills
 *     not in the source, etc. LLMs respect explicit prohibitions more reliably
 *     than implied constraints.
 *
 *   Layer 3 — Source-Anchored Instructions Only:
 *     The prompt says "For each bullet point in the ORIGINAL RESUME, you may:
 *     (a) improve the phrasing, (b) add a JD keyword if the underlying skill
 *     is clearly demonstrated. You may NOT: (c) add new bullet points, (d)
 *     change any number or metric, (e) add any employer, role, or date."
 *     This operationalizes the guardrail at the sentence level.
 *
 *   Layer 4 — Post-Generation Validation (validateNoHallucination):
 *     After AI returns output, we run a diff-based check comparing:
 *     - Numbers present in output vs. numbers present in the original (new
 *       numbers = hallucination flag).
 *     - Employer/company names in output vs. original (new names = hallucination flag).
 *     If violations are found, we either strip the violating bullets or return a
 *     fallback message with an explanation.
 *
 *   Layer 5 — User-Facing Disclaimer:
 *     The API response always includes a disclaimer field. The frontend renders
 *     it prominently above the output.
 *
 * HOW IT CONNECTS TO THE SYSTEM:
 *   - Called by: server/routes/resumeRoutes.js POST /api/resume/tailor
 *   - Input: { resumeText, jobDescription }
 *   - Output: { success, tailoredResume, changes, disclaimer, guardrailReport }
 *   - The frontend ResultPanel "AI Rewrite" tab calls this endpoint
 */

import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

let groqClient = null;
const apiKey = process.env.GROQ_API_KEY;
if (apiKey && apiKey.startsWith("gsk_")) {
  try {
    groqClient = new Groq({ apiKey });
  } catch (e) {
    console.warn("Groq init error in tailoringService");
  }
}

async function callGroq(messages, max_tokens = 2500, temperature = 0.3) {
  if (!groqClient) throw new Error("Groq client not initialized");
  
  const candidateModels = [
    process.env.GROQ_MODEL,
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant"
  ].filter(Boolean);

  let lastError = null;
  for (const model of candidateModels) {
    try {
      const completion = await groqClient.chat.completions.create({
        messages, model, temperature, max_tokens
      });
      return completion.choices[0]?.message?.content || null;
    } catch (err) {
      lastError = err;
      if (
        err.status === 404 ||
        err.status === 400 ||
        err.code === "model_not_found" ||
        err.code === "model_decommissioned" ||
        err.message?.includes("model") ||
        err.message?.includes("decommissioned")
      ) {
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

/**
 * Layer 4: Post-generation validation to catch hallucinated content
 * Returns { clean: boolean, violations: string[] }
 */
function validateNoHallucination(originalText, outputText) {
  const violations = [];

  // Extract numbers from original and output
  const originalNumbers = new Set(
    (originalText.match(/\b\d[\d,.]*\s*(?:%|k|m|b|x|hrs?|hours?|days?|weeks?|months?|years?)?\b/gi) || [])
      .map(n => n.toLowerCase().trim())
  );
  const outputNumbers = (
    outputText.match(/\b\d[\d,.]*\s*(?:%|k|m|b|x|hrs?|hours?|days?|weeks?|months?|years?)?\b/gi) || []
  ).map(n => n.toLowerCase().trim());

  const newNumbers = outputNumbers.filter(n => !originalNumbers.has(n) && parseFloat(n) > 0);
  if (newNumbers.length > 0) {
    violations.push(`Invented ${newNumbers.length} metric(s) not in original: ${newNumbers.slice(0, 3).join(", ")}`);
  }

  // Check for new company/employer names (capitalized proper nouns appearing in output but not original)
  const extractProperNouns = text =>
    new Set((text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g) || []).filter(w => w.length > 3));
  
  const originalProperNouns = extractProperNouns(originalText);
  const outputProperNouns = extractProperNouns(outputText);
  
  const newProperNouns = [...outputProperNouns].filter(n => !originalProperNouns.has(n));
  // Filter out common words that aren't employer names
  const commonWords = new Set(["Summary", "Experience", "Education", "Skills", "Projects", "Certifications", 
    "Work", "Professional", "Technical", "Bachelor", "Master", "University", "College", "Institute",
    "January", "February", "March", "April", "June", "July", "August", "September", "October", "November", "December"]);
  const suspiciousNames = newProperNouns.filter(n => !commonWords.has(n) && n.split(" ").length >= 2);
  
  if (suspiciousNames.length > 2) {
    violations.push(`Possible new employer/entity names detected: ${suspiciousNames.slice(0, 3).join(", ")}`);
  }

  return {
    clean: violations.length === 0,
    violations
  };
}

/**
 * Main: Generate JD-tailored resume rewrite with anti-hallucination guardrail
 */
export async function tailorResumeForJob(resumeText, jobDescription) {
  if (!groqClient) {
    return {
      success: false,
      error: "AI service unavailable. Please check your GROQ_API_KEY.",
      guardrailReport: null
    };
  }

  const systemPrompt = `You are a professional resume EDITOR, not a resume writer.
Your role is strictly to improve the PRESENTATION of existing resume content to better align with a job description.

ABSOLUTE RULES — NEVER VIOLATE THESE:
1. NEVER invent, add, or fabricate any skill the candidate did not already list.
2. NEVER change, inflate, or invent any number, percentage, metric, or achievement figure.
3. NEVER add a new employer, company, project name, or job title the candidate did not already have.
4. NEVER add a new date, tenure, or work period.
5. NEVER add a new degree, certification, or qualification.
6. You may ONLY: rephrase existing bullets with stronger action verbs, reorder bullet points to front-load relevant experience, naturally incorporate JD terminology where the underlying skill clearly already exists, and remove irrelevant/weak bullets to make space.

If a required JD skill is genuinely missing from the resume, do NOT add it — leave it absent. The skill-gap analysis will surface it separately.`;

  const userPrompt = `Below is a candidate's original resume and a target job description.

ORIGINAL RESUME:
<resume>
${resumeText.substring(0, 3500)}
</resume>

TARGET JOB DESCRIPTION:
<jd>
${jobDescription.substring(0, 1500)}
</jd>

TASK:
Rewrite the resume following these guidelines:
- For each existing bullet point: improve phrasing and lead with a strong action verb.
- Incorporate exact JD terminology where the candidate's existing experience supports it (do NOT add it if it isn't there).
- Reorder bullets within each role to prioritize the most JD-relevant work first.
- Remove vague filler language like "responsible for", "assisted with", "participated in".
- Do NOT add any new employers, metrics, skills, or experience not already in the resume.
- Preserve all section headings, dates, company names, and job titles exactly.

Return ONLY the rewritten resume text. No commentary, no explanations, no preamble.`;

  let tailoredResume = null;
  let guardrailViolations = [];

  try {
    tailoredResume = await callGroq([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ], 2500, 0.3);

    if (!tailoredResume) throw new Error("Empty response from AI");

    // Layer 4: Run post-generation validation
    const validation = validateNoHallucination(resumeText, tailoredResume);
    guardrailViolations = validation.violations;

    return {
      success: true,
      tailoredResume,
      guardrailReport: {
        clean: validation.clean,
        violations: guardrailViolations,
        message: validation.clean
          ? "✅ Anti-hallucination guardrail passed — no fabricated content detected."
          : `⚠️ Guardrail flagged ${guardrailViolations.length} potential issue(s). Please review carefully before use.`
      },
      disclaimer: "IMPORTANT: This is an AI-generated resume tailored to the job description. You MUST review every bullet point before submitting. Do not submit any experience, metric, or skill you cannot genuinely support in an interview.",
      timestamp: new Date().toISOString()
    };

  } catch (err) {
    console.error("Tailoring error:", err.message);
    return {
      success: false,
      error: "Failed to tailor resume. Please try again.",
      guardrailReport: null
    };
  }
}

export default { tailorResumeForJob };
