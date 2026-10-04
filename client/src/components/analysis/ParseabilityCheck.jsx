import React from "react";

/**
 * ParseabilityCheck — ATS Structural & Formatting Inspector Component
 * Flags tables, multi-column layouts, embedded images, and non-standard fonts that break ATS parsers.
 */
export default function ParseabilityCheck({ parseability }) {
  if (!parseability) return null;

  const { score = 100, isCompatible = true, rating = "Clean Layout", issues = [], summary } = parseability;

  return (
    <div className="parseability-container">
      <div className="parseability-header">
        <div className="parseability-title-area">
          <h3>📑 ATS Parseability & Layout Check</h3>
          <p>
            Real ATS systems (Workday, Taleo, Greenhouse) drop or scramble text trapped in complex tables or multi-column grids.
          </p>
        </div>
        <div className="parseability-score-badge" style={{ borderColor: isCompatible ? "#10b981" : "#f59e0b" }}>
          <span className="parseability-score-num" style={{ color: isCompatible ? "#10b981" : "#f59e0b" }}>
            {score}%
          </span>
          <span className="parseability-score-label">{rating}</span>
        </div>
      </div>

      {summary && (
        <div className="parseability-summary-chips">
          <span className="chip chip-pass">✅ {summary.passed || 0} Passed</span>
          {summary.warnings > 0 && <span className="chip chip-warning">⚠️ {summary.warnings} Warnings</span>}
          {summary.failures > 0 && <span className="chip chip-fail">❌ {summary.failures} Critical Issues</span>}
        </div>
      )}

      <div className="parseability-issues-list">
        {issues.map((issue) => (
          <div
            key={issue.id}
            className={`parseability-issue-card ${
              issue.status === "pass" ? "status-pass" : issue.status === "warning" ? "status-warning" : "status-fail"
            }`}
          >
            <div className="issue-card-top">
              <div className="issue-icon-title">
                <span className="issue-status-icon">
                  {issue.status === "pass" ? "✅" : issue.status === "warning" ? "⚠️" : "❌"}
                </span>
                <span className="issue-title">{issue.title}</span>
              </div>
              <span className={`issue-badge issue-badge--${issue.status}`}>
                {issue.status.toUpperCase()}
              </span>
            </div>

            <p className="issue-message">{issue.message}</p>

            {issue.recommendation && (
              <div className="issue-rec">
                <strong>💡 Recommendation:</strong> {issue.recommendation}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
