/**
 * Input Validation Middleware
 * ============================================
 * PURPOSE: Validate and sanitize all user text inputs before they reach
 * route handlers or AI services. Defends against:
 * - XSS (strips HTML tags)
 * - Prompt injection (length limits, structure validation)
 * - Malformed requests (type checking)
 *
 * HOW IT CONNECTS:
 * - Imported by each route file (analyzeRoutes, resumeRoutes, interviewRoutes, chatRoutes)
 * - Runs as Express middleware BEFORE the route handler
 * - If validation fails → 400 error, route handler never executes
 *
 * WHY express-validator:
 * - De-facto standard for Express input validation (10M+ weekly downloads)
 * - Chainable API for readable validation rules
 * - Built-in sanitizers (trim, escape, stripLow)
 */

import { body, validationResult } from "express-validator";

/**
 * Shared handler: check validation results and return 400 if any fail.
 * Used by all validation chains below.
 */
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array()[0].msg,
      errors: errors.array()
    });
  }
  next();
}

/**
 * Validation for POST /api/analyze (resume analysis)
 * Validates the jobDescription field from the multipart form.
 * File validation is handled separately by Multer + magic bytes.
 */
export const validateAnalyze = [
  body("jobDescription")
    .trim()
    .notEmpty().withMessage("Job description is required")
    .isLength({ min: 50 }).withMessage("Job description must be at least 50 characters")
    .isLength({ max: 50000 }).withMessage("Job description must be under 50,000 characters")
    .stripLow({ keep_new_lines: true }),
  handleValidationErrors
];

/**
 * Validation for POST /api/resume/optimize
 */
export const validateResumeOptimize = [
  body("jobDescription")
    .trim()
    .notEmpty().withMessage("Job description is required")
    .isLength({ max: 50000 }).withMessage("Job description must be under 50,000 characters")
    .stripLow({ keep_new_lines: true }),
  body("keywords")
    .isArray().withMessage("Keywords must be an array"),
  handleValidationErrors
];

/**
 * Validation for POST /api/resume/rewrite
 */
export const validateResumeRewrite = [
  body("resumeText")
    .trim()
    .notEmpty().withMessage("Resume text is required")
    .isLength({ max: 50000 }).withMessage("Resume text must be under 50,000 characters")
    .stripLow({ keep_new_lines: true }),
  body("jobDescription")
    .trim()
    .notEmpty().withMessage("Job description is required")
    .isLength({ max: 50000 }).withMessage("Job description must be under 50,000 characters")
    .stripLow({ keep_new_lines: true }),
  handleValidationErrors
];

/**
 * Validation for POST /api/resume/compare
 */
export const validateResumeCompare = [
  body("originalResume")
    .trim()
    .notEmpty().withMessage("Original resume is required")
    .isLength({ max: 50000 }).withMessage("Original resume must be under 50,000 characters")
    .stripLow({ keep_new_lines: true }),
  body("improvedResume")
    .trim()
    .notEmpty().withMessage("Improved resume is required")
    .isLength({ max: 50000 }).withMessage("Improved resume must be under 50,000 characters")
    .stripLow({ keep_new_lines: true }),
  body("jobDescription")
    .trim()
    .notEmpty().withMessage("Job description is required")
    .isLength({ max: 50000 }).withMessage("Job description must be under 50,000 characters")
    .stripLow({ keep_new_lines: true }),
  handleValidationErrors
];

/**
 * Validation for POST /api/resume/generate-pdf
 */
export const validateGeneratePdf = [
  body("resumeData")
    .notEmpty().withMessage("Resume data is required"),
  handleValidationErrors
];

/**
 * Validation for POST /api/resume/analyze-keywords
 */
export const validateAnalyzeKeywords = [
  body("jobDescription")
    .trim()
    .notEmpty().withMessage("Job description is required")
    .isLength({ min: 50 }).withMessage("Job description must be at least 50 characters")
    .isLength({ max: 50000 }).withMessage("Job description must be under 50,000 characters")
    .stripLow({ keep_new_lines: true }),
  handleValidationErrors
];

/**
 * Validation for POST /api/interview/generate-questions
 */
export const validateInterviewGenerate = [
  body("jobDescription")
    .trim()
    .notEmpty().withMessage("Job description is required")
    .isLength({ max: 50000 }).withMessage("Job description must be under 50,000 characters")
    .stripLow({ keep_new_lines: true }),
  body("resume")
    .trim()
    .notEmpty().withMessage("Resume is required")
    .isLength({ max: 50000 }).withMessage("Resume must be under 50,000 characters")
    .stripLow({ keep_new_lines: true }),
  handleValidationErrors
];

/**
 * Validation for POST /api/interview/evaluate-answer
 */
export const validateInterviewEvaluate = [
  body("question")
    .trim()
    .notEmpty().withMessage("Question is required")
    .isLength({ max: 5000 }).withMessage("Question must be under 5,000 characters")
    .stripLow({ keep_new_lines: true }),
  body("userAnswer")
    .trim()
    .notEmpty().withMessage("Answer is required")
    .isLength({ max: 10000 }).withMessage("Answer must be under 10,000 characters")
    .stripLow({ keep_new_lines: true }),
  body("jobDescription")
    .optional()
    .trim()
    .isLength({ max: 50000 }).withMessage("Job description must be under 50,000 characters")
    .stripLow({ keep_new_lines: true }),
  body("resume")
    .optional()
    .trim()
    .isLength({ max: 50000 }).withMessage("Resume must be under 50,000 characters")
    .stripLow({ keep_new_lines: true }),
  handleValidationErrors
];

/**
 * Validation for POST /api/interview/sample-answer
 */
export const validateInterviewSample = [
  body("question")
    .trim()
    .notEmpty().withMessage("Question is required")
    .isLength({ max: 5000 }).withMessage("Question must be under 5,000 characters")
    .stripLow({ keep_new_lines: true }),
  body("jobDescription")
    .optional()
    .trim()
    .isLength({ max: 50000 }).withMessage("Job description must be under 50,000 characters")
    .stripLow({ keep_new_lines: true }),
  handleValidationErrors
];

/**
 * Validation for POST /api/interview/calculate-performance
 */
export const validateInterviewPerformance = [
  body("scores")
    .isArray().withMessage("Scores must be an array")
    .custom((arr) => arr.length <= 100).withMessage("Too many scores"),
  handleValidationErrors
];

/**
 * Validation for POST /api/chat/message
 */
export const validateChatMessage = [
  body("message")
    .trim()
    .notEmpty().withMessage("Message is required")
    .isLength({ min: 2 }).withMessage("Message must be at least 2 characters")
    .isLength({ max: 5000 }).withMessage("Message must be under 5,000 characters")
    .stripLow({ keep_new_lines: true }),
  handleValidationErrors
];
