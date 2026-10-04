/**
 * skillGapService.js — Structured Skill-Gap Learning Roadmap Generator
 * ======================================================================
 * PURPOSE:
 *   For each required JD skill that is MISSING from the candidate's resume,
 *   generates a short, structured learning path per SPEC.md:
 *     "what it is, a free resource to learn it, a project idea to demonstrate
 *      it, and how to phrase it on a resume once learned."
 *
 * HOW IT WORKS:
 *   1. Takes the missingKeywords array already computed by ruleBasedScorer.js
 *      (so we never re-run the ATS logic — we reuse the existing output).
 *   2. For each missing skill (up to MAX_SKILLS to avoid token bloat), asks
 *      Groq to produce the 4-part learning path.
 *   3. Returns a structured array of roadmap items the frontend renders as cards.
 *
 * HOW IT CONNECTS TO THE SYSTEM:
 *   - Called by: server/routes/resumeRoutes.js POST /api/resume/skill-gap
 *   - Input:  { missingSkills: string[], jobDescription: string }
 *     (missingSkills comes directly from the analyzeRoutes.js response the
 *      frontend already has — no duplicate file processing needed)
 *   - Output: { success, roadmap: SkillRoadmapItem[], timestamp }
 *
 * DESIGN DECISION — Batch vs. per-skill API calls:
 *   One single Groq call with all missing skills batched into a JSON-response
 *   prompt is far more efficient than N separate calls (one per skill). We ask
 *   for a JSON array and parse it. This reduces latency from O(N * 800ms) to
 *   O(1 * 800ms).
 */

import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const MAX_SKILLS = 8; // Cap to prevent enormous token usage

let groqClient = null;
const apiKey = process.env.GROQ_API_KEY;
if (apiKey && apiKey.startsWith("gsk_")) {
  try {
    groqClient = new Groq({ apiKey });
  } catch (e) {
    console.warn("Groq init error in skillGapService");
  }
}

async function callGroq(messages, max_tokens = 2000, temperature = 0.4) {
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
 * Fallback: generate a basic roadmap item without AI for a given skill
 */
function fallbackRoadmapItem(skill) {
  return {
    skill,
    whatItIs: `${skill} is a technology/skill required for this role. Search for official documentation or beginner tutorials to get started.`,
    freeResource: `Search "learn ${skill} free" on YouTube or visit freeCodeCamp.org, The Odin Project, or official docs.`,
    projectIdea: `Build a small demo project using ${skill} and deploy it on GitHub to showcase hands-on experience.`,
    resumePhrase: `Developed projects using ${skill}, demonstrating practical understanding of core concepts.`,
    estimatedTime: "2–6 weeks",
    priority: "medium"
  };
}

/**
 * Generate structured skill-gap learning roadmap
 */
export async function generateSkillGapRoadmap(missingSkills, jobDescription = "") {
  if (!missingSkills || missingSkills.length === 0) {
    return {
      success: true,
      roadmap: [],
      message: "No skill gaps detected — your resume already covers the key JD requirements!",
      timestamp: new Date().toISOString()
    };
  }

  // Limit to most impactful missing skills
  const skillsToProcess = missingSkills.slice(0, MAX_SKILLS);

  if (!groqClient) {
    // Return fallback roadmap without AI
    return {
      success: true,
      roadmap: skillsToProcess.map(fallbackRoadmapItem),
      aiGenerated: false,
      timestamp: new Date().toISOString()
    };
  }

  const prompt = `You are a senior software engineer and career coach. Generate a practical learning roadmap for a job seeker who is missing these skills required in a job description.

MISSING SKILLS: ${skillsToProcess.join(", ")}

JOB CONTEXT (first 600 chars of JD):
${jobDescription.substring(0, 600)}

For EACH skill in the missing skills list, produce a JSON object. Return a valid JSON array (no markdown, no code fences, just raw JSON):

[
  {
    "skill": "exact skill name from the list",
    "whatItIs": "1-2 sentence plain-English explanation of what this skill is and why employers want it",
    "freeResource": "ONE specific free learning resource with name and URL (e.g. 'MDN Web Docs — https://developer.mozilla.org'). Must be a real, working free resource.",
    "projectIdea": "1-2 sentence concrete project idea the candidate can build in 1-2 weeks to demonstrate this skill",
    "resumePhrase": "One ready-to-use resume bullet point template showing how to phrase this skill once learned (use [X] as placeholder for a specific metric)",
    "estimatedTime": "Rough honest time estimate like '2-4 weeks' or '1-2 months'",
    "priority": "high | medium | low based on how central this skill appears to be in the JD"
  }
]

RULES:
- Free resources must be genuinely free and real (no paywalled courses)
- Prefer official docs, MDN, freeCodeCamp, The Odin Project, CS50, official YouTube channels
- Do NOT recommend Udemy paid courses or Coursera paid tracks
- Project ideas must be achievable in 1-4 weeks by a self-learner
- Resume phrases must be specific enough to be useful, not generic like "Learned X"`;

  try {
    const rawResponse = await callGroq([
      {
        role: "system",
        content: "You are a career coach. Return ONLY valid JSON array, no markdown, no explanation."
      },
      { role: "user", content: prompt }
    ], 2000, 0.4);

    if (!rawResponse) throw new Error("Empty AI response");

    // Parse JSON — extract array even if model adds extra text
    const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Could not extract JSON array from AI response");

    const roadmap = JSON.parse(jsonMatch[0]);

    // Validate shape and fill missing fields with fallback
    const validated = roadmap.map(item => ({
      skill: item.skill || "Unknown",
      whatItIs: item.whatItIs || fallbackRoadmapItem(item.skill).whatItIs,
      freeResource: item.freeResource || fallbackRoadmapItem(item.skill).freeResource,
      projectIdea: item.projectIdea || fallbackRoadmapItem(item.skill).projectIdea,
      resumePhrase: item.resumePhrase || fallbackRoadmapItem(item.skill).resumePhrase,
      estimatedTime: item.estimatedTime || "2–4 weeks",
      priority: ["high", "medium", "low"].includes(item.priority) ? item.priority : "medium"
    }));

    return {
      success: true,
      roadmap: validated,
      aiGenerated: true,
      totalGaps: missingSkills.length,
      shownGaps: skillsToProcess.length,
      timestamp: new Date().toISOString()
    };

  } catch (err) {
    console.error("Skill gap roadmap error:", err.message);
    // Return fallback roadmap rather than a hard failure
    return {
      success: true,
      roadmap: skillsToProcess.map(fallbackRoadmapItem),
      aiGenerated: false,
      timestamp: new Date().toISOString()
    };
  }
}

export default { generateSkillGapRoadmap };
