import Groq from "groq-sdk";
import dotenv from "dotenv";
import { generateFallbackSuggestions } from "./llamaService.js";

// Load environment variables
dotenv.config();

// Initialize Groq client (only if API key exists)
let groqClient = null;

const initGroq = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (apiKey && apiKey !== "your_groq_api_key_here" && apiKey.startsWith("gsk_")) {
    try {
      groqClient = new Groq({ apiKey: apiKey });
      console.log("✅ Groq AI initialized successfully");
      return true;
    } catch (err) {
      console.warn("⚠️ Groq AI initialization failed");
      console.log("Debug - Init Error:", err.message);
      return false;
    }
  }
  console.log("ℹ️ Groq API key not configured - using rule-based suggestions");
  return false;
};

// Initialize on module load
initGroq();

/**
 * Generate AI-powered suggestions using Groq (Llama 3)
 * Falls back to rule-based if AI fails
 */
export async function generateAISuggestions(score, matchedKeywords, missingKeywords, resumeContext = {}) {
  // If no API key or client, use fallback immediately
  if (!groqClient) {
    return {
      suggestions: generateFallbackSuggestions(score, matchedKeywords, missingKeywords),
      aiPowered: false
    };
  }

  try {
    // Build prompt with ONLY keywords (privacy - no full resume)
    const prompt = buildPrompt(score, matchedKeywords, missingKeywords);
    
    // Call Groq API with timeout
    const response = await Promise.race([
      callGroqAPI(prompt),
      timeout(10000) // 10 second timeout
    ]);

    if (response) {
      return {
        suggestions: formatAIResponse(response, score),
        aiPowered: true
      };
    }
  } catch (err) {
    console.warn("⚠️ AI service unavailable, using fallback suggestions");
    console.log("Debug - API Error:", err.message);
    console.log("Debug - Error Status:", err.status);
  }

  // Fallback to rule-based suggestions
  return {
    suggestions: generateFallbackSuggestions(score, matchedKeywords, missingKeywords),
    aiPowered: false
  };
}

/**
 * Build AI prompt - SIMPLIFIED for clarity and professionalism
 */
function buildPrompt(score, matched, missing) {
  const missedTop = missing.slice(0, 5);

  return `You are a professional resume coach. Provide CONCISE, actionable resume improvement advice.

CURRENT SCORE: ${score}%
MATCHED SKILLS: ${matched.slice(0, 5).join(", ")}
MISSING SKILLS: ${missedTop.join(", ")}

RESPONSE FORMAT (Keep it SHORT and CLEAR):

**Your Match: ${score}% ${score >= 80 ? '✅' : score >= 60 ? '👍' : '⚠️'}**

**Add These 5 Skills (in ONE sentence each):**

${missedTop.map((skill, i) => {
  const skillLower = skill.toLowerCase();
  let action = '';

  if (/python|javascript|java|typescript|golang|rust|swift/.test(skillLower)) {
    action = `"Developed solutions using ${skill}"`;
  } else if (/react|angular|vue|express|django/.test(skillLower)) {
    action = `"Built applications with ${skill}"`;
  } else if (/machine learning|ai|deep learning|nlp/.test(skillLower)) {
    action = `"Implemented ${skill} solutions"`;
  } else if (/mongodb|postgresql|mysql|redis/.test(skillLower)) {
    action = `"Optimized databases using ${skill}"`;
  } else if (/aws|docker|kubernetes|devops/.test(skillLower)) {
    action = `"Deployed systems with ${skill}"`;
  } else {
    action = `"Experienced with ${skill}"`;
  }

  return `${i + 1}. **${skill}**: ${action}`;
}).join('\n')}

**Where to Add (be specific):**

✏️ In Experience: "Improved system efficiency using ${missedTop[0]} and ${missedTop[1]}"

✏️ In Summary: "Full-stack developer proficient in ${missedTop.slice(0, 3).join(', ')}"

**Quick wins: Add ${missedTop.length} skills → Score jumps to ${Math.min(100, score + 25)}%**

**Pro tip:** Show impact, not just skills. Instead of "knows ${missedTop[0]}", write "built ${missedTop[0]} feature that improved X by Y%"`;
}

/**
 * Call Groq API with improved settings
 */
async function callGroqAPI(prompt) {
  const completion = await groqClient.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are an expert career coach and ATS specialist. Your job is to help people improve their resumes.

RULES:
1. Write NATURALLY and PROFESSIONALLY - no awkward phrases like "Experienced with ai"
2. Provide CONTEXT - explain WHY each skill matters for the job
3. Show EXAMPLES - give before/after examples of how to add skills
4. Be HONEST - if score is low, say it and explain what to focus on
5. Keep CONFIDENCE - even low scores have room for improvement
6. Be PRACTICAL - give steps someone can actually follow in 30 minutes

AVOID:
- Listing random keywords
- Unnatural phrases or broken English
- Generic advice
- Too much explanation (be concise)`
      },
      {
        role: "user",
        content: prompt
      }
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.5, // Lower for more consistent recommendations
    max_tokens: 800 // More tokens for detailed suggestions
  });

  return completion.choices[0]?.message?.content || null;
}

/**
 * Format AI response with proper styling
 */
function formatAIResponse(response, score) {
  // Remove excessive markdown, keep it simple
  let formatted = response;

  // Add header based on score
  if (score >= 80) {
    formatted = "✅ **EXCELLENT MATCH!** Your resume is very close to the job requirements.\n\n" + formatted;
  } else if (score >= 60) {
    formatted = "👍 **GOOD MATCH!** Your resume is on track. Make a few small changes to improve.\n\n" + formatted;
  } else if (score >= 40) {
    formatted = "⚠️ **NEEDS WORK** - Follow the steps below to improve your match score.\n\n" + formatted;
  } else {
    formatted = "❌ **LOW MATCH** - Your resume needs significant changes. Follow the simple steps below.\n\n" + formatted;
  }

  // Add footer
  formatted += "\n\n---\n💡 **REMEMBER:** Just add the missing words to your resume and your score will improve!\n*Powered by AI (Llama 3)*";

  return formatted;
}

/**
 * Timeout helper
 */
function timeout(ms) {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error("AI request timed out")), ms)
  );
}

/**
 * Check if AI is available
 */
export function isAIAvailable() {
  return groqClient !== null;
}
