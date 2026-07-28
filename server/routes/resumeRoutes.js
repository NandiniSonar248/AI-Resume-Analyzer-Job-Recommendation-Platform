/**
 * Resume Builder Routes
 * API endpoints for ATS-optimized resume generation
 */

import express from "express";
import { body, validationResult } from "express-validator";
import { generateOptimizedResume, generatePDFResume } from "../services/resumeBuilderService.js";
import { rewriteResumeForJob, getResumeChangeSummary } from "../services/resumeRewriterService.js";
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

/**
 * POST /api/resume/optimize
 * Generate ATS-optimized resume content
 */
router.post("/optimize", optionalAuth, [
  body("jobDescription").notEmpty().withMessage("Job description is required"),
  body("keywords").isArray().withMessage("Keywords must be an array")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userData, jobDescription, keywords } = req.body;
    
    const optimizedResume = await generateOptimizedResume(
      userData || {},
      jobDescription,
      keywords || []
    );

    res.json({
      success: true,
      resume: optimizedResume,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Resume optimization error:", error.message);
    res.status(500).json({ error: "Failed to optimize resume" });
  }
});

/**
 * POST /api/resume/generate-pdf
 * Generate downloadable PDF resume
 */
router.post("/generate-pdf", optionalAuth, async (req, res) => {
  try {
    const { resumeData } = req.body;
    
    if (!resumeData) {
      return res.status(400).json({ error: "Resume data is required" });
    }

    const pdfBuffer = await generatePDFResume(resumeData);
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="ATS-Optimized-Resume.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error.message);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

/**
 * GET /api/resume/templates
 * Get resume template options
 */
router.get("/templates", (req, res) => {
  const templates = [
    {
      id: "professional",
      name: "Professional",
      description: "Clean, corporate design suitable for most industries",
      preview: "📄",
      features: ["ATS-Optimized", "Clean Layout", "Professional Font"]
    },
    {
      id: "modern",
      name: "Modern",
      description: "Contemporary design with subtle styling",
      preview: "🎨",
      features: ["Modern Look", "Skills Highlight", "Color Accents"]
    },
    {
      id: "technical",
      name: "Technical",
      description: "Perfect for developers and engineers",
      preview: "💻",
      features: ["Tech Focus", "Project Section", "Skills Matrix"]
    },
    {
      id: "executive",
      name: "Executive",
      description: "Elegant design for senior positions",
      preview: "👔",
      features: ["Premium Look", "Achievement Focus", "Leadership Emphasis"]
    }
  ];

  res.json({ success: true, templates });
});

/**
 * POST /api/resume/analyze-keywords
 * Extract keywords from job description
 */
router.post("/analyze-keywords", [
  body("jobDescription").notEmpty().isLength({ min: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { jobDescription } = req.body;
    
    // Extract keywords using simple NLP
    const text = jobDescription.toLowerCase();
    
    // Common tech keywords to look for
    const techKeywords = [
      "javascript", "typescript", "python", "java", "c++", "c#", "go", "rust", "ruby", "php",
      "react", "angular", "vue", "node.js", "express", "django", "flask", "spring",
      "mongodb", "mysql", "postgresql", "redis", "elasticsearch",
      "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "terraform",
      "html", "css", "sass", "tailwind", "bootstrap",
      "git", "github", "gitlab", "jira", "agile", "scrum",
      "rest api", "graphql", "microservices", "ci/cd",
      "machine learning", "deep learning", "tensorflow", "pytorch",
      "data analysis", "sql", "tableau", "power bi"
    ];

    const foundKeywords = techKeywords.filter(kw => text.includes(kw));
    
    // Extract requirements
    const experienceMatch = text.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
    const experience = experienceMatch ? `${experienceMatch[1]}+ years` : null;

    res.json({
      success: true,
      keywords: foundKeywords,
      experience,
      keywordCount: foundKeywords.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Keyword analysis error:", error.message);
    res.status(500).json({ error: "Failed to analyze keywords" });
  }
});

/**
 * POST /api/resume/rewrite
 * Rewrite resume to match job description
 */
router.post("/rewrite", optionalAuth, [
  body("resumeText").notEmpty().withMessage("Resume text is required"),
  body("jobDescription").notEmpty().withMessage("Job description is required")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { resumeText, jobDescription } = req.body;

    console.log("Rewriting resume for job...");

    const result = await rewriteResumeForJob(resumeText, jobDescription);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Get detailed change summary
    const changeSummary = await getResumeChangeSummary(
      resumeText,
      result.improvedResume,
      jobDescription
    );

    res.json({
      success: true,
      originalResume: result.originalResume,
      improvedResume: result.improvedResume,
      changeSummary: changeSummary,
      timestamp: result.timestamp
    });
  } catch (error) {
    console.error("Resume rewriting error");
    res.status(500).json({ error: "Failed to rewrite resume. Please try again." });
  }
});

/**
 * POST /api/resume/compare
 * Get detailed comparison between original and improved resume
 */
router.post("/compare", optionalAuth, [
  body("originalResume").notEmpty(),
  body("improvedResume").notEmpty(),
  body("jobDescription").notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { originalResume, improvedResume, jobDescription } = req.body;

    const changeSummary = await getResumeChangeSummary(
      originalResume,
      improvedResume,
      jobDescription
    );

    res.json({
      success: true,
      comparison: changeSummary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Resume comparison error");
    res.status(500).json({ error: "Failed to compare resumes" });
  }
});

export default router;
