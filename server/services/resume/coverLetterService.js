/**
 * coverLetterService.js — JD-Matched Cover Letter Generator
 * ===========================================================
 * PURPOSE:
 *   Generates a professional, personalized cover letter using the resume and
 *   JD context already gathered during the ATS analysis flow. Rather than a
 *   generic template, it pulls specific matched skills and experience from
 *   the resume to write a genuinely tailored letter.
 *
 * HOW IT CONNECTS TO THE SYSTEM:
 *   - Called by: server/routes/resumeRoutes.js POST /api/resume/cover-letter
 *   - Input:  { resumeText, jobDescription, userName?, companyName?, roleName? }
 *   - Output: { success, coverLetter, wordCount, timestamp }
 *   - The frontend Phase 3 tab calls this after ATS analysis completes
 *
 * DESIGN DECISIONS:
 *   - Low temperature (0.5) for factual grounding, high enough for natural language
 *   - Structured prompt forces a 3-paragraph professional structure
 *   - Same Groq model-fallback chain used across all AI services for consistency
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
    console.warn("Groq init error in coverLetterService");
  }
}

async function callGroq(messages, max_tokens = 1200, temperature = 0.5) {
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
 * Generate a JD-matched cover letter from resume + JD context
 */
export async function generateCoverLetter(resumeText, jobDescription, options = {}) {
  if (!groqClient) {
    return {
      success: false,
      error: "AI service unavailable. Please check your GROQ_API_KEY."
    };
  }

  const { userName = "the candidate", companyName = "your company", roleName = "this role" } = options;

  const prompt = `You are writing a professional job application cover letter.

CANDIDATE'S RESUME:
<resume>
${resumeText.substring(0, 2500)}
</resume>

JOB DESCRIPTION:
<jd>
${jobDescription.substring(0, 1200)}
</jd>

CONTEXT:
- Candidate Name: ${userName}
- Company: ${companyName}
- Role: ${roleName}

INSTRUCTIONS:
Write a 3-paragraph professional cover letter following this structure:

Paragraph 1 (Opening — 2-3 sentences):
- Express genuine interest in the specific role and company
- Mention one specific thing about the role/company that aligns with the candidate's background (use real details from JD)
- Do NOT use generic openings like "I am writing to apply for..."

Paragraph 2 (Value — 3-4 sentences):
- Highlight 2-3 specific skills/experiences from the resume that directly match JD requirements
- Use concrete examples from their actual experience (from the resume)
- Do NOT invent experiences or metrics not present in the resume

Paragraph 3 (Close — 2 sentences):
- Express enthusiasm for next steps
- Professional sign-off

Write in first person. Keep total length under 350 words.
Return ONLY the letter text. No subject lines, no "Dear Hiring Manager" header (the user will add their own), no commentary.`;

  try {
    const coverLetter = await callGroq([
      {
        role: "system",
        content: "You are an expert career coach writing concise, impactful cover letters anchored to the candidate's real experience."
      },
      { role: "user", content: prompt }
    ], 1200, 0.5);

    if (!coverLetter) throw new Error("Empty AI response");

    const wordCount = coverLetter.trim().split(/\s+/).length;

    return {
      success: true,
      coverLetter: coverLetter.trim(),
      wordCount,
      timestamp: new Date().toISOString()
    };

  } catch (err) {
    console.error("Cover letter generation error:", err.message);
    return {
      success: false,
      error: "Failed to generate cover letter. Please try again."
    };
  }
}

export default { generateCoverLetter };
