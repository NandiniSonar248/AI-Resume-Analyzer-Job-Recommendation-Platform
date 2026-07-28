/**
 * Dashboard.jsx - Main Application Dashboard
 * ============================================
 * PURPOSE: Central hub for all app features
 * 
 * INTERVIEW EXPLANATION:
 * - Tab-based navigation (ATS Analyzer, Jobs, Builder, History)
 * - Responsive design with mobile menu
 * - Guest mode support (limited features)
 * - User analysis history tracking
 * - Skills extracted from analyses for job search
 * 
 * STATE MANAGEMENT:
 * - activeTab: current view
 * - data: current analysis result
 * - history: past analyses
 * - userSkills: extracted for job matching
 */

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ResumeForm from "../components/ResumeForm";
import ResultPanel from "../components/ResultPanel";
import JobsPage from "./JobsPage";
import ResumeBuilder from "./ResumeBuilder";
import { getAnalysisHistory } from "../api";
import toast from "react-hot-toast";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, isGuest, exitGuestMode, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("analyze");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redirect if not logged in and not guest, or refresh user if token exists
  useEffect(() => {
    const guestMode = localStorage.getItem("guestMode");
    const token = localStorage.getItem("token");
    
    if (!user && token) {
      // Token exists but user not loaded - refresh user data
      refreshUser?.();
    } else if (!user && guestMode !== "true" && !token) {
      navigate("/login");
    }
  }, [user, navigate, refreshUser]);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  // Extract skills when analysis is done
  useEffect(() => {
    if (data?.matchedKeywords) {
      setUserSkills(prev => [...new Set([...prev, ...data.matchedKeywords])]);
    }
  }, [data]);

  const loadHistory = async () => {
    try {
      const historyData = await getAnalysisHistory();
      setHistory(historyData || []);
    } catch (err) {
      console.log("History not available");
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleSignUp = () => {
    exitGuestMode?.();
    localStorage.removeItem("guestMode");
    navigate("/register");
  };

  const tabs = [
    { id: "analyze", label: "ATS Analyzer", icon: "🎯" },
    { id: "jobs", label: "Find Jobs", icon: "💼" },
    { id: "builder", label: "Resume Builder", icon: "📝" },
    { id: "interview", label: "Interview Prep", icon: "🎤", external: true, href: "/interview" },
    { id: "history", label: "History", icon: "📊", requiresAuth: true }
  ];

  // Check if user is actually authorized
  const isGuestMode = !user && localStorage.getItem("guestMode") === "true";

  return (
    <div className="dashboard">
      {/* Guest Mode Banner */}
      {isGuestMode && (
        <div className="guest-banner">
          <p>
            👋 You're using JobMatch Pro as a guest. 
            <button onClick={handleSignUp} className="guest-signup-btn">
              Sign up free
            </button>
            to save your analysis history!
          </p>
        </div>
      )}

      {/* Professional Navbar */}
      <nav className="pro-navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <Link to="/" className="brand-logo">
              <span className="logo-icon">🎯</span>
              <span className="logo-text">JobMatch<span className="logo-highlight">Pro</span></span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="nav-tabs desktop-only">
            {tabs.map(tab => (
              tab.external ? (
                <Link
                  key={tab.id}
                  to={tab.href}
                  className="nav-tab external-tab"
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label}</span>
                </Link>
              ) : (
                <button
                  key={tab.id}
                  className={`nav-tab ${activeTab === tab.id ? "active" : ""} ${tab.requiresAuth && isGuestMode ? "disabled" : ""}`}
                  onClick={() => {
                    if (tab.requiresAuth && isGuestMode) {
                      toast("Sign up to access your analysis history", { icon: "🔒" });
                      return;
                    }
                    setActiveTab(tab.id);
                  }}
                  disabled={tab.requiresAuth && isGuestMode}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label}</span>
                  {tab.requiresAuth && isGuestMode && <span className="lock-icon">🔒</span>}
                </button>
              )
            ))}
          </div>

          <div className="nav-right">
            {user ? (
              <div className="user-menu">
                <div className="user-avatar">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="user-name desktop-only">{user.name}</span>
                <button onClick={handleLogout} className="logout-btn">
                  <span className="desktop-only">Logout</span>
                  <span className="mobile-only">↪</span>
                </button>
              </div>
            ) : (
              <div className="guest-actions">
                <Link to="/login" className="nav-login-btn">Login</Link>
                <Link to="/register" className="nav-signup-btn">Sign Up</Link>
              </div>
            )}
            
            {/* Mobile Menu Toggle */}
            <button 
              className="mobile-menu-btn mobile-only"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="mobile-nav">
            {tabs.map(tab => (
              tab.external ? (
                <Link
                  key={tab.id}
                  to={tab.href}
                  className="mobile-nav-item"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </Link>
              ) : (
                <button
                  key={tab.id}
                  className={`mobile-nav-item ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => {
                    if (tab.requiresAuth && isGuestMode) {
                      toast("Sign up to access history", { icon: "🔒" });
                      return;
                    }
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              )
            ))}
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* ATS Analyzer Tab */}
        {activeTab === "analyze" && (
          <div className="analyze-page">
            <div className="page-header">
              <h1>🎯 ATS Resume Analyzer</h1>
              <p>Get instant AI-powered feedback on how well your resume matches the job</p>
            </div>

            <div className="analyze-grid">
              <div className="form-column">
                <ResumeForm setData={setData} setError={setError} />
              </div>
              
              <div className="results-column">
                {error && (
                  <div className="error-alert">
                    <span>⚠️</span>
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>×</button>
                  </div>
                )}
                <ResultPanel data={data} />
              </div>
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
          <JobsPage userSkills={userSkills} />
        )}

        {/* Resume Builder Tab */}
        {activeTab === "builder" && (
          <div className="builder-page">
            <div className="page-header">
              <h1>📝 ATS Resume Builder</h1>
              <p>Create a perfectly optimized resume for any job description</p>
            </div>
            <ResumeBuilder />
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="history-page">
            <div className="page-header">
              <h1>📊 Analysis History</h1>
              <p>View your previous resume analyses</p>
            </div>

            {history.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📂</div>
                <h3>No history yet</h3>
                <p>Your analysis results will appear here after you analyze a resume</p>
                <button 
                  className="primary-btn"
                  onClick={() => setActiveTab("analyze")}
                >
                  Analyze Resume →
                </button>
              </div>
            ) : (
              <div className="history-list">
                {history.map((item, i) => (
                  <div key={i} className="history-card">
                    <div className="history-score">
                      <span className="score-value">{item.atsScore || 0}</span>
                      <span className="score-label">Score</span>
                    </div>
                    <div className="history-details">
                      <h4>{item.category || "Analysis"}</h4>
                      <p>
                        {item.matchedKeywords?.length || 0} matched • 
                        {item.missingKeywords?.length || 0} missing
                      </p>
                      <span className="history-date">
                        {new Date(item.analyzedAt || item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="history-badge">
                      {item.aiPowered ? "🤖 AI" : "⚡ Smart"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="pro-footer">
        <div className="footer-content">
          <p>
            <span className="footer-brand">JobMatch Pro</span> © {new Date().getFullYear()} • 
            Powered by AI • Real-time ATS Analysis
          </p>
          <div className="footer-links">
            <Link to="/">Home</Link>
            <a href="mailto:support@jobmatchpro.com">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}