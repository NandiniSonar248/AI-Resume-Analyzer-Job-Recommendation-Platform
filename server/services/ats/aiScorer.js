/**
 * aiScorer.js — Qualitative AI Assessment Layer (Groq Llama 3)
 * =====================================================================
 * PURPOSE:
 *   Provides qualitative, in-depth recruiter-style feedback running in parallel
 *   with the deterministic rule-based scorer. It never overrides or artificially
 *   inflates the rule-based score numbers, giving the user both hard data
 *   and conversational AI guidance side by side.
 */

import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

let groqClient = null;
const apiKey = process.env.GROQ_API_KEY;

if (apiKey && apiKey !== "your_groq_api_key_here" && apiKey.startsWith("gsk_")) {
  try {
    groqClient = new Groq({ apiKey });
  } catch (e) {
    console.warn("Groq initialization error in aiScorer");
  }
}

/**
 * Call Groq with model fallback list
 */
async function callGroqAssessment(messages, max_tokens = 900, temperature = 0.5) {
  if (!groqClient) return null;

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
        messages,
        model,
        temperature,
        max_tokens
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
 * Generate qualitative AI assessment
 */
export async function getAiAssessment(resumeText, jdText, ruleBasedResults) {
  if (!groqClient) {
    return {
      aiAvailable: false,
      summary: "AI service offline. Using deterministic rule-based analysis.",
      keyStrengths: ["Extracted core keyword matches directly from job description"],
      criticalGaps: ruleBasedResults.missingKeywords.slice(0, 5),
      actionableTips: [
        "Include missing technical keywords in your skills and experience sections",
        "Quantify your bullet points with measurable percentage and scale outcomes"
      ]
    };
  }

  const prompt = `You are a Senior Technical Recruiter and ATS Specialist conducting an executive review of a candidate's resume for a specific job posting.

JOB DESCRIPTION:
${jdText.substring(0, 1500)}

RESUME EXCERPT:
${resumeText.substring(0, 2000)}

DETERMINISTIC DATA:
- Rule-based ATS Match: ${ruleBasedResults.overallScore}%
- Matched Skills: ${ruleBasedResults.matchedKeywords.slice(0, 8).join(", ")}
- Missing Skills: ${ruleBasedResults.missingKeywords.slice(0, 8).join(", ")}

TASK: Provide an honest, professional qualitative evaluation.

Respond strictly in JSON format:
{
  "executiveSummary": "2-3 concise sentences summarizing candidate readiness for this exact role.",
  "keyStrengths": [
    "Specific strength 1 with evidence from resume",
    "Specific strength 2 with evidence from resume"
  ],
  "criticalGaps": [
    "Missing requirement 1 with advice on how to bridge it",
    "Missing requirement 2 with advice on how to bridge it"
  ],
  "actionableTips": [
    "Immediate step 1 to improve resume for this role",
    "Immediate step 2 to improve resume for this role"
  ],
  "recruiterPerspective": "One sentence explaining what a human recruiter will think in their 6-second scan."
}

Return ONLY the JSON object, with no markdown formatting around it.`;

  try {
    const rawResponse = await callGroqAssessment([
      {
        role: "system",
        content: "You are an expert technical recruiter providing JSON-formatted candidate assessments."
      },
      {
        role: "user",
        content: prompt
      }
    ], 900, 0.4);

    if (!rawResponse) throw new Error("Empty AI response");

    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse JSON from AI response");

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      aiAvailable: true,
      executiveSummary: parsed.executiveSummary || "Resume evaluated against target job description.",
      keyStrengths: parsed.keyStrengths || [],
      criticalGaps: parsed.criticalGaps || [],
      actionableTips: parsed.actionableTips || [],
      recruiterPerspective: parsed.recruiterPerspective || ""
    };
  } catch (err) {
    console.warn("AI assessment failed, returning fallback advice:", err.message);
    return {
      aiAvailable: false,
      executiveSummary: `Resume evaluated with ${ruleBasedResults.overallScore}% ATS alignment. Focus on adding high-frequency missing technical keywords.`,
      keyStrengths: ruleBasedResults.matchedKeywords.slice(0, 4).map(k => `Demonstrated proficiency in ${k}`),
      criticalGaps: ruleBasedResults.missingKeywords.slice(0, 4).map(k => `Missing explicit keyword: ${k}`),
      actionableTips: [
        "Mirror exact terminology from the job description in your experience bullet points.",
        "Add measurable metrics (e.g. latency reduced by X%, users scaled to Y) to make bullets impactful."
      ],
      recruiterPerspective: "A human recruiter will look for direct skill matches in the top third of your resume."
    };
  }
}

export default {
  getAiAssessment
};
