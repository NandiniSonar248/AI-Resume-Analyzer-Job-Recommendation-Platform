import React from "react";
import ApplicationCard from "./ApplicationCard";

const COLUMNS = [
  { id: "wishlist", title: "Wishlist", icon: "⭐", color: "#6366f1" },
  { id: "applied", title: "Applied", icon: "📬", color: "#3b82f6" },
  { id: "interviewing", title: "Interviewing", icon: "🎙️", color: "#f59e0b" },
  { id: "offer", title: "Offer Received", icon: "🎉", color: "#10b981" },
  { id: "rejected", title: "Archived", icon: "📁", color: "#64748b" }
];

export default function KanbanBoard({
  applications = [],
  onStatusChange,
  onEdit,
  onDelete
}) {
  const handleDragStart = (e, appId) => {
    e.dataTransfer.setData("application/id", appId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData("application/id");
    if (appId) {
      onStatusChange(appId, targetStatus);
    }
  };

  return (
    <div className="kanban-board-grid">
      {COLUMNS.map((col) => {
        const columnApps = applications.filter((app) => app.status === col.id);

        return (
          <div
            key={col.id}
            className="kanban-column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="kanban-column-header">
              <div className="column-title-wrap">
                <span className="column-icon">{col.icon}</span>
                <h3 className="column-title">{col.title}</h3>
              </div>
              <span
                className="column-counter"
                style={{ backgroundColor: `${col.color}20`, color: col.color }}
              >
                {columnApps.length}
              </span>
            </div>

            <div className="kanban-cards-list">
              {columnApps.length === 0 ? (
                <div className="kanban-empty-dropzone">
                  <span>Drop applications here</span>
                </div>
              ) : (
                columnApps.map((app) => (
                  <div
                    key={app._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, app._id)}
                    className="draggable-card-wrap"
                  >
                    <ApplicationCard
                      app={app}
                      onStatusChange={onStatusChange}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
