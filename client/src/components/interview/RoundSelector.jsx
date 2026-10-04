import React from "react";

const ROUND_ICONS = {
  "HR/Behavioral": "🤝",
  "Technical": "💻",
  "Coding": "⚡"
};

/**
 * RoundSelector — Phase 4 Component
 * =====================================
 * Displays the multi-round interview progression:
 * - Round 1: HR & Behavioral
 * - Round 2: Technical (JD-anchored)
 * - Round 3: Coding & Problem Solving (if developer role)
 */
export default function RoundSelector({
  availableRounds = ["HR/Behavioral", "Technical"],
  currentRound = "HR/Behavioral",
  completedRounds = [],
  onSelectRound,
  disabled = false
}) {
  return (
    <div className="round-selector-container">
      <div className="round-selector-header">
        <span className="round-selector-title">Interview Progression</span>
        <span className="round-count-badge">
          Round {availableRounds.indexOf(currentRound) + 1} of {availableRounds.length}
        </span>
      </div>

      <div className="round-tabs-grid">
        {availableRounds.map((round, idx) => {
          const isActive = round === currentRound;
          const isDone = completedRounds.includes(round);
          const icon = ROUND_ICONS[round] || "🎯";

          return (
            <button
              key={round}
              className={`round-tab-card ${isActive ? "active" : ""} ${isDone ? "completed" : ""}`}
              onClick={() => onSelectRound && onSelectRound(round)}
              disabled={disabled || isActive}
            >
              <div className="round-tab-left">
                <span className="round-tab-icon">{icon}</span>
                <div className="round-tab-text">
                  <span className="round-tab-num">Round {idx + 1}</span>
                  <span className="round-tab-name">{round}</span>
                </div>
              </div>

              <div className="round-tab-status">
                {isDone ? (
                  <span className="status-pill completed">✓ Done</span>
                ) : isActive ? (
                  <span className="status-pill active">In Progress</span>
                ) : (
                  <span className="status-pill pending">Upcoming</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
