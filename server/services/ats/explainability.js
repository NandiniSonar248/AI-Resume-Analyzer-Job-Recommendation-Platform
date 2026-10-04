/**
 * explainability.js — Sentence-Level ATS Explainability Engine
 * =====================================================================
 * PURPOSE:
 *   Demystifies the ATS score by mapping findings directly to the candidate's
 *   resume text. It annotates sentences with a positive (green) or
 *   negative/weak (red/amber) impact tag and provides specific hover reasons.
 *
 * HOW IT WORKS:
 *   1. Text Segmentation:
 *      - Parses the resume text into logical sentences and bullet points,
 *        preserving bullet markers and line breaks.
 *   2. Sentence Impact Analysis:
 *      - Positive criteria:
 *        * Mentions required JD skills & tech keywords
 *        * Uses strong action verbs (Engineered, Spearheaded, Automated)
 *        * Contains quantified metrics (% improvements, revenue, latency, user scale)
 *      - Negative / Weak criteria:
 *        * Vague filler phrases ("responsible for", "handled various tasks", "team player")
 *        * Passive statements lacking tangible skills or metrics
 *        * Overly generic buzzwords without technical grounding
 *      - Neutral criteria:
 *        * Section headers, contact information, education degree lines
 *   3. Tooltip Reason Generation:
 *      - Generates exact explainable explanations of why each sentence helped or hurt the ATS match.
 */

const STRONG_ACTION_VERBS = new Set([
  "architected", "engineered", "developed", "built", "implemented", "optimized",
  "spearheaded", "automated", "designed", "streamlined", "scaled", "delivered",
  "reduced", "increased", "boosted", "orchestrated", "deployed", "refactored",
  "accelerated", "migrated", "mentored", "executed", "collaborated"
]);

const WEAK_FILLER_PHRASES = [
  "responsible for", "duties included", "worked on various", "handled day to day",
  "assisted with", "helped out", "hardworking", "detail-oriented individual",
  "good communication skills", "team player with passion", "participated in tasks"
];

const METRIC_PATTERNS = [
  /\b\d{1,3}%\b/,                         // e.g. 40%, 15%
  /\$\s*\d+[\d,.]*(?:k|m|b)?\b/i,          // e.g. $50k, $1.2M
  /\b(?:reduced|increased|improved|boosted|saved|grew)\s+[^.]+?\b(?:by\s+)?\d+/i,
  /\b\d+\s*(?:ms|seconds|minutes|hours)\b/i, // e.g. 200ms
  /\b\d+(?:k|m|\+)?\s*(?:users|clients|requests|transactions|downloads)\b/i // e.g. 100k users
];

/**
 * Split text into sentences and bullet points
 */
function splitIntoSentences(text) {
  if (!text) return [];

  // Split on double newlines or bullet prefixes
  const lines = text.split(/(?:\r?\n)+/);
  const sentences = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // If line has bullet point or is short header
    if (/^[•\-\*–]\s*/.test(trimmed) || trimmed.length < 80) {
      sentences.push(trimmed.replace(/^[•\-\*–]\s*/, ""));
    } else {
      // Split paragraph into sentences on period/exclamation followed by space
      const subSentences = trimmed.split(/(?<=[.!?])\s+(?=[A-Z0-9])/);
      for (const s of subSentences) {
        if (s.trim()) sentences.push(s.trim());
      }
    }
  }

  return sentences.filter(s => s.length > 5);
}

/**
 * Generate sentence-level explainability highlights
 */
export function generateSentenceHighlights(resumeText, jdText, matchedKeywords = [], missingKeywords = []) {
  const sentences = splitIntoSentences(resumeText);
  const matchedSet = new Set(matchedKeywords.map(k => k.toLowerCase()));
  const missingSet = new Set(missingKeywords.map(k => k.toLowerCase()));

  const highlights = [];
  let positiveCount = 0;
  let negativeCount = 0;

  sentences.forEach((sentence, index) => {
    const lower = sentence.toLowerCase();
    const words = lower.split(/[^a-z0-9+#]/).filter(Boolean);

    // 1. Check matching technical keywords in this sentence
    const foundMatched = [];
    for (const kw of matchedSet) {
      if (lower.includes(kw) && kw.length > 2) {
        foundMatched.push(kw);
      }
    }

    // 2. Check for action verbs
    const foundVerbs = words.filter(w => STRONG_ACTION_VERBS.has(w));

    // 3. Check for quantified metrics
    const hasMetric = METRIC_PATTERNS.some(pattern => pattern.test(sentence));

    // 4. Check for weak filler phrasing
    const hasWeakPhrase = WEAK_FILLER_PHRASES.some(phrase => lower.includes(phrase));

    // Determine Status & Reason
    let status = "neutral";
    let scoreImpact = "Neutral";
    let reason = "Standard descriptive statement.";

    if (foundMatched.length >= 2 || (foundMatched.length >= 1 && (hasMetric || foundVerbs.length >= 1))) {
      status = "positive";
      positiveCount++;
      scoreImpact = "+ Positive ATS Signal";

      const details = [];
      if (foundMatched.length > 0) details.push(`Contains target skills (${foundMatched.slice(0, 3).join(", ")})`);
      if (foundVerbs.length > 0) details.push(`Strong action verb "${foundVerbs[0]}"`);
      if (hasMetric) details.push("Quantified measurable result");

      reason = `Boosts ATS Score: ${details.join(" + ")}.`;
    } else if (hasWeakPhrase || (words.length > 10 && foundMatched.length === 0 && foundVerbs.length === 0 && !hasMetric)) {
      status = "negative";
      negativeCount++;
      scoreImpact = "- Improvement Needed";

      if (hasWeakPhrase) {
        reason = "Hurts Impact: Uses passive/generic filler phrase instead of actionable accomplishments.";
      } else {
        reason = "Low ATS Signal: Sentence contains no target skills from job description or quantifiable outcome.";
      }
    }

    highlights.push({
      id: index + 1,
      text: sentence,
      status, // 'positive' | 'negative' | 'neutral'
      scoreImpact,
      reason,
      matchedSkills: foundMatched.slice(0, 4)
    });
  });

  return {
    highlights,
    summary: {
      totalAnalyzed: highlights.length,
      positiveSentences: positiveCount,
      improvementAreas: negativeCount,
      neutralSentences: highlights.length - positiveCount - negativeCount,
      impactScore: highlights.length > 0 ? Math.round((positiveCount / highlights.length) * 100) : 0
    }
  };
}

export default {
  generateSentenceHighlights
};
