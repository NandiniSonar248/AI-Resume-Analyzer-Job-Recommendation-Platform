/**
 * Email Verification Page
 * ============================================
 * PURPOSE: Allows users to verify their email with OTP
 * 
 * INTERVIEW EXPLANATION:
 * - User enters 6-digit OTP from email
 * - Validates OTP against server
 * - Auto-focus moves between inputs
 * - Resend OTP option with cooldown
 * 
 * WHY EMAIL VERIFICATION:
 * - Prevents fake signups
 * - Confirms user owns email
 * - Required for password reset
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyEmail, resendOTP } from "../api";
import { useAuth } from "../context/AuthContext";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  
  const email = location.state?.email || "";
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cooldown, setCooldown] = useState(0);
  
  const inputRefs = useRef([]);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate("/register");
    }
  }, [email, navigate]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace - move to previous input
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    // CHANGE 1: Trim spaces from pasted data
    const pastedData = e.clipboardData.getData("text").trim().slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split("").concat(Array(6).fill("")).slice(0, 6);
      setOtp(newOtp);
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    // CHANGE 2: Join OTP and trim any whitespace
    const otpString = otp.join("").trim();

    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // CHANGE 3: Send trimmed OTP to backend
      const response = await verifyEmail(email, otpString);
      
      // Save token and user
      localStorage.setItem("token", response.token);
      setUser(response.user);
      
      // Handle both fresh verification and already verified cases
      if (response.alreadyVerified) {
        setSuccess("Email already verified! Redirecting...");
      } else {
        setSuccess("Email verified successfully!");
      }
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Verification failed. Please try again.";
      
      // If email is already verified, redirect to login instead of showing error
      if (errorMessage.toLowerCase().includes("already verified")) {
        setSuccess("Email already verified! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
        return;
      }
      
      setError(errorMessage);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    
    setResending(true);
    setError("");
    
    try {
      const response = await resendOTP(email);
      
      // If email is already verified, redirect to login
      if (response.alreadyVerified) {
        setSuccess("Email already verified! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
        return;
      }
      
      setSuccess("New verification code sent to your email!");
      setCooldown(60); // 60 second cooldown
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      
      // Clear success after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card verify-card">
        <div className="auth-header">
          <div className="auth-logo">📧</div>
          <h1>Verify Your Email</h1>
          <p>We've sent a 6-digit code to</p>
          <p className="verify-email">{email}</p>
        </div>

        <form onSubmit={handleVerify} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}
          
          <div className="otp-inputs">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="otp-input"
                autoFocus={index === 0}
              />
            ))}
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Verifying...
              </>
            ) : (
              "Verify Email"
            )}
          </button>
        </form>

        <div className="resend-section">
          <p>Didn't receive the code?</p>
          <button 
            onClick={handleResend} 
            className="resend-btn"
            disabled={cooldown > 0 || resending}
          >
            {resending ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
          </button>
        </div>

        <div className="auth-footer">
          <button onClick={() => navigate("/register")} className="auth-link">
            ← Back to Register
          </button>
        </div>
      </div>
    </div>
  );
}
