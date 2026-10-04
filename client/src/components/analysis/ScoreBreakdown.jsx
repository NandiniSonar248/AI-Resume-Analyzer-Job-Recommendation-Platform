import React from "react";

/**
 * ScoreBreakdown — Multi-Factor ATS Sub-Scores Component
 * Displays the 4 deterministic sub-scores with their respective weights and explanations.
 */
export default function ScoreBreakdown({ subScores, overallScore, category, categoryColor, categoryEmoji }) {
  if (!subScores) return null;

  const items = [
    {
      key: "skillsCoverage",
      title: "Required Skills Coverage",
      weight: subScores.skillsCoverage?.weight || "35%",
      score: subScores.skillsCoverage?.score ?? 0,
      description: `${subScores.skillsCoverage?.matchedCount || 0} of ${subScores.skillsCoverage?.totalCount || 0} core JD skills matched`,
      icon: "🎯",
      color: "#10b981"
    },
    {
      key: "keywordMatch",
      title: "Keyword Frequency Match",
      weight: subScores.keywordMatch?.weight || "25%",
      score: subScores.keywordMatch?.score ?? 0,
      description: `Relative keyword frequency & technical density`,
      icon: "🔑",
      color: "#3b82f6"
    },
    {
      key: "experienceMatch",
      title: "Experience Alignment",
      weight: subScores.experienceMatch?.weight || "20%",
      score: subScores.experienceMatch?.score ?? 0,
      description: subScores.experienceMatch?.feedback || `Seniority and timeline alignment`,
      icon: "💼",
      color: "#8b5cf6"
    },
    {
      key: "formattingCompatibility",
      title: "Formatting & Structure",
      weight: subScores.formattingCompatibility?.weight || "20%",
      score: subScores.formattingCompatibility?.score ?? 0,
      description: "ATS parseability without complex table/column breaks",
      icon: "📑",
      color: "#f59e0b"
    }
  ];

  return (
    <div className="subscores-container">
      <div className="subscores-header">
        <h4 className="subscores-title">Weighted Sub-Score Breakdown</h4>
        <span className="subscores-subtitle">Deterministic rule-based scoring (No opaque estimates)</span>
      </div>

      <div className="subscores-grid">
        {items.map((item) => (
          <div key={item.key} className="subscore-card">
            <div className="subscore-card-top">
              <div className="subscore-icon-title">
                <span className="subscore-icon">{item.icon}</span>
                <div>
                  <span className="subscore-name">{item.title}</span>
                  <span className="subscore-weight">Weight: {item.weight}</span>
                </div>
              </div>
              <span
                className="subscore-val"
                style={{ color: item.score >= 70 ? "#10b981" : item.score >= 50 ? "#f59e0b" : "#ef4444" }}
              >
                {item.score}%
              </span>
            </div>

            <div className="subscore-bar-bg">
              <div
                className="subscore-bar-fill"
                style={{
                  width: `${item.score}%`,
                  backgroundColor: item.score >= 70 ? "#10b981" : item.score >= 50 ? "#f59e0b" : "#ef4444"
                }}
              />
            </div>

            <p className="subscore-desc">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
