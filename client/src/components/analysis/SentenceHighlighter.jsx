import React, { useState } from "react";

/**
 * SentenceHighlighter — Sentence-Level ATS Explainability Component
 * Highlights resume sentences that helped the score in green and ones that hurt/weakened it in red,
 * with an interactive hover tooltip and filter controls.
 */
export default function SentenceHighlighter({ sentenceHighlights = [], summary }) {
  const [filter, setFilter] = useState("all"); // 'all' | 'positive' | 'negative'
  const [activeSentenceId, setActiveSentenceId] = useState(null);

  if (!sentenceHighlights || sentenceHighlights.length === 0) {
    return (
      <div className="sentence-empty">
        <p>No sentence-level analysis available for this document.</p>
      </div>
    );
  }

  const filteredSentences = sentenceHighlights.filter((s) => {
    if (filter === "positive") return s.status === "positive";
    if (filter === "negative") return s.status === "negative";
    return true;
  });

  return (
    <div className="sentence-highlighter-container">
      <div className="sentence-highlighter-header">
        <div>
          <h3>🔍 Sentence-Level Explainability</h3>
          <p className="sentence-highlighter-subtitle">
            Hover or click on any highlighted resume sentence below to see exactly why it helped or hurt your ATS score.
          </p>
        </div>

        {summary && (
          <div className="sentence-stats-pills">
            <span className="stat-pill stat-pill--green">
              ✅ {summary.positiveSentences || 0} Positive Impact
            </span>
            <span className="stat-pill stat-pill--red">
              ⚠️ {summary.improvementAreas || 0} Need Improvement
            </span>
            <span className="stat-pill stat-pill--gray">
              📄 {summary.neutralSentences || 0} Neutral
            </span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="sentence-filter-tabs">
        <button
          className={`sentence-filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All Sentences ({sentenceHighlights.length})
        </button>
        <button
          className={`sentence-filter-btn filter-btn--green ${filter === "positive" ? "active" : ""}`}
          onClick={() => setFilter("positive")}
        >
          ✅ Score Boosters ({sentenceHighlights.filter((s) => s.status === "positive").length})
        </button>
        <button
          className={`sentence-filter-btn filter-btn--red ${filter === "negative" ? "active" : ""}`}
          onClick={() => setFilter("negative")}
        >
          ⚠️ Improvement Areas ({sentenceHighlights.filter((s) => s.status === "negative").length})
        </button>
      </div>

      {/* Sentences Interactive Feed */}
      <div className="sentences-feed">
        {filteredSentences.map((sentence) => {
          const isActive = activeSentenceId === sentence.id;
          const statusClass =
            sentence.status === "positive"
              ? "sentence-card--positive"
              : sentence.status === "negative"
              ? "sentence-card--negative"
              : "sentence-card--neutral";

          return (
            <div
              key={sentence.id}
              className={`sentence-card ${statusClass} ${isActive ? "sentence-card--active" : ""}`}
              onMouseEnter={() => setActiveSentenceId(sentence.id)}
              onMouseLeave={() => setActiveSentenceId(null)}
              onClick={() => setActiveSentenceId(isActive ? null : sentence.id)}
            >
              <div className="sentence-card-body">
                <div className="sentence-status-indicator">
                  {sentence.status === "positive" && <span className="indicator-icon">🟢</span>}
                  {sentence.status === "negative" && <span className="indicator-icon">🔴</span>}
                  {sentence.status === "neutral" && <span className="indicator-icon">⚪</span>}
                </div>

                <div className="sentence-content">
                  <p className="sentence-text">"{sentence.text}"</p>

                  {/* Explainability Tooltip Card */}
                  <div className={`sentence-tooltip ${isActive ? "sentence-tooltip--visible" : ""}`}>
                    <div className="tooltip-header">
                      <span className={`tooltip-impact-badge impact--${sentence.status}`}>
                        {sentence.scoreImpact}
                      </span>
                      {sentence.matchedSkills?.length > 0 && (
                        <div className="tooltip-skills">
                          {sentence.matchedSkills.map((skill, i) => (
                            <span key={i} className="skill-chip">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="tooltip-reason">{sentence.reason}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
