/**
 * AI Chat Routes
 * API endpoints for AI assistant conversation
 */

import express from "express";
import { optionalAuth } from "../middleware/auth.js";
import {
  chatWithAI,
  initializeChatSession,
  clearChatHistory,
  getChatHistory
} from "../services/aiChatService.js";
import { validateChatMessage } from "../middleware/validators.js";

const router = express.Router();

/**
 * POST /api/chat/message
 * Send message to AI assistant
 */
router.post("/message", optionalAuth, validateChatMessage, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user?.id || `guest-${req.ip}`;

    // Initialize session
    initializeChatSession(userId);

    // Get AI response
    const response = await chatWithAI(userId, message.trim());

    res.json({
      success: response.success,
      message: response.message,
      followUpQuestions: response.followUpSuggestions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Chat error:", error.message);
    res.status(500).json({
      error: "Failed to process chat message"
    });
  }
});

/**
 * GET /api/chat/history
 * Get chat history for user
 */
router.get("/history", optionalAuth, (req, res) => {
  try {
    const userId = req.user?.id || `guest-${req.ip}`;
    const history = getChatHistory(userId);

    res.json({
      success: true,
      history: history,
      messageCount: history.length
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch chat history"
    });
  }
});

/**
 * DELETE /api/chat/history
 * Clear chat history for user
 */
router.delete("/history", optionalAuth, (req, res) => {
  try {
    const userId = req.user?.id || `guest-${req.ip}`;
    clearChatHistory(userId);

    res.json({
      success: true,
      message: "Chat history cleared"
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to clear chat history"
    });
  }
});

/**
 * POST /api/chat/quick-questions
 * Get quick questions about resume/jobs
 */
router.post("/quick-questions", (req, res) => {
  const { topic = "general" } = req.body;

  const questions = {
    resume: [
      "How do I improve my ATS score?",
      "What keywords should I include?",
      "How do I format my resume for ATS?",
      "Should I include a photo in my resume?",
      "What should I do about employment gaps?"
    ],
    interview: [
      "How do I prepare for interviews?",
      "What are common interview questions?",
      "How do I answer behavioral questions?",
      "Tips for technical interviews?",
      "How do I negotiate salary?"
    ],
    jobs: [
      "How do I find the right job?",
      "Should I apply to startups or big companies?",
      "How do I stand out to recruiters?",
      "What questions should I ask in interviews?",
      "How do I evaluate a job offer?"
    ],
    skills: [
      "Which skills are in demand?",
      "How do I learn new skills quickly?",
      "Should I get certifications?",
      "How long does it take to learn a skill?",
      "What skills should I learn in 2024?"
    ],
    general: [
      "How do I get my dream job?",
      "What makes a strong profile?",
      "How do I advance in my career?",
      "Should I stay or switch jobs?",
      "How do I negotiate better opportunities?"
    ]
  };

  const topicQuestions = questions[topic] || questions.general;

  res.json({
    success: true,
    topic,
    questions: topicQuestions.map((q, i) => ({
      id: i + 1,
      question: q
    }))
  });
});

export default router;
