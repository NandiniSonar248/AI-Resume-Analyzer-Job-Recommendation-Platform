/**
 * Application.js — Mongoose Model for Application Tracking
 * ==========================================================
 * PURPOSE:
 *   Stores tracked job applications across the hiring pipeline:
 *   Wishlist -> Applied -> Interviewing -> Offer -> Rejected.
 *
 * IDOR DEFENSE:
 *   Every application document is strictly bound to `userId`.
 *   Queries MUST filter by `userId` to ensure complete tenant isolation.
 */

import mongoose from "mongoose";

export const APPLICATION_STATUSES = [
  "wishlist",
  "applied",
  "interviewing",
  "offer",
  "rejected"
];

const ApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    jobTitle: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: 200
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: 200
    },
    location: {
      type: String,
      trim: true,
      default: "Remote"
    },
    salary: {
      type: String,
      trim: true,
      default: ""
    },
    source: {
      type: String,
      trim: true,
      default: "Manual"
    },
    sourceUrl: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: "applied",
      index: true
    },
    appliedDate: {
      type: Date,
      default: Date.now
    },
    reminderDate: {
      type: Date,
      default: null
    },
    interviewDate: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ""
    },
    jobDescription: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

// Compound index for performant user-scoped pipeline queries
ApplicationSchema.index({ userId: 1, status: 1 });

const Application = mongoose.model("Application", ApplicationSchema);
export default Application;
