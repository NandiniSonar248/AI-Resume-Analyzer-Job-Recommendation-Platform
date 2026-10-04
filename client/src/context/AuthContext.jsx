/**
 * AuthContext.jsx - Authentication State Management
 * ===================================================
 * PURPOSE: Centralized auth state for the entire app
 * 
 * INTERVIEW EXPLANATION:
 * - Uses React Context API for global state
 * - Persists auth token in localStorage
 * - Handles login, register, logout, and verification
 * - Guest mode for trying without account
 * - Auto-checks token validity on app load
 * 
 * WHY CONTEXT OVER REDUX?
 * - For simple auth state, Context is sufficient
 * - Less boilerplate than Redux
 * - React's built-in solution (no extra deps)
 */

import { createContext, useContext, useState, useEffect } from "react";
import { 
  loginUser, 
  registerUser, 
  getCurrentUser, 
  verifyEmail as verifyEmailAPI,
  resendOTP as resendOTPAPI,
  logoutUser
} from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGuest, setIsGuest] = useState(false);

  // Check if user is logged in on app load
  useEffect(() => {
    const token = localStorage.getItem("token");
    const guestMode = localStorage.getItem("guestMode");
    
    if (guestMode === "true") {
      setIsGuest(true);
      setLoading(false);
    } else if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (err) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await loginUser(email, password);
      
      localStorage.setItem("token", response.token);
      if (response.refreshToken) {
        localStorage.setItem("refreshToken", response.refreshToken);
      }
      localStorage.removeItem("guestMode");
      setIsGuest(false);
      setUser(response.user);
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Login failed";
      setError(errorMsg);
      return { success: false };
    }
  };

  const register = async (name, email, password) => {
    setError(null);
    try {
      const response = await registerUser(name, email, password);
      
      if (response.token) {
        localStorage.setItem("token", response.token);
      }
      if (response.refreshToken) {
        localStorage.setItem("refreshToken", response.refreshToken);
      }
      localStorage.removeItem("guestMode");
      setIsGuest(false);
      setUser(response.user);
      
      return { success: true, message: response.message };
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || "Registration failed");
      return { success: false };
    }
  };

  const verifyEmail = async (email, otp) => {
    setError(null);
    try {
      const response = await verifyEmailAPI(email, otp);
      localStorage.setItem("token", response.token);
      if (response.refreshToken) {
        localStorage.setItem("refreshToken", response.refreshToken);
      }
      localStorage.removeItem("guestMode");
      setIsGuest(false);
      setUser(response.user);
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.error || "Verification failed");
      return { success: false };
    }
  };

  const resendOTP = async (email) => {
    setError(null);
    try {
      const response = await resendOTPAPI(email);
      return { success: true, message: response.message };
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend OTP");
      return { success: false };
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      // Ignore errors during logout — we'll clear local state regardless
    }
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("guestMode");
    setUser(null);
    setIsGuest(false);
  };

  const exitGuestMode = () => {
    localStorage.removeItem("guestMode");
    setIsGuest(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      isGuest,
      login, 
      register, 
      logout, 
      setError,
      clearError,
      verifyEmail,
      resendOTP,
      exitGuestMode,
      refreshUser: fetchUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
