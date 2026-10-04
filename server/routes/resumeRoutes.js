/**
 * Resume Builder Routes
 * API endpoints for ATS-optimized resume generation
 */

import express from "express";
import { validateResumeOptimize, validateResumeRewrite, validateResumeCompare, validateGeneratePdf, validateAnalyzeKeywords, validateResumeTailor, validateCoverLetter, validateSkillGap } from "../middleware/validators.js";
import { generateOptimizedResume, generatePDFResume } from "../services/resumeBuilderService.js";
import { rewriteResumeForJob, getResumeChangeSummary } from "../services/resumeRewriterService.js";
import { tailorResumeForJob } from "../services/resume/tailoringService.js";
import { generateCoverLetter } from "../services/resume/coverLetterService.js";
import { generateSkillGapRoadmap } from "../services/resume/skillGapService.js";
import { optionalAuth, authenticate } from "../middleware/auth.js";

const router = express.Router();

/**
 * POST /api/resume/optimize
 * Generate ATS-optimized resume content
 */
router.post("/optimize", optionalAuth, validateResumeOptimize, async (req, res) => {
  try {

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
router.post("/generate-pdf", optionalAuth, validateGeneratePdf, async (req, res) => {
  try {
    const { resumeData } = req.body;

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
router.post("/analyze-keywords", validateAnalyzeKeywords, async (req, res) => {
  try {

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
router.post("/rewrite", optionalAuth, validateResumeRewrite, async (req, res) => {
  try {

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
router.post("/compare", optionalAuth, validateResumeCompare, async (req, res) => {
  try {

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

/**
 * POST /api/resume/tailor
 * Phase 3: JD-tailored rewrite with anti-hallucination guardrail.
 *
 * WHY a separate endpoint from /rewrite:
 *   The old /rewrite route uses resumeRewriterService.js which lacks the
 *   guardrail. This new endpoint uses tailoringService.js which implements
 *   the 5-layer anti-hallucination protection required by SPEC.md.
 *   We keep the old endpoint live for backward compatibility with existing
 *   frontend code, but the new ResultPanel tab calls this one.
 */
router.post("/tailor", optionalAuth, validateResumeTailor, async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    console.log("Phase 3: Tailoring resume with anti-hallucination guardrail...");

    const result = await tailorResumeForJob(resumeText, jobDescription);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      tailoredResume: result.tailoredResume,
      guardrailReport: result.guardrailReport,
      disclaimer: result.disclaimer,
      timestamp: result.timestamp
    });
  } catch (err) {
    console.error("Tailor route error:", err.message);
    res.status(500).json({ error: "Failed to tailor resume. Please try again." });
  }
});

/**
 * POST /api/resume/cover-letter
 * Phase 3: Generate a JD-matched cover letter from resume + JD context.
 */
router.post("/cover-letter", optionalAuth, validateCoverLetter, async (req, res) => {
  try {
    const { resumeText, jobDescription, userName, companyName, roleName } = req.body;
    console.log("Phase 3: Generating cover letter...");

    const result = await generateCoverLetter(resumeText, jobDescription, {
      userName: userName || req.user?.name || "the candidate",
      companyName: companyName || "your company",
      roleName: roleName || "this role"
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      coverLetter: result.coverLetter,
      wordCount: result.wordCount,
      timestamp: result.timestamp
    });
  } catch (err) {
    console.error("Cover letter route error:", err.message);
    res.status(500).json({ error: "Failed to generate cover letter. Please try again." });
  }
});

/**
 * POST /api/resume/skill-gap
 * Phase 3: Generate structured learning roadmap for each missing JD skill.
 *
 * WHY the frontend passes missingSkills directly:
 *   The ATS analysis already computed missingSkills in the /api/analyze response.
 *   Re-sending them here avoids re-uploading the resume file just to run the
 *   same scorer again — the data is already in the client's state from the
 *   previous analysis response.
 */
router.post("/skill-gap", optionalAuth, validateSkillGap, async (req, res) => {
  try {
    const { missingSkills, jobDescription } = req.body;
    console.log(`Phase 3: Generating skill-gap roadmap for ${missingSkills.length} missing skills...`);

    const result = await generateSkillGapRoadmap(missingSkills, jobDescription || "");

    res.json({
      success: true,
      roadmap: result.roadmap,
      aiGenerated: result.aiGenerated,
      totalGaps: result.totalGaps || missingSkills.length,
      shownGaps: result.shownGaps || missingSkills.length,
      message: result.message,
      timestamp: result.timestamp
    });
  } catch (err) {
    console.error("Skill gap route error:", err.message);
    res.status(500).json({ error: "Failed to generate skill gap roadmap. Please try again." });
  }
});

export default router;
