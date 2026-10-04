/**
 * App.jsx - Main Application Component
 * ============================================
 * PURPOSE: Root component with routing
 * 
 * INTERVIEW EXPLANATION:
 * - Uses React Router for navigation
 * - AuthProvider wraps app for auth context
 * - Protected routes require authentication
 * - Guest mode allows trying without signup
 * 
 * ROUTES:
 * - / : Landing page (public)
 * - /login : Login page
 * - /register : Registration page
 * - /verify-email : Email verification
 * - /forgot-password : Password reset request
 * - /reset-password : Password reset form
 * - /dashboard : Main app (protected)
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import InterviewPrep from "./pages/InterviewPrep";
import ApplicationTracker from "./pages/ApplicationTracker";

// Components
import AIChat from "./components/AIChat.jsx";

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading, isGuest } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  // Allow access if user is logged in, guest mode, or token exists in localStorage
  const token = localStorage.getItem("token");
  const guestMode = localStorage.getItem("guestMode") === "true";
  
  if (!user && !isGuest && !token && !guestMode) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Guest Route - redirects to dashboard if already logged in
function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Guest Routes (redirect if logged in) */}
      <Route path="/login" element={
        <GuestRoute><Login /></GuestRoute>
      } />
      <Route path="/register" element={
        <GuestRoute><Register /></GuestRoute>
      } />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/interview" element={
        <ProtectedRoute><InterviewPrep /></ProtectedRoute>
      } />
      <Route path="/tracker" element={
        <ProtectedRoute><ApplicationTracker /></ProtectedRoute>
      } />
      
      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#fff',
              borderRadius: '8px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' }
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' }
            }
          }}
        />
        <AIChat />
      </AuthProvider>
    </BrowserRouter>
  );
}