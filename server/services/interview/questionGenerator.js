/**
 * questionGenerator.js — Adaptive Real-Time Interview Question Generator
 * =========================================================================
 * PURPOSE:
 *   Generates the NEXT interview question dynamically based on the candidate's
 *   previous answer, rather than serving a pre-generated static list.
 *
 * HOW IT ADAPTS:
 *   - Feeds the full conversational history (`getConversationTranscript()`)
 *     plus the candidate's immediate last answer into the LLM prompt.
 *   - The prompt instructs the model to behave like a senior human interviewer:
 *     drill deeper into claims made, ask for edge-case reasoning, challenge
 *     trade-offs, or transition logically to the next critical requirement.
 *   - Ensures questions are anchored to both the Job Description requirements
 *     and the candidate's actual resume experience.
 *
 * ROUND-SPECIFIC STRATEGIES:
 *   - HR / Behavioral: STAR format (Situation, Task, Action, Result), leadership,
 *     conflict handling, prioritization under pressure.
 *   - Technical: System design, concurrency, DB indexing, API contracts,
 *     distributed systems trade-offs specifically matching JD technologies.
 *   - Coding / Problem Solving: Data structure choices, algorithmic complexity
 *     (time/space), boundary conditions, and refactoring strategies.
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
    console.warn("Groq init error in questionGenerator");
  }
}

async function callGroq(messages, max_tokens = 800, temperature = 0.5) {
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
 * Fallback questions if AI call fails
 */
function getFallbackQuestion(roundType, questionNumber) {
  const fallbacks = {
    "HR/Behavioral": [
      "Can you walk me through a challenging project where you had to collaborate with difficult stakeholders, and how you ensured successful delivery?",
      "Tell me about a time when a critical bug or outage occurred in production. How did you diagnose it, communicate with the team, and resolve it?",
      "How do you prioritize competing deadlines when multiple high-priority tasks land on your plate simultaneously?"
    ],
    "Technical": [
      "Based on the core technologies in this role, how would you design a scalable service that handles high-concurrency read and write operations?",
      "Can you explain a technical trade-off you had to make between system latency and data consistency in a past project?",
      "How do you approach database schema design and indexing when query performance begins to degrade under scale?"
    ],
    "Coding": [
      "If you had to design an in-memory caching mechanism with LRU eviction policy, what data structures would you select and what are their time complexities?",
      "How do you handle edge cases such as memory limits, concurrent access, and corrupted inputs in production data pipelines?",
      "Walk me through how you would optimize an algorithm that currently runs in O(N^2) time to O(N log N) or O(N)."
    ]
  };

  const list = fallbacks[roundType] || fallbacks["Technical"];
  const text = list[(questionNumber - 1) % list.length];
  return {
    question: text,
    focusArea: roundType,
    expectedAspects: ["Clarity of explanation", "Concrete examples", "Trade-off awareness"]
  };
}

/**
 * Main: Generate the next dynamic, adaptive interview question
 */
export async function generateNextQuestion({
  roundType,
  questionNumber,
  totalQuestions = 3,
  jobDescription = "",
  resumeText = "",
  conversationHistory = "",
  lastAnswer = ""
}) {
  if (!groqClient) {
    return getFallbackQuestion(roundType, questionNumber);
  }

  const isFollowUp = questionNumber > 1 && lastAnswer && lastAnswer.trim().length > 10;

  const systemPrompt = `You are a Principal Engineer and seasoned Tech Hiring Manager conducting a live ${roundType} interview.
Your goal is to conduct a realistic, challenging, conversational interview.

RULES:
1. Speak in a natural, direct interviewer tone.
2. Keep questions concise (1 to 3 sentences maximum) so they sound like natural speech when read aloud.
3. ${isFollowUp
    ? "MANDATORY ADAPTIVE RULE: You MUST acknowledge or challenge something specific from the candidate's last answer! Drill deeper into their reasoning, ask about edge cases, or ask how they would measure success."
    : "This is the first question of this round. Ask a focused, role-relevant question anchored to their resume background and the target JD."
  }
4. Return ONLY valid JSON matching this schema:
{
  "question": "The spoken interview question",
  "focusArea": "Short 2-3 word topic (e.g. 'DB Optimization', 'STAR Conflict')",
  "expectedAspects": ["Key aspect 1", "Key aspect 2"]
}`;

  const userPrompt = `TARGET JOB DESCRIPTION:
<jd>
${jobDescription.substring(0, 1000)}
</jd>

CANDIDATE RESUME SUMMARY:
<resume>
${resumeText.substring(0, 1500)}
</resume>

ROUND TYPE: ${roundType}
QUESTION NUMBER: ${questionNumber} of ${totalQuestions}

CONVERSATION TRANSCRIPT SO FAR:
${conversationHistory || "No prior questions in this session."}

${isFollowUp ? `CANDIDATE'S MOST RECENT ANSWER:\n"${lastAnswer}"\n\nGenerate a sharp follow-up question that builds directly upon this answer.` : "Generate the opening question for this round."}`;

  try {
    const raw = await callGroq([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ], 600, 0.5);

    if (!raw) throw new Error("Empty AI response");

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse JSON from AI question response");

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.question) throw new Error("Missing question in JSON");

    return {
      question: parsed.question,
      focusArea: parsed.focusArea || roundType,
      expectedAspects: parsed.expectedAspects || ["Technical depth", "Clear reasoning"]
    };
  } catch (err) {
    console.error("Adaptive question generation error:", err.message);
    return getFallbackQuestion(roundType, questionNumber);
  }
}

export default { generateNextQuestion };
