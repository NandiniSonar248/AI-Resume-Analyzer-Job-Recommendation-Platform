import React from "react";

/**
 * SpeechAnalyticsReport — Phase 4 Component
 * ============================================
 * Displays the end-of-session evaluation combining:
 * 1. Multi-round technical & behavioral scoring
 * 2. Verbal delivery & speech telemetry (WPM, fillers, delivery health)
 * 3. Executive hiring verdict & actionable growth areas
 */
export default function SpeechAnalyticsReport({ report, onRestart }) {
  if (!report) return null;

  const {
    overallScore = 80,
    verdict = "Hire",
    verdictColor = "#3b82f6",
    roundScores = {},
    executiveSummary = "",
    keyStrengths = [],
    growthAreas = [],
    speechSummary = {}
  } = report;

  const handleDownload = () => {
    const textReport = `================================================
MOCK INTERVIEW PERFORMANCE REPORT
================================================
Overall Readiness Score: ${overallScore}%
Hiring Verdict: ${verdict}
Date: ${new Date().toLocaleDateString()}

EXECUTIVE SUMMARY:
${executiveSummary}

ROUND BREAKDOWN:
${Object.entries(roundScores)
  .map(([round, score]) => `- ${round}: ${score}%`)
  .join("\n")}

SPEECH & VERBAL DELIVERY:
- Speaking Pace: ${speechSummary.overallWPM || 135} Words Per Minute
- Total Fillers Detected: ${speechSummary.totalFillers || 0}
- Verbal Delivery Score: ${speechSummary.averageDeliveryScore || 85}/100
- Total Words: ${speechSummary.totalWords || 0} (${speechSummary.totalDurationMinutes || 0} min)

KEY STRENGTHS:
${keyStrengths.map((s, i) => `${i + 1}. ${s}`).join("\n")}

ACTIONABLE GROWTH AREAS:
${growthAreas.map((g, i) => `${i + 1}. ${g}`).join("\n")}
================================================`;

    const blob = new Blob([textReport], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Mock-Interview-Report.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="interview-report-container fade-in">
      <div className="report-hero-card">
        <div className="report-score-box" style={{ borderColor: verdictColor }}>
          <span className="report-score-num" style={{ color: verdictColor }}>
            {overallScore}%
          </span>
          <span className="report-score-sub">Readiness Score</span>
        </div>

        <div className="report-hero-info">
          <div
            className="report-verdict-pill"
            style={{ backgroundColor: `${verdictColor}15`, color: verdictColor, borderColor: verdictColor }}
          >
            🏆 Hiring Verdict: <strong>{verdict}</strong>
          </div>
          <p className="report-exec-summary">{executiveSummary}</p>

          <div className="report-action-buttons">
            <button className="btn-download-sm" onClick={handleDownload}>
              ⬇️ Download Report (.txt)
            </button>
            {onRestart && (
              <button className="btn-secondary-sm" onClick={onRestart}>
                🔄 Start New Session
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Speech Telemetry Section */}
      <div className="report-section-block">
        <h4 className="report-section-title">🎙️ Verbal Delivery & Speech Analytics</h4>
        <div className="speech-metrics-grid">
          <div className="speech-metric-card">
            <span className="metric-icon">⚡</span>
            <div className="metric-data">
              <span className="metric-val">{speechSummary.overallWPM || 135} WPM</span>
              <span className="metric-name">Speaking Pace</span>
              <span className="metric-sub">Ideal: 125–160 WPM</span>
            </div>
          </div>

          <div className="speech-metric-card">
            <span className="metric-icon">🚫</span>
            <div className="metric-data">
              <span className="metric-val">{speechSummary.totalFillers || 0}</span>
              <span className="metric-name">Filler Words</span>
              <span className="metric-sub">("um", "like", "you know")</span>
            </div>
          </div>

          <div className="speech-metric-card">
            <span className="metric-icon">🎯</span>
            <div className="metric-data">
              <span className="metric-val">{speechSummary.averageDeliveryScore || 85}%</span>
              <span className="metric-name">Acoustic Clarity</span>
              <span className="metric-sub">Pacing & articulation</span>
            </div>
          </div>

          <div className="speech-metric-card">
            <span className="metric-icon">⏱️</span>
            <div className="metric-data">
              <span className="metric-val">{speechSummary.totalDurationMinutes || 0} min</span>
              <span className="metric-name">Speaking Time</span>
              <span className="metric-sub">{speechSummary.totalWords || 0} words spoken</span>
            </div>
          </div>
        </div>
      </div>

      {/* Round Breakdown */}
      {Object.keys(roundScores).length > 0 && (
        <div className="report-section-block">
          <h4 className="report-section-title">📊 Multi-Round Performance Breakdown</h4>
          <div className="round-scores-list">
            {Object.entries(roundScores).map(([round, score]) => (
              <div key={round} className="round-score-row">
                <div className="round-score-info">
                  <span className="round-score-name">{round}</span>
                  <span className="round-score-pct">{score}%</span>
                </div>
                <div className="round-progress-track">
                  <div
                    className="round-progress-fill"
                    style={{
                      width: `${score}%`,
                      backgroundColor: score >= 80 ? "#10b981" : score >= 65 ? "#3b82f6" : "#f59e0b"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths & Growth Areas Side-by-Side */}
      <div className="feedback-columns-grid">
        <div className="feedback-col strengths-col">
          <h4 className="feedback-col-title">🌟 Key Strengths</h4>
          <ul className="feedback-list">
            {keyStrengths.map((str, idx) => (
              <li key={idx} className="feedback-item strength-item">
                <span className="feedback-bullet">✓</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="feedback-col growth-col">
          <h4 className="feedback-col-title">🚀 Actionable Growth Areas</h4>
          <ul className="feedback-list">
            {growthAreas.map((gro, idx) => (
              <li key={idx} className="feedback-item growth-item">
                <span className="feedback-bullet">➔</span>
                <span>{gro}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
