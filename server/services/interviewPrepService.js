/**
 * interviewPrepService.js - Interview Preparation Service
 * ======================================================
 * Generates interview questions based on job description and resume
 * Evaluates user answers and provides AI-powered feedback
 */

import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Generate 8 interview questions based on job description and resume
 * @param {string} jobDescription - Job description/requirements
 * @param {string} resume - User's resume text
 * @returns {Promise<Array>} Array of question objects
 */
async function generateInterviewQuestions(jobDescription, resume) {
  try {
    if (!jobDescription || !resume) {
      throw new Error("Job description and resume are required");
    }

    const prompt = `You are an expert interview preparation coach. Based on the job description and resume provided, generate exactly 8 interview questions that would be asked for this specific role.

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resume}

Generate exactly 8 interview questions in this format:
[{"id": 1, "question": "Question text here?", "difficulty": "easy", "category": "Technical"}]
[{"id": 2, "question": "Question text here?", "difficulty": "medium", "category": "Behavioral"}]
...and so on

Requirements:
- Mix of technical, behavioral, and situational questions
- Questions should be specific to the job requirements
- Questions should relate to skills mentioned in the resume
- Vary difficulty levels: easy (2), medium (4), hard (2)
- Include category for each question
- Make questions realistic and commonly asked

Return ONLY the JSON array, no additional text.`;

    const message = await client.messages.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const response = message.content[0].text;

    // Parse JSON - handle multiple JSON objects separated by newlines
    const jsonMatches = response.match(/\[.*?\]/gs);
    if (!jsonMatches) {
      throw new Error("Failed to parse AI response");
    }

    const allQuestions = [];
    for (const jsonStr of jsonMatches) {
      try {
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) {
          allQuestions.push(...parsed);
        } else {
          allQuestions.push(parsed);
        }
      } catch (e) {
        // Skip invalid JSON objects
      }
    }

    return allQuestions.slice(0, 8); // Ensure exactly 8 questions
  } catch (error) {
    console.error("Error generating interview questions:", error);
    throw new Error(`Failed to generate questions: ${error.message}`);
  }
}

/**
 * Evaluate user's answer to an interview question
 * @param {string} question - The interview question
 * @param {string} userAnswer - User's response
 * @param {string} jobDescription - Job description context
 * @param {string} resume - Resume context
 * @returns {Promise<Object>} Evaluation with score, feedback, tips
 */
async function evaluateAnswer(
  question,
  userAnswer,
  jobDescription,
  resume
) {
  try {
    if (!question || !userAnswer) {
      throw new Error("Question and answer are required");
    }

    const prompt = `You are an expert interview evaluator. Evaluate this interview answer against the job requirements.

INTERVIEW QUESTION:
${question}

CANDIDATE'S ANSWER:
${userAnswer}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S RESUME:
${resume}

Evaluate the answer and provide:
1. A score from 0-100
2. What the candidate did well
3. What could be improved
4. A sample/ideal answer
5. 2-3 tips for improvement
6. Keywords from the job description that should have been mentioned

Format your response as JSON:
{
  "score": 75,
  "strengths": "Clear explanation of...",
  "improvements": "Could have mentioned...",
  "sampleAnswer": "A better answer would be...",
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "missingKeywords": ["keyword1", "keyword2"]
}

Return ONLY the JSON object, no additional text.`;

    const message = await client.messages.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const response = message.content[0].text;

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse evaluation response");
    }

    const evaluation = JSON.parse(jsonMatch[0]);
    return evaluation;
  } catch (error) {
    console.error("Error evaluating answer:", error);
    throw new Error(`Failed to evaluate answer: ${error.message}`);
  }
}

/**
 * Generate sample answer for a question
 * @param {string} question - The interview question
 * @param {string} jobDescription - Job description for context
 * @returns {Promise<string>} Sample answer
 */
async function generateSampleAnswer(question, jobDescription) {
  try {
    const prompt = `Based on this job description and interview question, provide a high-quality sample answer that would impress an interviewer.

JOB DESCRIPTION:
${jobDescription}

INTERVIEW QUESTION:
${question}

Provide a professional, detailed answer (200-300 words) that:
- Directly addresses the question
- Shows relevant skills from the job description
- Includes specific examples if applicable
- Demonstrates problem-solving ability
- Uses confident, professional language

Return ONLY the sample answer, no additional text.`;

    const message = await client.messages.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return message.content[0].text;
  } catch (error) {
    console.error("Error generating sample answer:", error);
    throw new Error(`Failed to generate sample answer: ${error.message}`);
  }
}

/**
 * Calculate overall interview performance
 * @param {Array} scores - Array of individual question scores
 * @returns {Object} Overall performance metrics
 */
function calculatePerformance(scores) {
  if (!scores || scores.length === 0) {
    return { overallScore: 0, rating: "Not Started" };
  }

  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  let rating = "";

  if (average >= 90) rating = "Excellent";
  else if (average >= 80) rating = "Very Good";
  else if (average >= 70) rating = "Good";
  else if (average >= 60) rating = "Fair";
  else rating = "Needs Improvement";

  return {
    overallScore: Math.round(average),
    rating,
    totalQuestions: scores.length,
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores),
  };
}

export {
  generateInterviewQuestions,
  evaluateAnswer,
  generateSampleAnswer,
  calculatePerformance,
};
