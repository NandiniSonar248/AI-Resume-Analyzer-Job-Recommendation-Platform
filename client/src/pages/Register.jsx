/**
 * Register.jsx - User Registration Page
 * =========================================
 * PURPOSE: Create new user accounts
 * 
 * INTERVIEW EXPLANATION:
 * - After registration, user is redirected to verify email
 * - Password validation (min 6 chars, must match)
 * - Email validation on server side
 * - OTP is sent automatically on successful registration
 * - Uses React Router for navigation
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Register() {
  const navigate = useNavigate();
  const { register, error, setError, clearError } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError?.();
    
    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const result = await register(name, email, password);
    setLoading(false);
    
    if (result.success) {
      toast.success("Account created! Please verify your email.");
      navigate("/verify-email", { state: { email } });
    }
  };

  const handleGuestMode = () => {
    localStorage.setItem("guestMode", "true");
    navigate("/dashboard");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <Link to="/" className="auth-back-link">← Back to Home</Link>
        
        <div className="auth-header">
          <div className="auth-logo">🎯</div>
          <h1>Create Account</h1>
          <p>Sign up to save your analysis history</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          
          <div className="auth-field">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

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
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Sign In
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
