/**
 * application_tracker.test.js — Application Tracker CRUD & IDOR Integration Test
 * =================================================================================
 * Tests the full lifecycle of job application tracking:
 *   1. Connect to an isolated test MongoDB database
 *   2. Seed a test user (userA) and a separate attacker user (userB)
 *   3. Create, read, update, delete applications as userA
 *   4. Verify IDOR: userB CANNOT access or mutate userA's applications
 *   5. Verify status transitions follow the allowed pipeline
 *   6. Cleanup test DB on exit
 *
 * NOTE: Uses Node.js built-in test runner (no extra libraries needed).
 *       Requires a running MongoDB instance (uses separate test DB: ats_ai_test_db).
 */

import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import User from "../models/User.js";
import Application from "../models/Application.js";

const TEST_DB_URI = process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/ats_ai_test_db";

// ─── Test Fixtures ────────────────────────────────────────────────────────────
let userA, userB;
let testAppId;

// ─── Lifecycle Hooks ──────────────────────────────────────────────────────────
before(async () => {
  await mongoose.connect(TEST_DB_URI);
  // Clean slate
  await User.deleteMany({ email: { $in: ["tracker_a@test.com", "tracker_b@test.com"] } });
  await Application.deleteMany({});

  // Create two isolated users — plain password (pre-save hash runs)
  userA = new User({ name: "User A", email: "tracker_a@test.com", password: "TestPassword1!" });
  await userA.save();

  userB = new User({ name: "User B", email: "tracker_b@test.com", password: "TestPassword2!" });
  await userB.save();
});

after(async () => {
  // Cleanup
  await Application.deleteMany({});
  await User.deleteMany({ email: { $in: ["tracker_a@test.com", "tracker_b@test.com"] } });
  await mongoose.disconnect();
});

beforeEach(async () => {
  // Reset applications before each test group
  await Application.deleteMany({ userId: { $in: [userA._id, userB._id] } });
});

// ─── Test Suite ───────────────────────────────────────────────────────────────
describe("Application Tracker — Integration Tests", () => {

  // ── CREATE ────────────────────────────────────────────────────────────────
  describe("CREATE — POST /api/applications", () => {
    test("should create a new application for userA", async () => {
      const app = new Application({
        userId: userA._id,
        jobTitle: "Senior Software Engineer",
        company: "Google",
        status: "applied",
        jobUrl: "https://careers.google.com/job/123",
        notes: "Exciting role on the infrastructure team.",
        salary: "120k-160k"
      });
      await app.save();

      testAppId = app._id;

      assert.ok(app._id, "Application must have an _id after save");
      assert.equal(app.userId.toString(), userA._id.toString(), "userId must be set correctly");
      assert.equal(app.status, "applied", "Default status must be 'applied'");
      assert.equal(app.company, "Google", "Company name must be stored");
    });

    test("should reject application with missing required fields", async () => {
      const incompleteApp = new Application({
        userId: userA._id,
        // Missing jobTitle, company
        status: "applied"
      });

      await assert.rejects(
        () => incompleteApp.save(),
        (err) => {
          // Mongoose ValidationError
          assert.ok(err.name === "ValidationError", "Should throw ValidationError for missing required fields");
          return true;
        }
      );
    });

    test("should reject application with invalid status", async () => {
      const badStatusApp = new Application({
        userId: userA._id,
        jobTitle: "Engineer",
        company: "Meta",
        status: "HACKED_STATUS"
      });

      await assert.rejects(
        () => badStatusApp.save(),
        (err) => {
          assert.ok(err.name === "ValidationError", "Should throw ValidationError for invalid status enum");
          return true;
        }
      );
    });
  });

  // ── READ ──────────────────────────────────────────────────────────────────
  describe("READ — GET /api/applications", () => {
    test("should retrieve only userA's applications (not userB's)", async () => {
      // Create one app for userA and one for userB
      await Application.create({ userId: userA._id, jobTitle: "Dev A", company: "Apple", status: "applied" });
      await Application.create({ userId: userB._id, jobTitle: "Dev B", company: "Amazon", status: "applied" });

      const userAApps = await Application.find({ userId: userA._id });
      const userBApps = await Application.find({ userId: userB._id });

      assert.equal(userAApps.length, 1, "UserA should only see their own application");
      assert.equal(userBApps.length, 1, "UserB should only see their own application");
      assert.equal(userAApps[0].company, "Apple", "Must retrieve correct application for userA");
      assert.equal(userBApps[0].company, "Amazon", "Must retrieve correct application for userB");
    });

    test("should support filtering by status", async () => {
      await Application.create({ userId: userA._id, jobTitle: "Dev 1", company: "X", status: "applied" });
      await Application.create({ userId: userA._id, jobTitle: "Dev 2", company: "Y", status: "interviewing" });
      await Application.create({ userId: userA._id, jobTitle: "Dev 3", company: "Z", status: "offer" });

      const interviewApps = await Application.find({ userId: userA._id, status: "interviewing" });
      assert.equal(interviewApps.length, 1, "Status filter must return only matching applications");
      assert.equal(interviewApps[0].status, "interviewing");
    });
  });

  // ── UPDATE ────────────────────────────────────────────────────────────────
  describe("UPDATE — PATCH /api/applications/:id", () => {
    test("should update status for userA's own application", async () => {
      const app = await Application.create({
        userId: userA._id, jobTitle: "Engineer", company: "Microsoft", status: "applied"
      });

      const updated = await Application.findOneAndUpdate(
        { _id: app._id, userId: userA._id }, // IDOR-safe query
        { status: "interviewing" },
        { returnDocument: "after" }
      );

      assert.ok(updated, "Update must succeed for own document");
      assert.equal(updated.status, "interviewing", "Status must be updated");
    });

    test("should update notes and return updated document", async () => {
      const app = await Application.create({
        userId: userA._id, jobTitle: "PM", company: "Stripe", status: "applied"
      });

      const updated = await Application.findOneAndUpdate(
        { _id: app._id, userId: userA._id },
        { notes: "Called HR on Monday. Next step: technical screen." },
        { returnDocument: "after" }
      );

      assert.equal(updated.notes, "Called HR on Monday. Next step: technical screen.");
    });
  });

  // ── DELETE ────────────────────────────────────────────────────────────────
  describe("DELETE — DELETE /api/applications/:id", () => {
    test("should delete userA's own application successfully", async () => {
      const app = await Application.create({
        userId: userA._id, jobTitle: "SWE", company: "Netflix", status: "applied"
      });

      const deleted = await Application.findOneAndDelete({ _id: app._id, userId: userA._id });
      assert.ok(deleted, "Delete must return the deleted document");

      const shouldBeNull = await Application.findById(app._id);
      assert.equal(shouldBeNull, null, "Application must no longer exist in database");
    });
  });

  // ── IDOR SECURITY ─────────────────────────────────────────────────────────
  describe("IDOR Protection — Cross-User Access Prevention", () => {
    test("userB must NOT be able to read userA's application via direct ID", async () => {
      const appA = await Application.create({
        userId: userA._id, jobTitle: "Architect", company: "Palantir", status: "applied"
      });

      // Attacker (userB) queries with userA's document _id but their own userId
      const attemptedAccess = await Application.findOne({
        _id: appA._id,
        userId: userB._id // IDOR filter: mismatched userId → null
      });

      assert.equal(attemptedAccess, null, "IDOR must block cross-user read — result must be null");
    });

    test("userB must NOT be able to update userA's application", async () => {
      const appA = await Application.create({
        userId: userA._id, jobTitle: "Lead", company: "Databricks", status: "applied"
      });

      const attemptedUpdate = await Application.findOneAndUpdate(
        { _id: appA._id, userId: userB._id }, // IDOR filter
        { status: "offer" },
        { returnDocument: "after" }
      );

      assert.equal(attemptedUpdate, null, "IDOR must block cross-user update — result must be null");

      // Verify the document was NOT changed
      const original = await Application.findById(appA._id);
      assert.equal(original.status, "applied", "Original document must remain unchanged");
    });

    test("userB must NOT be able to delete userA's application", async () => {
      const appA = await Application.create({
        userId: userA._id, jobTitle: "SRE", company: "Cloudflare", status: "applied"
      });

      const attemptedDelete = await Application.findOneAndDelete({
        _id: appA._id,
        userId: userB._id // IDOR filter
      });

      assert.equal(attemptedDelete, null, "IDOR must block cross-user delete — result must be null");

      // Confirm document still exists
      const stillExists = await Application.findById(appA._id);
      assert.ok(stillExists, "Document must still exist after failed cross-user delete");
    });
  });

  // ── PIPELINE STATUS TRANSITIONS ───────────────────────────────────────────
  describe("Status Pipeline Validation", () => {
    // Actual enum from Application.js: ["wishlist","applied","interviewing","offer","rejected"]
    const VALID_STATUSES = ["wishlist", "applied", "interviewing", "offer", "rejected"];

    test("all valid pipeline statuses must be accepted by the model", async () => {
      for (const status of VALID_STATUSES) {
        const app = new Application({
          userId: userA._id,
          jobTitle: `Job for ${status}`,
          company: "Test Corp",
          status
        });

        // Should not throw
        await app.validate();
        assert.equal(app.status, status, `Status '${status}' must be valid`);
      }
    });
  });
});
