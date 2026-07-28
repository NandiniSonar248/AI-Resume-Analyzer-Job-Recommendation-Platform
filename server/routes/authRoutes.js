/**
 * Authentication Routes
 * ============================================
 * PURPOSE: Handles all user authentication operations
 * 
 * INTERVIEW EXPLANATION:
 * - Register: Creates account + sends verification OTP via email
 * - Verify: Confirms email with OTP code
 * - Login: Authenticates user + returns JWT token
 * - Forgot Password: Sends reset link to email
 * - Reset Password: Changes password via token
 * - Change Password: Updates password when logged in
 * 
 * SECURITY FEATURES:
 * - Passwords hashed with bcrypt (12 salt rounds)
 * - JWT tokens for session management
 * - OTP hashed before storage
 * - Rate limiting prevents brute force
 * - Input validation on all endpoints
 */

import express from "express";
import crypto from "crypto";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";
import { generateToken, authenticate } from "../middleware/auth.js";
import {
  sendVerificationOTP,
  sendPasswordResetEmail,
  sendWelcomeEmail
} from "../services/emailService.js";
import { validateEmailComplete } from "../services/emailValidationService.js";
import { logger } from "../utils/logger.js";

const router = express.Router();

// Validation rules
const registerValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be 2-50 characters")
    .escape(),
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
];

const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
];

/**
 * POST /api/auth/register - Register new user
 * Sends verification OTP to email
 */
router.post("/register", registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;

    // Validate email is real (not fake/temporary)
    const emailValidation = await validateEmailComplete(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        error: emailValidation.reason,
        code: "INVALID_EMAIL_DOMAIN"
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (!existingUser.isVerified) {
        // Delete unverified user and allow re-registration
        await User.deleteOne({ _id: existingUser._id });
      } else {
        return res.status(400).json({ error: "Email already registered. Please login." });
      }
    }

    // Create user
    const user = await User.create({ name, email, password });

    // Generate and send verification OTP
    const otp = user.generateVerificationOTP();
    await user.save();
    await sendVerificationOTP(email, otp, name);

    logger.info(`New user registered`);

    res.status(201).json({
      message: "Registration successful! Please check your email for verification code.",
      email: user.email,
      requiresVerification: true
    });
  } catch (err) {
    logger.error("Registration error");
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

/**
 * POST /api/auth/verify-email - Verify email with OTP
 */
router.post("/verify-email", [
  body("email").isEmail().normalizeEmail(),
  body("otp").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, otp } = req.body;

    const user = await User.findOne({ email })
      .select("+verificationOTP +verificationOTPExpires");
    
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // If already verified, return success with token so user can proceed
    if (user.isVerified) {
      const token = generateToken(user._id);
      logger.info(`Already verified user accessed verify-email`);
      return res.json({
        message: "Email already verified! Redirecting to dashboard.",
        alreadyVerified: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isVerified: true
        }
      });
    }

    if (!user.verifyOTP(otp)) {
      return res.status(400).json({ error: "Invalid or expired OTP. Please request a new one." });
    }

    user.isVerified = true;
    user.verificationOTP = undefined;
    user.verificationOTPExpires = undefined;
    await user.save();

    const token = generateToken(user._id);
    await sendWelcomeEmail(email, user.name);

    logger.info(`Email verified`);

    res.json({
      message: "Email verified successfully! Welcome to JobMatch Pro.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: true
      }
    });
  } catch (err) {
    logger.error("Verification error");
    res.status(500).json({ error: "Verification failed. Please try again." });
  }
});

/**
 * POST /api/auth/resend-otp - Resend verification OTP
 */
router.post("/resend-otp", [
  body("email").isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // If already verified, return success response so user can proceed to login
    if (user.isVerified) {
      return res.json({ 
        message: "Email already verified! Please login.",
        alreadyVerified: true
      });
    }

    const otp = user.generateVerificationOTP();
    await user.save();
    await sendVerificationOTP(email, otp, user.name);

    res.json({ message: "New verification code sent to your email" });
  } catch (err) {
    res.status(500).json({ error: "Failed to resend OTP" });
  }
});

/**
 * POST /api/auth/login - Login user
 */
router.post("/login", loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if verified
    if (!user.isVerified) {
      const otp = user.generateVerificationOTP();
      await user.save();
      await sendVerificationOTP(email, otp, user.name);
      
      return res.status(403).json({ 
        error: "Please verify your email first. A new code has been sent.",
        requiresVerification: true,
        email: user.email
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    logger.info(`User logged in`);

    res.json({
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    logger.error("Login error");
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

/**
 * POST /api/auth/forgot-password - Send password reset email
 */
router.post("/forgot-password", [
  body("email").isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.json({ message: "If an account exists, a password reset link has been sent." });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();
    await sendPasswordResetEmail(email, resetToken, user.name);

    logger.info(`Password reset requested`);

    res.json({ message: "Password reset link sent to your email. Check your inbox." });
  } catch (err) {
    logger.error("Forgot password error");
    res.status(500).json({ error: "Failed to send reset email. Please try again." });
  }
});

/**
 * POST /api/auth/reset-password - Reset password with token
 */
router.post("/reset-password", [
  body("token").notEmpty().withMessage("Reset token is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { token, password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset link. Please request a new one." });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.isVerified = true;
    await user.save();

    logger.info(`Password reset successful`);

    res.json({ message: "Password reset successful! You can now login with your new password." });
  } catch (err) {
    logger.error("Reset password error");
    res.status(500).json({ error: "Failed to reset password. Please try again." });
  }
});

/**
 * PUT /api/auth/change-password - Change password when logged in
 */
router.put("/change-password", authenticate, [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters")
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    logger.info(`Password changed`);

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to change password" });
  }
});

/**
 * GET /api/auth/me - Get current user
 */
router.get("/me", authenticate, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        isVerified: req.user.isVerified,
        createdAt: req.user.createdAt,
        lastLogin: req.user.lastLogin
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get user info" });
  }
});

/**
 * PUT /api/auth/update - Update user profile
 */
router.put("/update", authenticate, [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be 2-50 characters")
    .escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const updates = {};
    if (req.body.name) updates.name = req.body.name;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

/**
 * DELETE /api/auth/delete-account - Delete user account
 */
router.delete("/delete-account", authenticate, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    logger.info(`Account deleted`);
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export default router;
