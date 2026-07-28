/**
 * Email Service
 * ============================================
 * PURPOSE: Sends emails for verification, password reset, welcome messages
 * 
 * INTERVIEW EXPLANATION:
 * - Uses Nodemailer library to send emails via SMTP
 * - Supports Gmail, SendGrid, and other providers
 * - Has fallback for development (logs to console)
 * - Uses HTML templates for professional emails
 * 
 * WHY THIS IS NEEDED:
 * - Email verification prevents fake signups
 * - Password reset is essential user feature
 * - Welcome emails improve user engagement
 */

import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Email configuration
const EMAIL_CONFIG = {
  service: process.env.EMAIL_SERVICE || "gmail",
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS,
  from: process.env.EMAIL_FROM || "JobMatch Pro <noreply@jobmatchpro.com>"
};

// Check if email is configured
const isEmailConfigured = EMAIL_CONFIG.user && EMAIL_CONFIG.pass;

// Create transporter
let transporter = null;

if (isEmailConfigured) {
  transporter = nodemailer.createTransport({
    service: EMAIL_CONFIG.service,
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: EMAIL_CONFIG.user,
      pass: EMAIL_CONFIG.pass
    },
    tls: {
      rejectUnauthorized: false  // Fix for self-signed certificate error
    }
  });
  
  // Verify connection
  transporter.verify((error) => {
    if (error) {
      console.warn("⚠️ Email service not available:", error.message);
    } else {
      console.log("✅ Email service ready");
      console.log(`📧 Emails will be sent from: ${EMAIL_CONFIG.user}`);
    }
  });
} else {
  console.log("ℹ️ Email not configured - emails will be logged to console");
}

/**
 * Send email
 * @param {Object} options - Email options
 * @returns {Promise<boolean>} - Success status
 */
export async function sendEmail({ to, subject, html, text }) {
  try {
    if (!transporter) {
      // Development fallback - log to console
      console.log("\n📧 EMAIL (Dev Mode):");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${text || "See HTML"}`);
      console.log("---\n");
      return true;
    }

    await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to,
      subject,
      html,
      text
    });

    console.log(`📧 Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("Email send error:", error.message);
    return false;
  }
}

/**
 * Send OTP for email verification
 * WHY: Verifies that user owns the email address
 */
export async function sendVerificationOTP(email, otp, userName) {
  const subject = "Verify Your Email - JobMatch Pro";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0a66c2, #004182); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎯 JobMatch Pro</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">AI-Powered Resume Analyzer</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px;">
          <h2 style="color: #1e293b; margin: 0 0 16px; font-size: 22px;">Verify Your Email</h2>
          
          <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            Hi ${userName || "there"}! 👋<br><br>
            Welcome to JobMatch Pro! Use the verification code below to complete your registration:
          </p>
          
          <!-- OTP Box -->
          <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
            <p style="color: #64748b; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
            <div style="font-size: 36px; font-weight: bold; color: #0a66c2; letter-spacing: 8px; font-family: monospace;">
              ${otp}
            </div>
          </div>
          
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0;">
            ⏰ This code expires in <strong>10 minutes</strong>.<br>
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
            © 2026 JobMatch Pro. Helping job seekers land their dream jobs.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Your JobMatch Pro verification code is: ${otp}. It expires in 10 minutes.`;

  return sendEmail({ to: email, subject, html, text });
}

/**
 * Send password reset link
 * WHY: Allows users to recover their account
 */
export async function sendPasswordResetEmail(email, resetToken, userName) {
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;
  const subject = "Reset Your Password - JobMatch Pro";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0a66c2, #004182); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎯 JobMatch Pro</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px;">
          <h2 style="color: #1e293b; margin: 0 0 16px; font-size: 22px;">Reset Your Password</h2>
          
          <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            Hi ${userName || "there"},<br><br>
            We received a request to reset your password. Click the button below to create a new password:
          </p>
          
          <!-- Button -->
          <div style="text-align: center; margin: 0 0 24px;">
            <a href="${resetUrl}" style="display: inline-block; background: #0a66c2; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0 0 16px;">
            ⏰ This link expires in <strong>1 hour</strong>.
          </p>
          
          <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 0; padding: 12px; background: #fef3c7; border-radius: 8px;">
            🔒 If you didn't request this, please ignore this email. Your password will remain unchanged.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
            © 2026 JobMatch Pro. Helping job seekers land their dream jobs.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Reset your password: ${resetUrl}. Link expires in 1 hour.`;

  return sendEmail({ to: email, subject, html, text });
}

/**
 * Send welcome email after verification
 * WHY: Improves user engagement and provides next steps
 */
export async function sendWelcomeEmail(email, userName) {
  const subject = "Welcome to JobMatch Pro! 🎉";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #059669, #047857); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px;">🎉</h1>
          <h2 style="color: white; margin: 12px 0 0; font-size: 24px;">Welcome Aboard!</h2>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px;">
          <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            Hi <strong>${userName}</strong>! 👋<br><br>
            Your email is verified and your account is ready. You can now:
          </p>
          
          <!-- Features -->
          <div style="margin: 0 0 24px;">
            <div style="display: flex; align-items: center; margin-bottom: 12px; padding: 12px; background: #f0fdf4; border-radius: 8px;">
              <span style="font-size: 24px; margin-right: 12px;">🎯</span>
              <span style="color: #1e293b; font-size: 14px;"><strong>Analyze your resume</strong> against any job description</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 12px; padding: 12px; background: #eff6ff; border-radius: 8px;">
              <span style="font-size: 24px; margin-right: 12px;">💼</span>
              <span style="color: #1e293b; font-size: 14px;"><strong>Find matching jobs</strong> based on your skills</span>
            </div>
            <div style="display: flex; align-items: center; padding: 12px; background: #fef3c7; border-radius: 8px;">
              <span style="font-size: 24px; margin-right: 12px;">📝</span>
              <span style="color: #1e293b; font-size: 14px;"><strong>Build ATS-optimized resumes</strong> that get noticed</span>
            </div>
          </div>
          
          <!-- CTA -->
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}" style="display: inline-block; background: #0a66c2; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
              Start Analyzing →
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
            Questions? Reply to this email. We're here to help!<br>
            © 2026 JobMatch Pro
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}

export default {
  sendEmail,
  sendVerificationOTP,
  sendPasswordResetEmail,
  sendWelcomeEmail
};
