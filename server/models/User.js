import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * User Model
 * ============================================
 * PURPOSE: Stores user account information
 * 
 * INTERVIEW EXPLANATION:
 * - Stores user credentials securely (password is hashed)
 * - Includes email verification system (OTP-based)
 * - Supports password reset via email tokens
 * - Tracks user activity (last login, created at)
 * 
 * WHY THESE FIELDS:
 * - isVerified: Prevents fake signups, ensures real email
 * - verificationOTP: 6-digit code sent to email
 * - resetPasswordToken: Secure token for password reset
 * - All tokens have expiry for security
 */

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"],
    maxlength: [50, "Name cannot exceed 50 characters"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"]
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false // Don't return password in queries by default
  },
  
  // Email Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationOTP: {
    type: String,
    select: false
  },
  verificationOTPExpires: {
    type: Date,
    select: false
  },
  
  // Password Reset
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpires: {
    type: Date,
    select: false
  },
  
  // Activity Tracking
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

/**
 * Generate 6-digit OTP for email verification
 * WHY: Simple, user-friendly verification method
 */
userSchema.methods.generateVerificationOTP = function() {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash OTP before storing (security)
  this.verificationOTP = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
  
  // OTP expires in 10 minutes
  this.verificationOTPExpires = Date.now() + 10 * 60 * 1000;
  
  return otp; // Return plain OTP to send via email
};

/**
 * Verify OTP
 */
userSchema.methods.verifyOTP = function(otp) {
  const hashedOTP = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
  
  return this.verificationOTP === hashedOTP && 
         this.verificationOTPExpires > Date.now();
};

/**
 * Generate password reset token
 * WHY: Secure way to reset password via email link
 */
userSchema.methods.generatePasswordResetToken = function() {
  // Generate random token
  const resetToken = crypto.randomBytes(32).toString("hex");
  
  // Hash token before storing
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  
  // Token expires in 1 hour
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
  
  return resetToken; // Return plain token for email link
};

// Hash password before saving
userSchema.pre("save", async function(next) {
  // Only hash if password is modified
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    return false;
  }
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

export default mongoose.model("User", userSchema);
