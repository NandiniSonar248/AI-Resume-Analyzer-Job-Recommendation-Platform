/**
 * interviewRoutes.js - Interview Preparation Routes
 * ================================================
 * API endpoints for interview question generation and answer evaluation
 */

import express from "express";
import {
  generateInterviewQuestions,
  evaluateAnswer,
  generateSampleAnswer,
  calculatePerformance,
} from "../services/interviewPrepService.js";

const router = express.Router();

/**
 * POST /api/interview/generate-questions
 * Generate 8 interview questions based on job description and resume
 */
router.post("/generate-questions", async (req, res) => {
  try {
    const { jobDescription, resume } = req.body;

    if (!jobDescription || !resume) {
      return res.status(400).json({
        success: false,
        error: "Job description and resume are required",
      });
    }

    const questions =
      await generateInterviewQuestions(
        jobDescription,
        resume
      );

    return res.status(200).json({
      success: true,
      questions,
      count: questions.length,
    });
  } catch (error) {
    console.error("Error generating interview questions:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate questions",
    });
  }
});

/**
 * POST /api/interview/evaluate-answer
 * Evaluate user's answer to an interview question
 */
router.post("/evaluate-answer", async (req, res) => {
  try {
    const { question, userAnswer, jobDescription, resume } = req.body;

    if (!question || !userAnswer) {
      return res.status(400).json({
        success: false,
        error: "Question and answer are required",
      });
    }

    const evaluation = await evaluateAnswer(
      question,
      userAnswer,
      jobDescription || "",
      resume || ""
    );

    return res.status(200).json({
      success: true,
      evaluation,
    });
  } catch (error) {
    console.error("Error evaluating answer:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to evaluate answer",
    });
  }
});

/**
 * POST /api/interview/sample-answer
 * Generate a sample answer for a question
 */
router.post("/sample-answer", async (req, res) => {
  try {
    const { question, jobDescription } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: "Question is required",
      });
    }

    const sampleAnswer = await generateSampleAnswer(
      question,
      jobDescription || ""
    );

    return res.status(200).json({
      success: true,
      sampleAnswer,
    });
  } catch (error) {
    console.error("Error generating sample answer:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate sample answer",
    });
  }
});

/**
 * POST /api/interview/calculate-performance
 * Calculate overall interview performance
 */
router.post("/calculate-performance", async (req, res) => {
  try {
    const { scores } = req.body;

    if (!Array.isArray(scores)) {
      return res.status(400).json({
        success: false,
        error: "Scores must be an array",
      });
    }

    const performance = calculatePerformance(scores);

    return res.status(200).json({
      success: true,
      performance,
    });
  } catch (error) {
    console.error("Error calculating performance:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to calculate performance",
    });
  }
});

export default router;
