/**
 * Login.jsx - User Login Page
 * ========================================
 * PURPOSE: Authenticate existing users
 * 
 * INTERVIEW EXPLANATION:
 * - Uses React Router for navigation
 * - Handles unverified accounts by redirecting to verification
 * - "Continue as Guest" allows trying without account
 * - Form validation before submission
 * - Loading states for UX feedback
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  const { login, error, setError, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError?.();
    
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    
    if (result.success) {
      toast.success("Welcome back!");
      navigate("/dashboard");
    } else if (result.requiresVerification) {
      // Redirect to verify email page
      toast("Please verify your email first");
      navigate("/verify-email", { state: { email } });
    }
  };

  const handleGuestMode = () => {
    // Set guest mode in localStorage and navigate
    localStorage.setItem("guestMode", "true");
    navigate("/dashboard");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <Link to="/" className="auth-back-link">← Back to Home</Link>
        
        <div className="auth-header">
          <div className="auth-logo">🎯</div>
          <h1>Welcome Back</h1>
          <p>Sign in to continue to AI Job Matcher</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          
          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div className="auth-options">
            <Link to="/forgot-password" className="auth-link">
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="auth-link">
              Sign Up
            </Link>
          </p>
        </div>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button onClick={handleGuestMode} className="auth-guest-btn">
          Continue as Guest
        </button>
      </div>
    </div>
  );
}
