/**
 * jobRoutes.js — Job Search & Matching API Endpoints
 * =====================================================================
 * Routes:
 *   GET  /api/jobs/search           — keyword search
 *   POST /api/jobs/match            — match by skills array
 *   POST /api/jobs/match-by-resume  — match by raw resume text (auto-flow)
 *   GET  /api/jobs/trending         — trending job categories (static)
 *
 * All job data comes from jobAggregator.js which calls:
 *   RemoteOK (free, no key) + Adzuna (ADZUNA_APP_ID/KEY) + JSearch (RAPIDAPI_KEY)
 *
 * There is NO fake job generator anywhere in this module or its imports.
 * If all real sources return nothing, the response is { jobs: [], count: 0 }
 * and the frontend shows an honest "no live listings" empty state.
 */

import express from "express";
import {
  searchJobs,
  matchJobsWithResume,
  extractSkillsFromText,
} from "../services/jobAggregator.js";
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/jobs/search?q=...&location=...&page=...
 *
 * Search for real live job listings across all 3 sources.
 * Returns normalized job objects with real source URLs.
 *
 * Query params:
 *   q        (required) — search keywords, min 2 chars
 *   location (optional) — defaults to "India"
 *   page     (optional) — defaults to 1
 */
router.get("/search", optionalAuth, async (req, res) => {
  try {
    const { q, location = "India", page = 1 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        error: "Search query is required (minimum 2 characters)",
      });
    }

    const jobs = await searchJobs(q.trim(), location, parseInt(page, 10));

    res.json({
      success: true,
      query: q.trim(),
      location,
      count: jobs.length,
      jobs,
      // Honest metadata — no fake data disclaimer needed because there is none
      sources: ["RemoteOK", "Adzuna", "JSearch"],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[jobRoutes] Search error:", error.message);
    res.status(500).json({
      error: "Failed to search jobs. Please try again.",
    });
  }
});

/**
 * POST /api/jobs/match
 * Body: { skills: string[], location?: string }
 *
 * Match jobs to a provided skills array (from resume ATS analysis).
 * Returns jobs scored by skill overlap (matchScore 0-100, matchedSkills[]).
 */
router.post("/match", optionalAuth, async (req, res) => {
  try {
    const { skills, location = "India" } = req.body;

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({
        error: "skills array is required and must be non-empty",
      });
    }

    // Sanitize skills — ensure they're strings, strip anything suspicious
    const cleanSkills = skills
      .filter((s) => typeof s === "string")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0 && s.length < 50)
      .slice(0, 20); // Cap at 20 skills for query building

    if (cleanSkills.length === 0) {
      return res.status(400).json({ error: "No valid skills provided" });
    }

    const jobs = await matchJobsWithResume(cleanSkills, location);

    res.json({
      success: true,
      skillsUsed: cleanSkills,
      count: jobs.length,
      jobs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[jobRoutes] Match error:", error.message);
    res.status(500).json({
      error: "Failed to match jobs. Please try again.",
    });
  }
});

/**
 * POST /api/jobs/match-by-resume
 * Body: { resumeText: string, location?: string }
 *
 * Auto-matching endpoint for the resume upload flow.
 * Accepts raw resume text, extracts skills server-side, then matches jobs.
 *
 * This is the endpoint called by the frontend immediately after a resume
 * analysis completes — the user doesn't need to manually search.
 *
 * Flow:
 *   Resume text → extractSkillsFromText() → matchJobsWithResume() → scored jobs
 */
router.post("/match-by-resume", optionalAuth, async (req, res) => {
  try {
    const { resumeText, location = "India" } = req.body;

    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 50) {
      return res.status(400).json({
        error: "resumeText is required (minimum 50 characters)",
      });
    }

    // Extract skills from raw text (keyword dictionary lookup)
    const skills = extractSkillsFromText(resumeText);

    if (skills.length === 0) {
      // No recognizable tech skills found — return empty, don't fabricate
      return res.json({
        success: true,
        skillsExtracted: [],
        count: 0,
        jobs: [],
        message: "No recognizable technical skills found in resume text for job matching.",
        timestamp: new Date().toISOString(),
      });
    }

    const jobs = await matchJobsWithResume(skills, location);

    res.json({
      success: true,
      skillsExtracted: skills,
      count: jobs.length,
      jobs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[jobRoutes] Match-by-resume error:", error.message);
    res.status(500).json({
      error: "Failed to match jobs from resume. Please try again.",
    });
  }
});

/**
 * GET /api/jobs/trending
 *
 * Returns static trending job category cards.
 * These are informational (clickable to trigger a search), not real listings.
 * The counts/growth figures are illustrative — clearly labeled as such.
 */
router.get("/trending", async (req, res) => {
  try {
    const trendingCategories = [
      {
        id: 1,
        name: "Full Stack Developer",
        icon: "💻",
        searchQuery: "full stack developer",
        skills: ["React", "Node.js", "MongoDB", "JavaScript"],
      },
      {
        id: 2,
        name: "Data Scientist",
        icon: "📊",
        searchQuery: "data scientist machine learning",
        skills: ["Python", "Machine Learning", "SQL", "TensorFlow"],
      },
      {
        id: 3,
        name: "DevOps Engineer",
        icon: "🔧",
        searchQuery: "devops engineer kubernetes",
        skills: ["AWS", "Docker", "Kubernetes", "CI/CD"],
      },
      {
        id: 4,
        name: "Frontend Developer",
        icon: "🎨",
        searchQuery: "frontend react developer",
        skills: ["React", "TypeScript", "CSS", "Next.js"],
      },
      {
        id: 5,
        name: "Backend Developer",
        icon: "⚙️",
        searchQuery: "backend developer api",
        skills: ["Node.js", "Python", "Java", "PostgreSQL"],
      },
      {
        id: 6,
        name: "Cloud Architect",
        icon: "☁️",
        searchQuery: "cloud architect aws azure",
        skills: ["AWS", "Azure", "GCP", "Terraform"],
      },
    ];

    res.json({
      success: true,
      categories: trendingCategories,
      note: "Click a category to search for live listings from RemoteOK, Adzuna, and JSearch.",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch trending categories" });
  }
});

export default router;
