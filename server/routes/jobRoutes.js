/**
 * Job Routes
 * API endpoints for job search and matching
 */

import express from "express";
import { searchJobs, matchJobsWithResume } from "../services/jobSearchService.js";
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/jobs/search
 * Search for jobs based on query
 */
router.get("/search", optionalAuth, async (req, res) => {
  try {
    const { q, location = "India", page = 1 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        error: "Search query is required (minimum 2 characters)" 
      });
    }

    const jobs = await searchJobs(q.trim(), location, parseInt(page));
    
    res.json({
      success: true,
      query: q,
      location,
      count: jobs.length,
      jobs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Job search error:", error.message);
    res.status(500).json({ 
      error: "Failed to search jobs. Please try again." 
    });
  }
});

/**
 * POST /api/jobs/match
 * Match jobs based on resume skills
 */
router.post("/match", optionalAuth, async (req, res) => {
  try {
    const { skills, location = "India" } = req.body;
    
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ 
        error: "Skills array is required" 
      });
    }

    const jobs = await matchJobsWithResume(skills, location);
    
    res.json({
      success: true,
      skillsUsed: skills,
      count: jobs.length,
      jobs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Job match error:", error.message);
    res.status(500).json({ 
      error: "Failed to match jobs. Please try again." 
    });
  }
});

/**
 * GET /api/jobs/trending
 * Get trending job categories
 */
router.get("/trending", async (req, res) => {
  try {
    const trendingCategories = [
      {
        id: 1,
        name: "Full Stack Developer",
        icon: "💻",
        count: "10K+ jobs",
        growth: "+15%",
        skills: ["React", "Node.js", "MongoDB", "JavaScript"]
      },
      {
        id: 2,
        name: "Data Scientist",
        icon: "📊",
        count: "8K+ jobs",
        growth: "+25%",
        skills: ["Python", "Machine Learning", "SQL", "TensorFlow"]
      },
      {
        id: 3,
        name: "DevOps Engineer",
        icon: "🔧",
        count: "6K+ jobs",
        growth: "+20%",
        skills: ["AWS", "Docker", "Kubernetes", "CI/CD"]
      },
      {
        id: 4,
        name: "Frontend Developer",
        icon: "🎨",
        count: "12K+ jobs",
        growth: "+10%",
        skills: ["React", "TypeScript", "CSS", "Tailwind"]
      },
      {
        id: 5,
        name: "Backend Developer",
        icon: "⚙️",
        count: "9K+ jobs",
        growth: "+12%",
        skills: ["Node.js", "Python", "Java", "PostgreSQL"]
      },
      {
        id: 6,
        name: "Cloud Architect",
        icon: "☁️",
        count: "4K+ jobs",
        growth: "+30%",
        skills: ["AWS", "Azure", "GCP", "Terraform"]
      }
    ];

    res.json({
      success: true,
      categories: trendingCategories,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch trending jobs" });
  }
});

export default router;
