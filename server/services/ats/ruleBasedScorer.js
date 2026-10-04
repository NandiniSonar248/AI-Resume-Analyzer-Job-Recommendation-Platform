/**
 * ruleBasedScorer.js — Deterministic Multi-Factor ATS Scoring Engine
 * =====================================================================
 * PURPOSE:
 *   Calculates an explainable, multi-factor ATS match score using 4 weighted
 *   sub-scores rather than one opaque number.
 *
 * SUB-SCORES & SCORING FORMULAS:
 *
 * 1. Keyword Frequency Match (Weight: 25%)
 *    - Formula: Compares term frequency (TF) of important JD keywords in resume vs JD.
 *    - Normalized ratio: (matchedKeywordsFrequency / expectedKeywordsFrequency) * 100
 *    - Bonus: +3 pts per critical tech stack keyword match (capped at 15 pts).
 *
 * 2. Required Skills Coverage (Weight: 35%)
 *    - Formula: (matchedRequiredSkills.length / totalRequiredSkills.length) * 100
 *    - Evaluates exact hard skills & tech proficiencies extracted from JD requirements.
 *
 * 3. Experience Level Match (Weight: 20%)
 *    - Formula:
 *      * JD Experience extraction: detects required years (e.g. "5+ years", "3-5 yrs", "Senior", "Lead")
 *      * Resume Experience extraction: detects candidate total years and career level keywords
 *      * Alignment score: 100% if resume meets/exceeds JD requirement; scaled down if below.
 *
 * 4. Formatting Compatibility (Weight: 20%)
 *    - Formula: Derived directly from parseabilityChecker score (0-100)
 *      (deductions for tables, columns, images, symbol fonts).
 *
 * OVERALL FORMULA:
 *   Overall = Math.round(
 *     (keywordMatch * 0.25) +
 *     (skillsCoverage * 0.35) +
 *     (experienceMatch * 0.20) +
 *     (formattingCompatibility * 0.20)
 *   )
 */

import natural from "natural";

const { PorterStemmer, WordTokenizer } = natural;
const tokenizer = new WordTokenizer();

// Common stop words to exclude from keyword comparison
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
  "by", "from", "as", "is", "was", "are", "were", "been", "be", "have", "has", "had",
  "do", "does", "did", "will", "would", "could", "should", "may", "might", "must",
  "shall", "can", "need", "dare", "ought", "used", "i", "you", "he", "she", "it",
  "we", "they", "what", "which", "who", "whom", "this", "that", "these", "those",
  "am", "being", "such", "into", "during", "before", "after", "above", "below",
  "between", "under", "again", "further", "then", "once", "here", "there", "when",
  "where", "why", "how", "all", "each", "few", "more", "most", "other", "some",
  "any", "no", "not", "only", "own", "same", "so", "than", "too", "very", "just",
  "also", "now", "about", "over", "your", "our", "their", "its", "my", "his", "her",
  "work", "working", "worked", "experience", "experienced", "year", "years", "using",
  "use", "used", "include", "including", "includes", "etc", "like", "new", "well",
  "good", "best", "better", "make", "making", "made", "able", "ability", "skills",
  "skill", "knowledge", "strong", "excellent", "required", "requirements", "job",
  "position", "role", "team", "company", "looking", "seeking", "join", "ideal",
  "candidate", "responsible", "responsibilities", "duties", "must", "preferred"
]);

// High-value technical and professional skills dictionary
const HIGH_VALUE_SKILLS = new Set([
  "javascript", "typescript", "python", "java", "c++", "c#", "golang", "go", "rust",
  "react", "reactjs", "angular", "vue", "vuejs", "nextjs", "next", "nuxt", "svelte",
  "node", "nodejs", "express", "expressjs", "django", "flask", "fastapi", "spring", "springboot",
  "mongodb", "postgresql", "postgres", "mysql", "sql", "redis", "elasticsearch", "graphql",
  "rest", "api", "apis", "aws", "azure", "gcp", "docker", "kubernetes", "k8s", "ci/cd",
  "git", "github", "gitlab", "microservices", "terraform", "linux", "html5", "css3",
  "tailwind", "redux", "jest", "cypress", "agile", "scrum", "machine learning", "ai",
  "data science", "nlp", "kafka", "rabbitmq"
]);

/**
 * Extract tokens with frequency mapping
 */
function extractTokensWithFrequency(text) {
  if (!text || typeof text !== "string") return { tokens: [], stemFrequency: new Map(), stemToOriginal: new Map() };

  const words = tokenizer.tokenize(text.toLowerCase()) || [];
  const stemFrequency = new Map();
  const stemToOriginal = new Map();

  for (const word of words) {
    const cleaned = word.replace(/[^a-z0-9+#]/g, "").trim();
    if (cleaned.length < 2 || STOP_WORDS.has(cleaned)) continue;

    const stem = PorterStemmer.stem(cleaned);
    stemFrequency.set(stem, (stemFrequency.get(stem) || 0) + 1);

    if (!stemToOriginal.has(stem) || HIGH_VALUE_SKILLS.has(cleaned)) {
      stemToOriginal.set(stem, cleaned);
    }
  }

  const tokens = Array.from(stemToOriginal.values());
  return { tokens, stemFrequency, stemToOriginal };
}

/**
 * Extract explicitly required skills from Job Description
 */
function extractRequiredSkills(jdText) {
  const jdLower = jdText.toLowerCase();
  const required = [];

  for (const skill of HIGH_VALUE_SKILLS) {
    // Word boundary or special character boundary check
    const regex = new RegExp(`(^|[^a-z0-9+#])${escapeRegex(skill)}([^a-z0-9+#]|$)`, "i");
    if (regex.test(jdLower)) {
      required.push(skill);
    }
  }

  return required;
}

/**
 * Extract years of experience from text
 */
function extractExperienceYears(text) {
  const patterns = [
    /(\d{1,2})\+?\s*(?:to\s*(\d{1,2})\s*)?(?:years?|yrs?)(?:\s+of)?(?:\s+experience)?/gi,
    /(?:experience|exp)\s*(?:of|:)?\s*(\d{1,2})\+?\s*(?:years?|yrs?)/gi
  ];

  let maxYears = 0;
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0 && num <= 40) {
        if (num > maxYears) maxYears = num;
      }
    }
  }

  // Seniority keyword inference fallback
  const textLower = text.toLowerCase();
  if (maxYears === 0) {
    if (/\b(principal|staff|lead|architect|director)\b/i.test(textLower)) maxYears = 8;
    else if (/\b(senior|sr\.?)\b/i.test(textLower)) maxYears = 5;
    else if (/\b(mid[- ]level|intermediate)\b/i.test(textLower)) maxYears = 3;
    else if (/\b(junior|jr\.?|entry[- ]level|associate|intern)\b/i.test(textLower)) maxYears = 1;
  }

  return maxYears;
}

/**
 * Escape regex helper
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Calculate Rule-Based ATS Score with 4 weighted sub-scores
 */
export function calculateRuleBasedScore(resumeText, jdText, formattingScore = 90) {
  // 1. Tokenize both texts
  const resumeData = extractTokensWithFrequency(resumeText);
  const jdData = extractTokensWithFrequency(jdText);

  // 2. Compute Keyword Frequency Match (Sub-score 1: 25%)
  const matchedKeywords = [];
  const missingKeywords = [];
  let matchedFrequencySum = 0;
  let jdTotalFrequencySum = 0;

  for (const [stem, jdFreq] of jdData.stemFrequency.entries()) {
    jdTotalFrequencySum += jdFreq;
    const originalWord = jdData.stemToOriginal.get(stem) || stem;

    if (resumeData.stemFrequency.has(stem)) {
      matchedKeywords.push(originalWord);
      matchedFrequencySum += Math.min(jdFreq, resumeData.stemFrequency.get(stem));
    } else {
      missingKeywords.push(originalWord);
    }
  }

  const keywordFrequencyRatio = jdTotalFrequencySum > 0 ? (matchedFrequencySum / jdTotalFrequencySum) : 0;
  const keywordMatchScore = Math.min(100, Math.round(keywordFrequencyRatio * 100));

  // 3. Compute Skills Coverage (Sub-score 2: 35%)
  const requiredSkills = extractRequiredSkills(jdText);
  const matchedSkills = [];
  const missingSkills = [];
  const resumeLower = resumeText.toLowerCase();

  for (const skill of requiredSkills) {
    const regex = new RegExp(`(^|[^a-z0-9+#])${escapeRegex(skill)}([^a-z0-9+#]|$)`, "i");
    if (regex.test(resumeLower)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  const skillsCoverageScore = requiredSkills.length > 0
    ? Math.min(100, Math.round((matchedSkills.length / requiredSkills.length) * 100))
    : keywordMatchScore; // Fallback if no specific tech skills recognized in JD

  // 4. Compute Experience Level Match (Sub-score 3: 20%)
  const jdExpYears = extractExperienceYears(jdText);
  const resumeExpYears = extractExperienceYears(resumeText);

  let experienceMatchScore = 75; // Default neutral score if experience is unstated
  let experienceFeedback = "";

  if (jdExpYears > 0) {
    if (resumeExpYears >= jdExpYears) {
      experienceMatchScore = 100;
      experienceFeedback = `Candidate meets or exceeds experience requirement (${resumeExpYears}+ years vs ${jdExpYears}+ years required).`;
    } else if (resumeExpYears > 0) {
      const ratio = resumeExpYears / jdExpYears;
      experienceMatchScore = Math.round(Math.max(30, ratio * 100));
      experienceFeedback = `Candidate has ~${resumeExpYears} years experience; job requires ~${jdExpYears} years.`;
    } else {
      experienceMatchScore = 50;
      experienceFeedback = `Job requires ${jdExpYears}+ years experience. Ensure dates or total years are clearly formatted on resume.`;
    }
  } else {
    experienceFeedback = "Experience requirements are flexible or unstated in job description.";
  }

  // 5. Formatting Compatibility Score (Sub-score 4: 20%)
  const cleanFormattingScore = Math.max(0, Math.min(100, formattingScore));

  // 6. Calculate Weighted Overall Score
  // Weights: Skills Coverage (35%) + Keyword Frequency (25%) + Experience Match (20%) + Formatting (20%)
  const weightedOverall = Math.round(
    (skillsCoverageScore * 0.35) +
    (keywordMatchScore * 0.25) +
    (experienceMatchScore * 0.20) +
    (cleanFormattingScore * 0.20)
  );

  const finalScore = Math.max(0, Math.min(100, weightedOverall));

  // Determine Match Category
  let category = "Needs Improvement";
  let categoryColor = "#ef4444";
  let categoryEmoji = "⚠️";

  if (finalScore >= 80) {
    category = "Excellent Match";
    categoryColor = "#10b981";
    categoryEmoji = "🎯";
  } else if (finalScore >= 65) {
    category = "Good Match";
    categoryColor = "#3b82f6";
    categoryEmoji = "👍";
  } else if (finalScore >= 50) {
    category = "Fair Match";
    categoryColor = "#f59e0b";
    categoryEmoji = "📝";
  }

  return {
    overallScore: finalScore,
    category,
    categoryColor,
    categoryEmoji,
    subScores: {
      keywordMatch: {
        score: keywordMatchScore,
        weight: "25%",
        label: "Keyword Frequency Match",
        matchedCount: matchedKeywords.length,
        totalCount: matchedKeywords.length + missingKeywords.length
      },
      skillsCoverage: {
        score: skillsCoverageScore,
        weight: "35%",
        label: "Required Skills Coverage",
        matchedCount: matchedSkills.length,
        totalCount: requiredSkills.length,
        matchedSkills,
        missingSkills
      },
      experienceMatch: {
        score: experienceMatchScore,
        weight: "20%",
        label: "Experience Level Alignment",
        candidateYears: resumeExpYears,
        requiredYears: jdExpYears,
        feedback: experienceFeedback
      },
      formattingCompatibility: {
        score: cleanFormattingScore,
        weight: "20%",
        label: "ATS Parseability Compatibility"
      }
    },
    matchedKeywords: matchedKeywords.slice(0, 30),
    missingKeywords: missingKeywords.slice(0, 25),
    totalKeywordsCount: matchedKeywords.length + missingKeywords.length
  };
}

export default {
  calculateRuleBasedScore
};
