import React, { useState } from "react";

const STATUS_OPTIONS = [
  { id: "wishlist", label: "Wishlist", icon: "⭐" },
  { id: "applied", label: "Applied", icon: "📬" },
  { id: "interviewing", label: "Interviewing", icon: "🎙️" },
  { id: "offer", label: "Offer Received", icon: "🎉" },
  { id: "rejected", label: "Archived / Rejected", icon: "📁" }
];

export default function ApplicationCard({
  app,
  onStatusChange,
  onEdit,
  onDelete
}) {
  const [showNotes, setShowNotes] = useState(false);

  const isReminderDue = app.reminderDate && new Date(app.reminderDate) <= new Date();

  return (
    <div className={`app-card ${isReminderDue ? "reminder-due" : ""}`}>
      <div className="app-card-header">
        <div className="app-card-title-group">
          <h4 className="app-card-title">{app.jobTitle}</h4>
          <span className="app-card-company">{app.company}</span>
        </div>

        <div className="app-card-menu">
          <button
            className="app-card-icon-btn"
            onClick={() => onEdit(app)}
            title="Edit Application"
          >
            ✏️
          </button>
          <button
            className="app-card-icon-btn danger"
            onClick={() => onDelete(app._id)}
            title="Delete Application"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="app-card-meta">
        {app.location && (
          <span className="app-meta-tag">📍 {app.location}</span>
        )}
        {app.salary && (
          <span className="app-meta-tag">💰 {app.salary}</span>
        )}
        <span className="app-meta-tag source-tag">
          🏷️ {app.source || "Direct"}
        </span>
      </div>

      {/* Dates row */}
      <div className="app-card-dates">
        {app.appliedDate && (
          <span className="date-badge">
            Applied: {new Date(app.appliedDate).toLocaleDateString()}
          </span>
        )}
        {app.interviewDate && (
          <span className="date-badge interview-date-badge">
            🗓️ Interview: {new Date(app.interviewDate).toLocaleDateString()}
          </span>
        )}
        {app.reminderDate && (
          <span className={`date-badge reminder-badge ${isReminderDue ? "due" : ""}`}>
            ⏰ Reminder: {new Date(app.reminderDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Notes preview/toggle */}
      {app.notes && (
        <div className="app-card-notes">
          <button
            className="notes-toggle-btn"
            onClick={() => setShowNotes(!showNotes)}
          >
            {showNotes ? "Hide Notes ▲" : "View Notes ▼"}
          </button>
          {showNotes && <p className="notes-text">{app.notes}</p>}
        </div>
      )}

      {/* Footer: Quick status transition & Link */}
      <div className="app-card-footer">
        <div className="status-selector-wrap">
          <label className="quick-move-label">Move to:</label>
          <select
            value={app.status}
            onChange={(e) => onStatusChange(app._id, e.target.value)}
            className="status-dropdown"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.icon} {opt.label}
              </option>
            ))}
          </select>
        </div>

        {app.sourceUrl && (
          <a
            href={app.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="job-link-icon"
            title="Open original job posting"
          >
            🔗 Open Link
          </a>
        )}
      </div>
    </div>
  );
}
