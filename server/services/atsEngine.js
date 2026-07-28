import natural from "natural";

const { PorterStemmer, WordTokenizer } = natural;
const tokenizer = new WordTokenizer();

// Common words to ignore
const stopWords = new Set([
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

// Important keywords to prioritize (keep original form)
const importantKeywords = new Set([
  "javascript", "python", "java", "react", "reactjs", "angular", "angularjs", "vue", "vuejs",
  "node", "nodejs", "express", "expressjs", "mongodb", "sql", "mysql", "postgresql", "postgres",
  "aws", "azure", "gcp", "docker", "kubernetes", "k8s", "git", "github", "gitlab", "bitbucket",
  "api", "apis", "rest", "restful", "graphql", "typescript", "html", "html5", "css", "css3",
  "sass", "scss", "less", "redux", "webpack", "npm", "yarn", "pnpm", "agile", "scrum", "kanban",
  "jira", "confluence", "ci", "cd", "cicd", "devops", "linux", "unix", "windows", "macos",
  "testing", "jest", "mocha", "chai", "selenium", "cypress", "playwright", "figma", "sketch",
  "photoshop", "illustrator", "xd", "machine", "learning", "ml", "ai", "artificial", "intelligence",
  "data", "analytics", "analysis", "tableau", "powerbi", "excel", "salesforce", "sap", "oracle",
  "spring", "springboot", "django", "flask", "fastapi", "laravel", "php", "ruby", "rails",
  "golang", "go", "rust", "swift", "kotlin", "flutter", "dart", "mobile", "ios", "android",
  "firebase", "redis", "elasticsearch", "kafka", "rabbitmq", "nginx", "apache", "terraform",
  "ansible", "jenkins", "travis", "circleci", "cloudformation", "lambda", "serverless", "microservices",
  "frontend", "backend", "fullstack", "full-stack", "database", "nosql", "orm", "prisma",
  "sequelize", "mongoose", "nextjs", "next", "nuxt", "nuxtjs", "gatsby", "remix", "svelte",
  "tailwind", "tailwindcss", "bootstrap", "material", "materialui", "antd", "chakra",
  "storybook", "webpack", "vite", "rollup", "parcel", "babel", "eslint", "prettier",
  "npm", "pnpm", "yarn", "monorepo", "lerna", "nx", "turborepo"
]);

/**
 * Extract keywords from text - returns original words (not stemmed)
 */
export function extractKeywords(text) {
  if (!text || typeof text !== "string") return [];
  
  const words = tokenizer.tokenize(text.toLowerCase()) || [];
  
  // Create a map of stemmed -> original word (keeping first occurrence)
  const stemToOriginal = new Map();
  const wordFrequency = new Map();
  
  words.forEach(word => {
    const cleaned = word.replace(/[^a-z0-9+#]/g, "").trim();
    if (cleaned.length < 2 || stopWords.has(cleaned)) return;
    
    const stem = PorterStemmer.stem(cleaned);
    
    // Keep original word (prefer important keywords)
    if (!stemToOriginal.has(stem) || importantKeywords.has(cleaned)) {
      stemToOriginal.set(stem, cleaned);
    }
    
    // Count frequency
    wordFrequency.set(stem, (wordFrequency.get(stem) || 0) + 1);
  });
  
  // Sort by importance and frequency
  const sortedStems = [...stemToOriginal.keys()].sort((a, b) => {
    const aWord = stemToOriginal.get(a);
    const bWord = stemToOriginal.get(b);
    const aImportant = importantKeywords.has(aWord) ? 1 : 0;
    const bImportant = importantKeywords.has(bWord) ? 1 : 0;
    
    if (aImportant !== bImportant) return bImportant - aImportant;
    return (wordFrequency.get(b) || 0) - (wordFrequency.get(a) || 0);
  });
  
  // Return original words
  return sortedStems.map(stem => stemToOriginal.get(stem));
}

/**
 * Calculate ATS score by comparing resume keywords with job description keywords
 */
export function calculateATS(resumeText, jdText) {
  // Extract keywords
  const resumeKeywords = extractKeywords(resumeText);
  const jdKeywords = extractKeywords(jdText);
  
  if (jdKeywords.length === 0) {
    return { score: 0, matched: [], missing: [] };
  }
  
  // Create stem maps for comparison
  const resumeStems = new Set(resumeKeywords.map(w => PorterStemmer.stem(w)));
  
  const matched = [];
  const missing = [];
  const seenStems = new Set();
  
  // Compare using stems but return original JD words
  jdKeywords.forEach(jdWord => {
    const jdStem = PorterStemmer.stem(jdWord);
    
    // Skip if we've already processed this stem
    if (seenStems.has(jdStem)) return;
    seenStems.add(jdStem);
    
    if (resumeStems.has(jdStem)) {
      matched.push(jdWord);
    } else {
      missing.push(jdWord);
    }
  });
  
  // Calculate score
  const totalKeywords = matched.length + missing.length;
  const matchPercentage = totalKeywords > 0 ? (matched.length / totalKeywords) * 100 : 0;
  
  // Bonus for important keyword matches
  const importantMatches = matched.filter(k => importantKeywords.has(k)).length;
  const bonus = Math.min(15, importantMatches * 3);
  
  const finalScore = Math.min(100, Math.round(matchPercentage + bonus));
  
  return {
    score: finalScore,
    matched: matched.slice(0, 25),
    missing: missing.slice(0, 20)
  };
}

/**
 * Get score category based on ATS score
 */
export function getScoreCategory(score) {
  if (score >= 80) return { label: "Excellent Match", color: "#10b981", emoji: "🎯" };
  if (score >= 60) return { label: "Good Match", color: "#3b82f6", emoji: "👍" };
  if (score >= 40) return { label: "Fair Match", color: "#f59e0b", emoji: "📝" };
  return { label: "Needs Improvement", color: "#ef4444", emoji: "⚠️" };
}