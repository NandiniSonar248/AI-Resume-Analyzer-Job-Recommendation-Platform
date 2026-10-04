import mongoose from "mongoose";

/**
 * Analysis Model
 * ============================================
 * PURPOSE: Stores resume analysis results linked to users
 * 
 * INTERVIEW EXPLANATION:
 * - Each analysis is linked to a user via userId
 * - Stores ATS score, matched/missing keywords
 * - Includes AI suggestions for improvement
 * - Indexed by createdAt and userId for fast queries
 * 
 * WHY LINK TO USER:
 * - Users can view their own analysis history
 * - Privacy: users only see their own data
 * - Enables user dashboard statistics
 */

const schema = new mongoose.Schema({
  // Link to user (optional for guest users)
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    index: true
  },
  
  // Analysis results
  atsScore: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100
  },
  category: {
    type: String,
    enum: ["Excellent Match", "Good Match", "Fair Match", "Needs Improvement"],
    default: "Fair Match"
  },
  matchedKeywords: [String],
  missingKeywords: [String],
  
  // Phase 2: Multi-Factor Sub-Scores
  subScores: {
    keywordMatch: { type: mongoose.Schema.Types.Mixed },
    skillsCoverage: { type: mongoose.Schema.Types.Mixed },
    experienceMatch: { type: mongoose.Schema.Types.Mixed },
    formattingCompatibility: { type: mongoose.Schema.Types.Mixed }
  },

  // Phase 2: Parseability Check Results
  parseability: {
    score: Number,
    isCompatible: Boolean,
    rating: String,
    issues: [{ type: mongoose.Schema.Types.Mixed }],
    summary: { type: mongoose.Schema.Types.Mixed }
  },

  // Phase 2: Sentence-Level Explainability
  sentenceHighlights: [{ type: mongoose.Schema.Types.Mixed }],

  // Qualitative AI Assessment (separate layer)
  aiAssessment: {
    executiveSummary: String,
    keyStrengths: [String],
    criticalGaps: [String],
    actionableTips: [String],
    recruiterPerspective: String
  },

  // AI-generated suggestions (backward compatibility)
  aiSuggestions: String,
  aiPowered: {
    type: Boolean,
    default: false
  },
  
  // Resume info
  resumeName: String,
  resumeConfidence: Number,
  
  // Job description info (store first 500 chars for reference)
  jobDescriptionPreview: {
    type: String,
    maxlength: 500
  },
  
  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Indexes for faster queries
schema.index({ createdAt: -1 });
schema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Analysis", schema);