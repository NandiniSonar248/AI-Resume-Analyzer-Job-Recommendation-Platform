/**
 * Forgot Password Page
 * ============================================
 * PURPOSE: Allows users to request password reset
 * 
 * INTERVIEW EXPLANATION:
 * - User enters email address
 * - Server sends reset link to email
 * - No indication if email exists (security)
 * - Link expires in 1 hour
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">✉️</div>
            <h1>Check Your Email</h1>
            <p>We've sent a password reset link to:</p>
            <p className="verify-email">{email}</p>
          </div>
          
          <div className="success-message">
            <p>Click the link in the email to reset your password. The link will expire in 1 hour.</p>
            <p className="hint">Didn't receive it? Check your spam folder.</p>
          </div>
          
          <div className="auth-footer">
            <Link to="/login" className="auth-link">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🔑</div>
          <h1>Forgot Password?</h1>
          <p>No worries! Enter your email and we'll send you a reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          
          <div className="auth-field">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Sending...
              </>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Remember your password?{" "}
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
