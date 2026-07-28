/**
 * Analyze Routes
 * ============================================
 * PURPOSE: Handles resume analysis against job descriptions
 * 
 * INTERVIEW EXPLANATION:
 * - Accepts resume upload (PDF, DOCX, TXT)
 * - Parses resume text using mammoth/pdf-parse
 * - Calculates ATS score using NLP keyword matching
 * - Generates AI suggestions using Groq/Llama
 * - Saves analysis to database linked to user
 * 
 * WHY THIS MATTERS FOR JOB SEEKERS:
 * - Helps understand what keywords are missing
 * - AI gives actionable improvement suggestions
 * - Score shows how likely resume will pass ATS
 */

import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { parseResume } from "../services/resumeParser.js";
import { calculateATS, getScoreCategory } from "../services/atsEngine.js";
import { generateSuggestions } from "../services/llamaService.js";
import { generateAISuggestions, isAIAvailable } from "../services/aiService.js";
import { validateResume } from "../services/resumeValidator.js";
import { optionalAuth } from "../middleware/auth.js";
import Analysis from "../models/Analysis.js";

const router = express.Router();

// Configure multer for multiple file types
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [".pdf", ".docx", ".doc", ".txt"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(", ")}`));
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// POST /api/analyze - Real-time resume analysis
// Uses optionalAuth to link analysis to user if logged in
router.post("/", optionalAuth, upload.single("resume"), async (req, res) => {
  const filePath = req.file?.path;
  const originalName = req.file?.originalname || "";
  
  try {
    // Validation
    if (!filePath) {
      return res.status(400).json({ error: "Please upload a resume file (PDF, DOCX, or TXT)" });
    }
    if (!req.body.jobDescription?.trim()) {
      return res.status(400).json({ error: "Please provide a job description" });
    }

    console.log(`Processing resume file...`);

    // Parse resume with original filename for format detection
    const resumeText = await parseResume(filePath, originalName);
    const jdText = req.body.jobDescription.trim();

    // Validate that the file is actually a resume
    const validation = validateResume(resumeText);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: validation.message,
        hint: "Please upload a document that contains your work experience, education, skills, and contact information."
      });
    }

    console.log(`Resume validation passed`);
    console.log(`Resume text extracted successfully`);

    // Real-time ATS analysis
    const { score, matched, missing } = calculateATS(resumeText, jdText);
    const category = getScoreCategory(score);
    
    // Generate AI-powered suggestions (with fallback to rule-based)
    const { suggestions, aiPowered } = await generateAISuggestions(score, matched, missing);

    // Prepare response - All data is generated in real-time
    const result = {
      atsScore: score,
      category: category.label,
      categoryColor: category.color,
      categoryEmoji: category.emoji,
      matchedKeywords: matched,
      missingKeywords: missing,
      suggestions: suggestions,
      totalKeywords: matched.length + missing.length,
      matchPercentage: matched.length + missing.length > 0
        ? Math.round((matched.length / (matched.length + missing.length)) * 100)
        : 0,
      resumeConfidence: validation.confidence,
      analyzedAt: new Date().toISOString(),
      isRealTime: true,
      aiPowered: aiPowered,
      resumeText: resumeText,
      jobDescription: jdText
    };

    // Save to MongoDB linked to user (non-blocking)
    Analysis.create({
      userId: req.user?._id, // Link to user if logged in
      atsScore: score,
      category: category.label,
      matchedKeywords: matched,
      missingKeywords: missing,
      aiSuggestions: suggestions,
      aiPowered: aiPowered,
      resumeName: originalName,
      resumeConfidence: validation.confidence,
      jobDescriptionPreview: jdText.substring(0, 500)
    }).catch(err => console.warn("DB save failed"));

    console.log(`Analysis complete`);
    res.json(result);

  } catch (err) {
    console.error("Analysis error");
    res.status(500).json({ error: "Failed to analyze resume" });
  } finally {
    // Always cleanup uploaded file
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupErr) {
        console.warn("File cleanup failed");
      }
    }
  }
});

// GET /api/analyze/history - Get user's analysis history
router.get("/history", optionalAuth, async (req, res) => {
  try {
    // Build query - show user's own history or global if not logged in
    const query = req.user ? { userId: req.user._id } : {};
    
    const history = await Analysis.find(query)
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/analyze/history/:id - Delete specific analysis
router.delete("/history/:id", optionalAuth, async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);
    
    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found" });
    }
    
    // Only owner can delete
    if (req.user && analysis.userId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to delete this analysis" });
    }
    
    await Analysis.findByIdAndDelete(req.params.id);
    res.json({ message: "Analysis deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/analyze/history - Clear user's history
router.delete("/history", optionalAuth, async (req, res) => {
  try {
    // Only delete user's own history if logged in
    if (req.user) {
      await Analysis.deleteMany({ userId: req.user._id });
      res.json({ message: "Your analysis history cleared" });
    } else {
      res.status(401).json({ error: "Login required to clear history" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;