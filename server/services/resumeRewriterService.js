/**
 * Resume Rewriter Service
 * Generates improved resume based on job description
 */

import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Rewrite resume to match job description
 */
export async function rewriteResumeForJob(resumeText, jobDescription) {
  try {
    const prompt = `You are an expert resume writer and ATS specialist.

TASK: Rewrite this resume to better match the job description while keeping the same structure.

ORIGINAL RESUME:
${resumeText}

TARGET JOB DESCRIPTION:
${jobDescription}

INSTRUCTIONS:
1. Keep the same resume sections and overall structure
2. Replace weak action verbs with stronger ones
3. Add relevant keywords from job description naturally
4. Remove irrelevant skills/experience
5. Rewrite bullet points to align with job requirements
6. Emphasize relevant experience and achievements
7. Quantify achievements where possible
8. Make technical skills prominent

IMPORTANT: Return ONLY the improved resume text, NO explanations or commentary.
Maintain professional resume format.`;

    const completion = await groqClient.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert ATS-focused resume writer. Rewrite resumes to perfectly match job descriptions while maintaining authenticity."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.6,
      max_tokens: 2000
    });

    const improvedResume = completion.choices[0]?.message?.content || null;

    return {
      success: true,
      originalResume: resumeText,
      improvedResume: improvedResume,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error("Resume rewriting error");
    return {
      success: false,
      error: "Failed to rewrite resume. Please try again.",
      originalResume: resumeText
    };
  }
}

/**
 * Get detailed comparison of changes
 */
export async function getResumeChangeSummary(originalResume, improvedResume, jobDescription) {
  try {
    const prompt = `Compare these two resumes and summarize the changes made.

ORIGINAL:
${originalResume.substring(0, 500)}

IMPROVED:
${improvedResume.substring(0, 500)}

JOB DESCRIPTION (first 300 chars):
${jobDescription.substring(0, 300)}

Provide a BRIEF summary of:
1. Top 3 skills/keywords ADDED
2. Top 2 weaknesses REMOVED
3. Sections that were EMPHASIZED more

Format:
## ADDED KEYWORDS
- Keyword 1
- Keyword 2

## REMOVED/IMPROVED
- Issue 1

## EMPHASIZED
- Section 1`;

    const completion = await groqClient.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a resume expert. Provide concise, specific comparisons."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 500
    });

    return completion.choices[0]?.message?.content || "No summary available";
  } catch (err) {
    console.error("Change summary error");
    return "Could not generate change summary";
  }
}

export default {
  rewriteResumeForJob,
  getResumeChangeSummary
};
