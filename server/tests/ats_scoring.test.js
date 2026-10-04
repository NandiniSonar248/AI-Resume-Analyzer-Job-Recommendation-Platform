/**
 * ats_scoring.test.js — ATS Deterministic Scoring & Parsing Test Suite
 * ======================================================================
 * Tests:
 * 1. Rule-based ATS scorer (4 sub-scores: 35/25/20/20 weights, math bounds)
 * 2. Parseability checker (format inspection, score bounds, issue alerts)
 * 3. Sentence explainability (green/red impact annotations)
 *
 * NOTE on API shapes (match actual implementations):
 * - ruleBasedScorer returns: { overallScore, subScores: { skillsCoverage, keywordMatch, experienceMatch, formattingCompatibility } }
 *   each sub-score is an OBJECT with a `.score` property (not a flat number).
 * - parseabilityChecker is ASYNC and takes (filePath, originalName, rawText)
 *   — for text-only checks, pass (null, ".txt", rawText).
 * - explainability returns highlights where each item has { text, status, reason, matchedSkills }
 *   status is "positive" | "negative" | "neutral" (not "type").
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { calculateRuleBasedScore } from "../services/ats/ruleBasedScorer.js";
import { checkParseability } from "../services/ats/parseabilityChecker.js";
import { generateSentenceHighlights } from "../services/ats/explainability.js";

describe("ATS Scoring & Parsing Suite", () => {
  const sampleJD = `
Senior Software Engineer
Requirements:
- 3+ years experience with React, Node.js, and TypeScript
- Strong knowledge of REST APIs, MongoDB, and AWS
- Proven track record optimizing web performance and database indexing
`;

  const strongResume = `
Alex Morgan — Senior Full-Stack Engineer | alex@example.com
Summary:
Results-driven engineer with 4+ years developing high-throughput web applications using React, Node.js, TypeScript, and MongoDB.

Experience:
Senior Developer | Acme Cloud Services | 2021 - Present
- Architected REST APIs using Node.js and TypeScript, handling over 10M daily requests.
- Optimized MongoDB database indexing and aggregation pipelines, reducing API response latency by 35%.
- Built high-performance React frontends deployed on AWS cloud architecture.

Skills:
React, Node.js, TypeScript, REST APIs, MongoDB, AWS, Git, Web Performance
`;

  const weakResume = `
John Smith
Worked in general sales and retail for 2 years. Responsible for customer communication and inventory tracking.
`;

  describe("Rule-Based ATS Scorer (4-Factor Model)", () => {
    test("should compute all 4 sub-scores with expected weight contributions", () => {
      const result = calculateRuleBasedScore(strongResume, sampleJD);

      assert.ok(result.overallScore >= 0 && result.overallScore <= 100, "Overall score must be 0-100");
      assert.ok(result.subScores, "Must return subScores object");

      // Each sub-score is an OBJECT with a .score property (not a bare number)
      assert.ok(result.subScores.skillsCoverage !== undefined, "Must compute skillsCoverage sub-score");
      assert.ok(result.subScores.skillsCoverage.score !== undefined, "skillsCoverage must have .score");

      assert.ok(result.subScores.keywordMatch !== undefined, "Must compute keywordMatch sub-score");
      assert.ok(result.subScores.keywordMatch.score !== undefined, "keywordMatch must have .score");

      assert.ok(result.subScores.experienceMatch !== undefined, "Must compute experienceMatch sub-score");
      assert.ok(result.subScores.experienceMatch.score !== undefined, "experienceMatch must have .score");

      assert.ok(result.subScores.formattingCompatibility !== undefined, "Must compute formattingCompatibility sub-score");
      assert.ok(result.subScores.formattingCompatibility.score !== undefined, "formattingCompatibility must have .score");

      // Verify weights: 35% Skills, 25% Keyword Frequency, 20% Experience, 20% Formatting
      const calculatedTotal = Math.round(
        result.subScores.skillsCoverage.score * 0.35 +
        result.subScores.keywordMatch.score * 0.25 +
        result.subScores.experienceMatch.score * 0.20 +
        result.subScores.formattingCompatibility.score * 0.20
      );
      assert.equal(result.overallScore, calculatedTotal, "Overall score must equal weighted sub-score sum");
    });

    test("strong resume should score substantially higher than an unrelated resume", () => {
      const strongResult = calculateRuleBasedScore(strongResume, sampleJD);
      const weakResult = calculateRuleBasedScore(weakResume, sampleJD);

      assert.ok(
        strongResult.overallScore > weakResult.overallScore + 25,
        `Strong resume (${strongResult.overallScore}) should be >25 points higher than weak resume (${weakResult.overallScore})`
      );
    });

    test("should correctly classify matched vs missing keywords", () => {
      const result = calculateRuleBasedScore(strongResume, sampleJD);

      assert.ok(result.matchedKeywords.length > 0, "Strong resume must match key JD terms");
      const matchedLower = result.matchedKeywords.map(k => k.toLowerCase());
      assert.ok(matchedLower.includes("react"), "Must match 'react'");
      assert.ok(matchedLower.includes("node.js") || matchedLower.includes("node"), "Must match 'node'");
    });
  });

  describe("Parseability Checker", () => {
    test("should return score and issue breakdown for clean text", async () => {
      // checkParseability is async and takes (filePath, originalName, rawText)
      // Pass null for filePath and ".txt" as originalName for text-only checks
      const result = await checkParseability(null, ".txt", strongResume);

      assert.ok(result.score >= 80, `Clean standard resume text should have high parseability score (got ${result.score})`);
      assert.ok(Array.isArray(result.issues), "Must return issues array");
      // Rating labels from actual implementation: "Optimal ATS Format", "Acceptable ATS Format", "Needs Formatting Cleanup"
      assert.ok(
        ["Optimal ATS Format", "Acceptable ATS Format", "Needs Formatting Cleanup"].includes(result.rating),
        `Rating must be valid label (got "${result.rating}")`
      );
    });
  });

  describe("Sentence-Level Explainability", () => {
    test("should identify strong bullet points with action verbs and metrics", () => {
      // Production flow: first compute ATS score, then pass matched keywords for context.
      // generateSentenceHighlights uses matchedKeywords to detect which resume sentences
      // contain JD-relevant skills. Without keyword context, only action verbs & metrics fire.
      const scoreResult = calculateRuleBasedScore(strongResume, sampleJD);
      const result = generateSentenceHighlights(
        strongResume,
        sampleJD,
        scoreResult.matchedKeywords,
        scoreResult.missingKeywords
      );

      assert.ok(Array.isArray(result.highlights), "Must return array of highlighted sentences");
      assert.ok(result.highlights.length > 0, "Must highlight multiple sentences");

      // status is "positive" | "negative" | "neutral"  (NOT "type")
      const positiveHighlights = result.highlights.filter(h => h.status === "positive");
      assert.ok(positiveHighlights.length > 0, "Must identify positive impact sentences");

      // Sentences with quantified metrics ("35%" or "10M") should be tagged positive
      // Each highlight has .text (not .sentence)
      const quantifiedSentence = positiveHighlights.find(
        h => h.text.includes("35%") || h.text.includes("10M")
      );
      assert.ok(quantifiedSentence, "Quantified metric sentence should be tagged positive");
      assert.ok(quantifiedSentence.reason && quantifiedSentence.reason.length > 0, "Must provide explicit reason for annotation");
    });
  });
});
