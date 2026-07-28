import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";

export default function ResultPanel({ data }) {
  const [improvedResume, setImprovedResume] = useState(null);
  const [changeSummary, setChangeSummary] = useState(null);
  const [loadingResume, setLoadingResume] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  if (!data) {
    return (
      <div className="card">
        <div className="result-placeholder">
          <div className="result-placeholder-icon">📊</div>
          <h3>Your Results Will Appear Here</h3>
          <p>Upload your resume and paste a job description to get started</p>
        </div>
      </div>
    );
  }

  const {
    atsScore = 0,
    category = "Unknown",
    categoryEmoji = "📊",
    matchedKeywords = [],
    missingKeywords = [],
    suggestions = "",
    matchPercentage = 0,
    analyzedAt = "",
    isRealTime = false,
    aiPowered = false,
    resumeText = "",
    jobDescription = ""
  } = data;

  // Format analysis time
  const analysisTime = analyzedAt ? new Date(analyzedAt).toLocaleTimeString() : "";

  const generateImprovedResume = async () => {
    if (!resumeText || !jobDescription) {
      toast.error("Resume and job description required");
      return;
    }

    setLoadingResume(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${API_BASE}/resume/rewrite`,
        {
          resumeText,
          jobDescription
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      if (response.data.success) {
        setImprovedResume(response.data.improvedResume);
        setChangeSummary(response.data.changeSummary);
        setShowComparison(true);
        toast.success("✨ Improved resume generated!");
      }
    } catch (err) {
      console.error("Error:", err);
      const errorMsg = err.response?.data?.error || err.message || "Failed to generate improved resume";
      toast.error(errorMsg);
    } finally {
      setLoadingResume(false);
    }
  };

  return (
    <div className="card fade-in">
      {/* Real-time & AI Badge */}
      <div className="badges-container">
        {isRealTime && (
          <div className="realtime-badge">
            <span className="pulse-dot"></span>
            Real-time Analysis • {analysisTime}
          </div>
        )}
        {aiPowered && (
          <div className="ai-badge">
            🤖 AI-Powered (Groq Llama 3)
          </div>
        )}
        {!aiPowered && (
          <div className="rule-badge">
            ⚡ Smart Analysis
          </div>
        )}
      </div>

      {/* Score Section */}
      <div className="score-card">
        <div className="score-circle">
          <div className="score-number">{atsScore}</div>
          <div className="score-label">ATS Score</div>
        </div>
        <div className="score-category">
          <span>{categoryEmoji}</span>
          <span>{category} Match</span>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-value">{matchedKeywords.length}</div>
          <div className="stat-label">Matched</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{missingKeywords.length}</div>
          <div className="stat-label">Missing</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{matchPercentage}%</div>
          <div className="stat-label">Coverage</div>
        </div>
      </div>

      {/* Matched Keywords */}
      {matchedKeywords.length > 0 && (
        <div className="keywords-section">
          <div className="keywords-title">
            <span>✅</span> Matched Keywords ({matchedKeywords.length})
          </div>
          <div className="keywords-list">
            {matchedKeywords.map((keyword, i) => (
              <span key={i} className="keyword-tag matched">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Missing Keywords */}
      {missingKeywords.length > 0 && (
        <div className="keywords-section">
          <div className="keywords-title">
            <span>❌</span> Missing Keywords ({missingKeywords.length})
          </div>
          <div className="keywords-list">
            {missingKeywords.map((keyword, i) => (
              <span key={i} className="keyword-tag missing">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions && (
        <>
          <div className="card-header">
            <span>💡</span> AI Suggestions
          </div>
          <div className="suggestions-content">
            {suggestions.split("**").map((part, i) =>
              i % 2 === 1 ? <strong key={i}>{part}</strong> : part
            )}
          </div>
        </>
      )}

      {/* Improved Resume Section */}
      <div className="improved-resume-section">
        <button
          onClick={generateImprovedResume}
          disabled={loadingResume}
          className="btn-improved-resume"
        >
          {loadingResume ? "Generating..." : "✨ Get Improved Resume"}
        </button>
      </div>

      {/* Improved Resume Display */}
      {showComparison && improvedResume && (
        <div className="improved-resume-display">
          <h3>📄 Improved Resume</h3>
          <div className="resume-text">
            {improvedResume}
          </div>

          {changeSummary && (
            <div className="change-summary">
              <h4>📊 What Changed</h4>
              <div className="summary-content">
                {changeSummary.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              const element = document.createElement("a");
              const file = new Blob([improvedResume], {type: 'text/plain'});
              element.href = URL.createObjectURL(file);
              element.download = "improved-resume.txt";
              document.body.appendChild(element);
              element.click();
              document.body.removeChild(element);
            }}
            className="btn-download"
          >
            ⬇️ Download as Text
          </button>
        </div>
      )}
    </div>
  );
}