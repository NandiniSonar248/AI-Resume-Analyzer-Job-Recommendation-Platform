import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import ScoreBreakdown from "./analysis/ScoreBreakdown";
import ParseabilityCheck from "./analysis/ParseabilityCheck";
import SentenceHighlighter from "./analysis/SentenceHighlighter";
import TailoredResumePanel from "./analysis/TailoredResumePanel";
import CoverLetterPanel from "./analysis/CoverLetterPanel";
import SkillGapRoadmap from "./analysis/SkillGapRoadmap";

export default function ResultPanel({ data }) {
  const [activeTab, setActiveTab] = useState("breakdown");
  const [improvedResume, setImprovedResume] = useState(null);
  const [changeSummary, setChangeSummary] = useState(null);
  const [loadingResume, setLoadingResume] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  if (!data) {
    return (
      <div className="card">
        <div className="result-placeholder">
          <div className="result-placeholder-icon">📊</div>
          <h3>Your ATS Results Will Appear Here</h3>
          <p>Upload your resume and paste a job description to get a complete multi-factor ATS evaluation.</p>
        </div>
      </div>
    );
  }

  const {
    atsScore = 0,
    category = "Unknown",
    categoryEmoji = "📊",
    categoryColor = "#3b82f6",
    subScores,
    parseability,
    sentenceHighlights = [],
    sentenceSummary,
    aiAssessment,
    matchedKeywords = [],
    missingKeywords = [],
    matchPercentage = 0,
    analyzedAt = "",
    isRealTime = false,
    aiPowered = false,
    resumeText = "",
    jobDescription = ""
  } = data;

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
        { resumeText, jobDescription },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (response.data.success) {
        setImprovedResume(response.data.improvedResume);
        setChangeSummary(response.data.changeSummary);
        setShowComparison(true);
        setActiveTab("rewrite");
        toast.success("✨ Improved resume generated!");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || "Failed to generate improved resume";
      toast.error(errorMsg);
    } finally {
      setLoadingResume(false);
    }
  };

  return (
    <div className="card result-panel-v2 fade-in">
      {/* Top Meta Badges */}
      <div className="badges-container">
        {isRealTime && (
          <div className="realtime-badge">
            <span className="pulse-dot"></span>
            Live Analysis • {analysisTime}
          </div>
        )}
        {aiPowered && (
          <div className="ai-badge">
            🤖 AI Qualitative Layer (Groq Llama 3)
          </div>
        )}
        <div className="rule-badge">
          ⚡ 4-Factor Deterministic Scoring
        </div>
      </div>

      {/* Main Score Hero Card */}
      <div className="ats-score-hero">
        <div className="score-circle-v2" style={{ borderColor: categoryColor }}>
          <div className="score-number-v2" style={{ color: categoryColor }}>{atsScore}%</div>
          <div className="score-label-v2">ATS Match Score</div>
        </div>

        <div className="score-hero-details">
          <div className="score-category-badge" style={{ backgroundColor: `${categoryColor}15`, color: categoryColor, borderColor: categoryColor }}>
            <span>{categoryEmoji}</span>
            <span className="category-title">{category}</span>
          </div>

          <p className="score-hero-summary">
            {aiAssessment?.executiveSummary ||
              `Your resume matches ${atsScore}% of target role requirements across skills, frequency, experience, and format.`}
          </p>

          <div className="quick-stats-row">
            <span className="quick-stat-chip">🎯 <strong>{subScores?.skillsCoverage?.score ?? matchPercentage}%</strong> Skills Coverage</span>
            <span className="quick-stat-chip">🔑 <strong>{matchedKeywords.length}</strong> Matched Skills</span>
            <span className="quick-stat-chip">📑 <strong>{parseability?.score ?? 100}%</strong> Formatting Health</span>
          </div>
        </div>
      </div>

      {/* Feature Navigation Tabs */}
      <div className="analysis-tabs-nav">
        <button
          className={`analysis-tab-btn ${activeTab === "breakdown" ? "active" : ""}`}
          onClick={() => setActiveTab("breakdown")}
        >
          📊 Score Breakdown
        </button>
        <button
          className={`analysis-tab-btn ${activeTab === "explainability" ? "active" : ""}`}
          onClick={() => setActiveTab("explainability")}
        >
          🔍 Sentence Explainability {sentenceHighlights.length > 0 && `(${sentenceHighlights.length})`}
        </button>
        <button
          className={`analysis-tab-btn ${activeTab === "parseability" ? "active" : ""}`}
          onClick={() => setActiveTab("parseability")}
        >
          📑 ATS Parseability
        </button>
        <button
          className={`analysis-tab-btn ${activeTab === "keywords" ? "active" : ""}`}
          onClick={() => setActiveTab("keywords")}
        >
          🔑 Keywords ({matchedKeywords.length + missingKeywords.length})
        </button>
        <button
          className={`analysis-tab-btn ${activeTab === "tailor" ? "active" : ""}`}
          onClick={() => setActiveTab("tailor")}
        >
          ✂️ Tailor Resume
        </button>
        <button
          className={`analysis-tab-btn ${activeTab === "coverletter" ? "active" : ""}`}
          onClick={() => setActiveTab("coverletter")}
        >
          ✉️ Cover Letter
        </button>
        <button
          className={`analysis-tab-btn ${activeTab === "skillgap" ? "active" : ""}`}
          onClick={() => setActiveTab("skillgap")}
        >
          📚 Skill-Gap Roadmap {missingKeywords.length > 0 && `(${missingKeywords.length})`}
        </button>
      </div>

      {/* TAB 1: Weighted Sub-Score Breakdown & AI Qualitative Layer */}
      {activeTab === "breakdown" && (
        <div className="analysis-tab-pane fade-in">
          <ScoreBreakdown
            subScores={subScores}
            overallScore={atsScore}
            category={category}
            categoryColor={categoryColor}
            categoryEmoji={categoryEmoji}
          />

          {/* Qualitative AI Recruiter Review Layer */}
          {aiAssessment && (
            <div className="ai-qualitative-review">
              <div className="ai-review-header">
                <span className="ai-review-icon">💡</span>
                <div>
                  <h4>AI Qualitative Recruiter Assessment</h4>
                  <span className="ai-review-sub">Evaluates nuance, impact, and 6-second recruiter scanning perspective</span>
                </div>
              </div>

              {aiAssessment.recruiterPerspective && (
                <div className="recruiter-perspective-box">
                  <strong>👀 6-Second Recruiter Perspective:</strong> {aiAssessment.recruiterPerspective}
                </div>
              )}

              <div className="ai-feedback-grid">
                {aiAssessment.keyStrengths?.length > 0 && (
                  <div className="ai-feedback-col ai-feedback-strengths">
                    <h5>✅ Key Strengths</h5>
                    <ul>
                      {aiAssessment.keyStrengths.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiAssessment.criticalGaps?.length > 0 && (
                  <div className="ai-feedback-col ai-feedback-gaps">
                    <h5>⚠️ Critical Skill Gaps</h5>
                    <ul>
                      {aiAssessment.criticalGaps.map((gap, i) => (
                        <li key={i}>{gap}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {aiAssessment.actionableTips?.length > 0 && (
                <div className="ai-actionable-tips">
                  <h5>🚀 Actionable Next Steps</h5>
                  <ol>
                    {aiAssessment.actionableTips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Sentence-Level Explainability */}
      {activeTab === "explainability" && (
        <div className="analysis-tab-pane fade-in">
          <SentenceHighlighter
            sentenceHighlights={sentenceHighlights}
            summary={sentenceSummary}
          />
        </div>
      )}

      {/* TAB 3: ATS Parseability & Layout Check */}
      {activeTab === "parseability" && (
        <div className="analysis-tab-pane fade-in">
          <ParseabilityCheck parseability={parseability} />
        </div>
      )}

      {/* TAB 4: Keywords */}
      {activeTab === "keywords" && (
        <div className="analysis-tab-pane fade-in">
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

          {missingKeywords.length > 0 && (
            <div className="keywords-section" style={{ marginTop: "1.5rem" }}>
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
        </div>
      )}

      {/* TAB 5: Tailor Resume (Phase 3) */}
      {activeTab === "tailor" && (
        <div className="analysis-tab-pane fade-in">
          <TailoredResumePanel
            resumeText={resumeText}
            jobDescription={jobDescription}
          />
        </div>
      )}

      {/* TAB 6: Cover Letter (Phase 3) */}
      {activeTab === "coverletter" && (
        <div className="analysis-tab-pane fade-in">
          <CoverLetterPanel
            resumeText={resumeText}
            jobDescription={jobDescription}
          />
        </div>
      )}

      {/* TAB 7: Skill-Gap Roadmap (Phase 3) */}
      {activeTab === "skillgap" && (
        <div className="analysis-tab-pane fade-in">
          <SkillGapRoadmap
            missingSkills={missingKeywords}
            jobDescription={jobDescription}
          />
        </div>
      )}
    </div>
  );
}