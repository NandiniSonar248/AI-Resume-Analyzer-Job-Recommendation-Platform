import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const PRIORITY_COLORS = {
  high: { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444", label: "High Priority" },
  medium: { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b", label: "Medium Priority" },
  low: { bg: "#f0fdf4", text: "#166534", dot: "#10b981", label: "Lower Priority" }
};

/**
 * SkillGapRoadmap — Phase 3 Component
 * =======================================
 * Calls POST /api/resume/skill-gap, passing the missingSkills array the parent
 * already has from the Phase 2 ATS analysis response (no re-upload needed).
 *
 * For each missing skill, renders a card with:
 *   - What the skill is & why employers want it
 *   - One specific free learning resource
 *   - A concrete 1-4 week project idea
 *   - A ready-to-use resume bullet template
 *   - Estimated learning time & priority
 */
export default function SkillGapRoadmap({ missingSkills = [], jobDescription = "" }) {
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [expanded, setExpanded] = useState({});

  const handleGenerate = async () => {
    if (!missingSkills || missingSkills.length === 0) {
      toast("No missing skills detected — your resume already covers the key requirements! 🎉");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE}/resume/skill-gap`,
        { missingSkills, jobDescription },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setRoadmap(res.data);
      toast.success("Skill-gap roadmap generated!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to generate roadmap");
    } finally {
      setLoading(false);
    }
  };

  const toggleCard = (skill) => {
    setExpanded(prev => ({ ...prev, [skill]: !prev[skill] }));
  };

  if (missingSkills.length === 0) {
    return (
      <div className="phase3-panel">
        <div className="skill-gap-empty">
          <div className="phase3-cta-icon">🎯</div>
          <h4>No Skill Gaps Detected!</h4>
          <p>Your resume already covers the key technical requirements in this job description.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="phase3-panel">
      {!roadmap ? (
        <div className="phase3-cta-box">
          <div className="phase3-cta-icon">📚</div>
          <h4>Skill-Gap Learning Roadmap</h4>
          <p>
            For each of the <strong>{missingSkills.length} skills</strong> missing from your resume, get a structured learning path: what it is, a free resource, a project idea to demonstrate it, and a ready-to-use resume phrase once you've learned it.
          </p>

          {/* Preview of missing skills */}
          <div className="missing-skills-preview">
            {missingSkills.slice(0, 8).map((skill, i) => (
              <span key={i} className="missing-skill-chip">{skill}</span>
            ))}
            {missingSkills.length > 8 && (
              <span className="missing-skill-chip chip-more">+{missingSkills.length - 8} more</span>
            )}
          </div>

          <button
            className="phase3-action-btn"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <><span className="btn-spinner" /> Building roadmap...</>
            ) : (
              "📚 Generate Learning Roadmap"
            )}
          </button>
        </div>
      ) : (
        <div className="skill-gap-result">
          <div className="skill-gap-result-header">
            <h4>📚 Your Personalised Learning Roadmap</h4>
            <div className="skill-gap-meta">
              <span>{roadmap.roadmap.length} skills covered</span>
              {roadmap.aiGenerated && <span className="ai-badge-sm">🤖 AI Generated</span>}
              <button className="btn-secondary-sm" onClick={() => setRoadmap(null)}>
                🔄 Regenerate
              </button>
            </div>
          </div>

          <div className="roadmap-cards">
            {roadmap.roadmap.map((item, index) => {
              const priority = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.medium;
              const isOpen = expanded[item.skill];

              return (
                <div key={index} className="roadmap-card">
                  {/* Card Header — always visible */}
                  <button
                    className="roadmap-card-header"
                    onClick={() => toggleCard(item.skill)}
                    aria-expanded={isOpen}
                  >
                    <div className="roadmap-card-title-row">
                      <div className="roadmap-skill-info">
                        <span className="roadmap-skill-name">{item.skill}</span>
                        <span
                          className="roadmap-priority-badge"
                          style={{ background: priority.bg, color: priority.text }}
                        >
                          <span style={{ background: priority.dot }} className="priority-dot" />
                          {priority.label}
                        </span>
                      </div>
                      <div className="roadmap-card-right">
                        <span className="roadmap-time-est">⏱ {item.estimatedTime}</span>
                        <span className="roadmap-chevron">{isOpen ? "▲" : "▼"}</span>
                      </div>
                    </div>
                  </button>

                  {/* Card Body — visible when expanded */}
                  {isOpen && (
                    <div className="roadmap-card-body">
                      <div className="roadmap-section">
                        <span className="roadmap-section-label">💡 What it is</span>
                        <p>{item.whatItIs}</p>
                      </div>

                      <div className="roadmap-section">
                        <span className="roadmap-section-label">🆓 Free Resource</span>
                        <p className="roadmap-resource">{item.freeResource}</p>
                      </div>

                      <div className="roadmap-section">
                        <span className="roadmap-section-label">🛠️ Project Idea</span>
                        <p>{item.projectIdea}</p>
                      </div>

                      <div className="roadmap-section roadmap-resume-phrase">
                        <span className="roadmap-section-label">📝 Resume Phrase Template</span>
                        <blockquote className="resume-phrase-quote">
                          "{item.resumePhrase}"
                        </blockquote>
                        <span className="roadmap-phrase-note">Replace [X] with your actual metric once you've completed a project.</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {roadmap.totalGaps > roadmap.shownGaps && (
            <p className="roadmap-truncation-notice">
              Showing {roadmap.shownGaps} of {roadmap.totalGaps} missing skills. Focus on these highest-priority ones first.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
