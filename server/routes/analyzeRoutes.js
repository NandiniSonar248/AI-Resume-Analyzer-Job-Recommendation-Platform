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
import { optionalAuth, authenticate } from "../middleware/auth.js";
import Analysis from "../models/Analysis.js";
import { validateAnalyze } from "../middleware/validators.js";

/**
 * Validate file content by checking magic bytes (file signature).
 * This prevents uploading malicious files disguised with a fake extension.
 *
 * Magic bytes for supported formats:
 *   PDF:  %PDF  (hex: 25 50 44 46)
 *   DOCX: PK    (hex: 50 4B 03 04) — DOCX is a ZIP archive
 *   DOC:  ÐÏ    (hex: D0 CF 11 E0) — OLE2 Compound Document
 *   TXT:  No magic bytes — validated by checking for valid UTF-8 text
 */
function validateFileMagicBytes(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const buffer = Buffer.alloc(4);
  const fd = fs.openSync(filePath, "r");
  fs.readSync(fd, buffer, 0, 4, 0);
  fs.closeSync(fd);

  const magicBytes = {
    ".pdf": [0x25, 0x50, 0x44, 0x46],   // %PDF
    ".docx": [0x50, 0x4B, 0x03, 0x04],  // PK (ZIP)
    ".doc": [0xD0, 0xCF, 0x11, 0xE0],   // OLE2
  };

  if (ext === ".txt") {
    // For TXT files, verify it's valid UTF-8 text (no binary content)
    const fullBuffer = fs.readFileSync(filePath);
    const text = fullBuffer.toString("utf-8");
    // Check for null bytes or excessive non-printable characters
    const nonPrintable = text.replace(/[\x20-\x7E\n\r\t]/g, "").length;
    if (nonPrintable / text.length > 0.1) {
      return { valid: false, reason: "File appears to contain binary content, not text" };
    }
    return { valid: true };
  }

  const expected = magicBytes[ext];
  if (!expected) {
    return { valid: false, reason: `Unsupported file type: ${ext}` };
  }

  for (let i = 0; i < expected.length; i++) {
    if (buffer[i] !== expected[i]) {
      return { valid: false, reason: `File content does not match ${ext.toUpperCase()} format. The file may be corrupted or have a fake extension.` };
    }
  }

  return { valid: true };
}

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
router.post("/", optionalAuth, upload.single("resume"), validateAnalyze, async (req, res) => {
  const filePath = req.file?.path;
  const originalName = req.file?.originalname || "";
  
  try {
    // Validation
    if (!filePath) {
      return res.status(400).json({ error: "Please upload a resume file (PDF, DOCX, or TXT)" });
    }

    // Validate file content by magic bytes (not just extension)
    const fileValidation = validateFileMagicBytes(filePath, originalName);
    if (!fileValidation.valid) {
      return res.status(400).json({
        error: fileValidation.reason,
        hint: "Please upload a genuine PDF, DOCX, or TXT file."
      });
    }

    // Enforce minimum file size (a valid resume can't be < 100 bytes)
    const fileStats = fs.statSync(filePath);
    if (fileStats.size < 100) {
      return res.status(400).json({
        error: "File is too small to be a valid resume.",
        hint: "Please upload a document with actual content."
      });
    }
    // Request is validated by validateAnalyze middleware

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
router.get("/history", authenticate, async (req, res) => {
  try {
    // Build query - show user's own history or global if not logged in
    const query = { userId: req.user._id };
    
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
router.delete("/history/:id", authenticate, async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);
    
    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found" });
    }
    
    // Only owner can delete
    if (analysis.userId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to delete this analysis" });
    }
    
    await Analysis.findByIdAndDelete(req.params.id);
    res.json({ message: "Analysis deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/analyze/history - Clear user's history
router.delete("/history", authenticate, async (req, res) => {
  try {
    // Only delete user's own history if logged in
    await Analysis.deleteMany({ userId: req.user._id });
    res.json({ message: "Your analysis history cleared" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;