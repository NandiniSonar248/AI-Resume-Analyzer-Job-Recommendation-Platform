/**
 * applicationRoutes.js — Job Application Tracker Routes
 * ========================================================
 * PURPOSE:
 *   CRUD endpoints for managing tracked job applications across a Kanban pipeline:
 *   Wishlist -> Applied -> Interviewing -> Offer -> Rejected.
 *
 * IDOR DEFENSE ARCHITECTURE (Insecure Direct Object Reference):
 *   - Problem: If a route updates using `Application.findByIdAndUpdate(req.params.id, ...)`,
 *     any authenticated user who guesses or iterates an ObjectId can view, modify,
 *     or delete another user's job applications.
 *   - Defense: Every database operation includes `{ _id: req.params.id, userId: req.user.id }`.
 *     Even if a user specifies another user's valid application ID in the URL, MongoDB
 *     finds 0 matches and returns 404, making cross-tenant data tampering mathematically impossible.
 */

import express from "express";
import Application, { APPLICATION_STATUSES } from "../models/Application.js";
import { authenticate } from "../middleware/auth.js";
import { body, validationResult } from "express-validator";

const router = express.Router();

// Require authentication for all tracker endpoints
router.use(authenticate);

const validateApplication = [
  body("jobTitle").trim().notEmpty().withMessage("Job title is required").isLength({ max: 200 }),
  body("company").trim().notEmpty().withMessage("Company name is required").isLength({ max: 200 }),
  body("location").optional().trim().isLength({ max: 200 }),
  body("salary").optional().trim().isLength({ max: 100 }),
  body("source").optional().trim().isLength({ max: 100 }),
  body("sourceUrl").optional().trim().isLength({ max: 1000 }),
  body("notes").optional().trim().isLength({ max: 2000 }),
  body("status").optional().isIn(APPLICATION_STATUSES).withMessage("Invalid application status"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() });
    }
    next();
  }
];

/**
 * GET /api/applications
 * List all applications belonging to the authenticated user
 */
router.get("/", async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user.id })
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (err) {
    console.error("Fetch applications error:", err);
    res.status(500).json({ error: "Failed to retrieve job applications" });
  }
});

/**
 * POST /api/applications
 * Create and track a new job application
 */
router.post("/", validateApplication, async (req, res) => {
  try {
    const {
      jobTitle,
      company,
      location,
      salary,
      source,
      sourceUrl,
      status,
      appliedDate,
      reminderDate,
      interviewDate,
      notes,
      jobDescription
    } = req.body;

    const application = await Application.create({
      userId: req.user.id,
      jobTitle,
      company,
      location: location || "Remote",
      salary: salary || "",
      source: source || "Manual",
      sourceUrl: sourceUrl || "",
      status: status || "applied",
      appliedDate: appliedDate || Date.now(),
      reminderDate: reminderDate || null,
      interviewDate: interviewDate || null,
      notes: notes || "",
      jobDescription: jobDescription || ""
    });

    res.status(201).json({
      success: true,
      message: "Application tracked successfully",
      application
    });
  } catch (err) {
    console.error("Create application error:", err);
    res.status(500).json({ error: "Failed to track job application" });
  }
});

/**
 * GET /api/applications/:id
 * Retrieve a single application (with strict IDOR protection)
 */
router.get("/:id", async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).lean();

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json({ success: true, application });
  } catch (err) {
    console.error("Get application error:", err);
    res.status(500).json({ error: "Failed to fetch application" });
  }
});

/**
 * PUT /api/applications/:id
 * Update an application (with strict IDOR protection)
 */
router.put("/:id", validateApplication, async (req, res) => {
  try {
    const allowedUpdates = [
      "jobTitle",
      "company",
      "location",
      "salary",
      "source",
      "sourceUrl",
      "status",
      "appliedDate",
      "reminderDate",
      "interviewDate",
      "notes",
      "jobDescription"
    ];

    const updateData = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    }

    // IDOR Defense: only matches if _id matches AND belongs to req.user.id
    const updated = await Application.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Application not found or unauthorized" });
    }

    res.json({
      success: true,
      message: "Application updated successfully",
      application: updated
    });
  } catch (err) {
    console.error("Update application error:", err);
    res.status(500).json({ error: "Failed to update application" });
  }
});

/**
 * PATCH /api/applications/:id/status
 * Fast status change (e.g. dragging between Kanban columns)
 */
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !APPLICATION_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${APPLICATION_STATUSES.join(", ")}` });
    }

    const updated = await Application.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { status } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Application not found or unauthorized" });
    }

    res.json({
      success: true,
      message: `Status updated to ${status}`,
      application: updated
    });
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ error: "Failed to update application status" });
  }
});

/**
 * DELETE /api/applications/:id
 * Delete an application (with strict IDOR protection)
 */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Application.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!deleted) {
      return res.status(404).json({ error: "Application not found or unauthorized" });
    }

    res.json({
      success: true,
      message: "Application deleted successfully",
      deletedId: req.params.id
    });
  } catch (err) {
    console.error("Delete application error:", err);
    res.status(500).json({ error: "Failed to delete application" });
  }
});

export default router;
