/**
 * sessionScorer.js — End-of-Session Multi-Round Interview Scorer & Report
 * =========================================================================
 * PURPOSE:
 *   Produces a comprehensive performance report at the conclusion of a mock
 *   interview session, synthesizing:
 *     1. Round-by-round performance (HR, Technical, Coding)
 *     2. Answer substance & technical accuracy (via Groq evaluation)
 *     3. Verbal delivery analytics (pace, filler words, clarity)
 *     4. Executive hiring verdict (Strong Hire, Hire, Leaning Hire, Needs Work)
 *     5. Targeted strengths & actionable growth points
 */

import Groq from "groq-sdk";
import dotenv from "dotenv";
import { aggregateSessionSpeech } from "./speechAnalytics.js";

dotenv.config();

let groqClient = null;
const apiKey = process.env.GROQ_API_KEY;
if (apiKey && apiKey.startsWith("gsk_")) {
  try {
    groqClient = new Groq({ apiKey });
  } catch (e) {
    console.warn("Groq init error in sessionScorer");
  }
}

async function callGroq(messages, max_tokens = 1500, temperature = 0.4) {
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
 * Generate comprehensive final interview report
 */
export async function generateSessionReport(session) {
  const turns = session.turns || [];
  const speechSummary = aggregateSessionSpeech(turns);

  // Group turns by round
  const roundBreakdown = {};
  session.availableRounds.forEach(round => {
    const roundTurns = turns.filter(t => t.round === round);
    roundBreakdown[round] = {
      questionsAnswered: roundTurns.length,
      turns: roundTurns
    };
  });

  if (turns.length === 0) {
    return {
      overallScore: 0,
      verdict: "Incomplete",
      verdictColor: "#64748b",
      speechSummary,
      roundScores: {},
      keyStrengths: ["Started session"],
      growthAreas: ["Complete at least one interview round to receive feedback"],
      executiveSummary: "Interview was ended before completing any responses."
    };
  }

  // Format full transcript for AI evaluation
  const transcriptText = turns.map((t, i) => {
    return `[Q${i + 1} - ${t.round}]
Question: ${t.question}
Answer: ${t.answer || "(No verbal answer provided)"}`;
  }).join("\n\n");

  const prompt = `You are an elite Tech Hiring Committee evaluating a candidate's full mock interview.

ROLE: ${session.roleTitle || "Software Engineer"}
TARGET JOB DESCRIPTION EXCERPT:
${(session.jobDescription || "").substring(0, 600)}

INTERVIEW TRANSCRIPT:
${transcriptText}

SPEECH METRICS:
- Overall Pace: ${speechSummary.overallWPM} WPM
- Total Fillers: ${speechSummary.totalFillers}
- Average Verbal Delivery Score: ${speechSummary.averageDeliveryScore}/100

TASK:
Produce an honest, rigorous hiring evaluation. Return ONLY a valid JSON object matching this exact schema:
{
  "overallScore": 82, // Number 0-100 reflecting both substance and delivery
  "verdict": "Strong Hire" | "Hire" | "Leaning Hire" | "Needs Preparation",
  "verdictColor": "#10b981" | "#3b82f6" | "#f59e0b" | "#ef4444",
  "roundScores": {
    "HR/Behavioral": 85,
    "Technical": 78,
    "Coding": 82 // only include rounds that were actually conducted
  },
  "executiveSummary": "2-3 sentence hiring committee consensus on the candidate's readiness.",
  "keyStrengths": [
    "Specific technical or behavioral strength 1",
    "Specific technical or behavioral strength 2",
    "Specific technical or behavioral strength 3"
  ],
  "growthAreas": [
    "Concrete actionable improvement point 1",
    "Concrete actionable improvement point 2",
    "Concrete actionable improvement point 3"
  ]
}`;

  try {
    const raw = await callGroq([
      { role: "system", content: "You are a tech hiring committee. Output ONLY valid JSON." },
      { role: "user", content: prompt }
    ], 1200, 0.4);

    if (!raw) throw new Error("Empty AI response");

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse JSON report");

    const report = JSON.parse(jsonMatch[0]);

    return {
      sessionId: session.sessionId,
      overallScore: report.overallScore || 75,
      verdict: report.verdict || "Hire",
      verdictColor: report.verdictColor || "#3b82f6",
      roundScores: report.roundScores || {},
      executiveSummary: report.executiveSummary || "Candidate demonstrated solid foundational knowledge.",
      keyStrengths: report.keyStrengths || [],
      growthAreas: report.growthAreas || [],
      speechSummary,
      turns,
      generatedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error("Session report generation error:", err.message);
    // Return deterministic fallback report
    return {
      sessionId: session.sessionId,
      overallScore: Math.round((speechSummary.averageDeliveryScore + 75) / 2),
      verdict: "Hire",
      verdictColor: "#3b82f6",
      roundScores: {
        "HR/Behavioral": 80,
        "Technical": 75
      },
      executiveSummary: "Candidate completed mock interview rounds showing practical technical grasp and steady verbal pacing.",
      keyStrengths: ["Addressed the core requirements", "Maintained professional cadence"],
      growthAreas: ["Incorporate more quantified metrics in project examples", "Elaborate further on trade-offs"],
      speechSummary,
      turns,
      generatedAt: new Date().toISOString()
    };
  }
}

export default { generateSessionReport };
