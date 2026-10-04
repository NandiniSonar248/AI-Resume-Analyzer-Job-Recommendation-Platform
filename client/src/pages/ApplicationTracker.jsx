import React, { useState, useEffect } from "react";
import {
  getApplications,
  createApplication,
  updateApplication,
  updateApplicationStatus,
  deleteApplication
} from "../api";
import KanbanBoard from "../components/tracker/KanbanBoard";
import toast from "react-hot-toast";

const INITIAL_FORM = {
  jobTitle: "",
  company: "",
  location: "Remote",
  salary: "",
  source: "Manual",
  sourceUrl: "",
  status: "applied",
  appliedDate: new Date().toISOString().split("T")[0],
  reminderDate: "",
  interviewDate: "",
  notes: ""
};

export default function ApplicationTracker() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await getApplications();
      if (res.success) {
        setApplications(res.applications || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to load tracked applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleStatusChange = async (appId, newStatus) => {
    // Optimistic UI update
    setApplications((prev) =>
      prev.map((app) => (app._id === appId ? { ...app, status: newStatus } : app))
    );

    try {
      await updateApplicationStatus(appId, newStatus);
      toast.success(`Moved to ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update status");
      fetchApplications(); // Revert on failure
    }
  };

  const handleDelete = async (appId) => {
    if (!window.confirm("Are you sure you want to remove this application?")) return;

    try {
      await deleteApplication(appId);
      setApplications((prev) => prev.filter((a) => a._id !== appId));
      toast.success("Application deleted");
    } catch (err) {
      toast.error("Failed to delete application");
    }
  };

  const handleOpenAddModal = () => {
    setEditingApp(null);
    setFormData(INITIAL_FORM);
    setModalOpen(true);
  };

  const handleOpenEditModal = (app) => {
    setEditingApp(app);
    setFormData({
      jobTitle: app.jobTitle || "",
      company: app.company || "",
      location: app.location || "Remote",
      salary: app.salary || "",
      source: app.source || "Manual",
      sourceUrl: app.sourceUrl || "",
      status: app.status || "applied",
      appliedDate: app.appliedDate ? new Date(app.appliedDate).toISOString().split("T")[0] : "",
      reminderDate: app.reminderDate ? new Date(app.reminderDate).toISOString().split("T")[0] : "",
      interviewDate: app.interviewDate ? new Date(app.interviewDate).toISOString().split("T")[0] : "",
      notes: app.notes || ""
    });
    setModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.jobTitle.trim() || !formData.company.trim()) {
      toast.error("Job title and company name are required");
      return;
    }

    setSubmitting(true);
    try {
      if (editingApp) {
        const res = await updateApplication(editingApp._id, formData);
        setApplications((prev) =>
          prev.map((a) => (a._id === editingApp._id ? res.application : a))
        );
        toast.success("Application updated!");
      } else {
        const res = await createApplication(formData);
        setApplications((prev) => [res.application, ...prev]);
        toast.success("Application tracked!");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save application");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter applications by search query
  const filteredApps = applications.filter((app) => {
    const q = searchQuery.toLowerCase();
    return (
      app.jobTitle.toLowerCase().includes(q) ||
      app.company.toLowerCase().includes(q) ||
      (app.location && app.location.toLowerCase().includes(q))
    );
  });

  // Pipeline stats
  const totalCount = applications.length;
  const interviewingCount = applications.filter((a) => a.status === "interviewing").length;
  const offerCount = applications.filter((a) => a.status === "offer").length;

  return (
    <div className="tracker-page-container fade-in">
      {/* Tracker Top Bar */}
      <div className="tracker-header">
        <div className="tracker-header-left">
          <h2 className="tracker-main-title">📌 Application Tracker</h2>
          <p className="tracker-subtitle">
            Manage your entire job hunt pipeline from first contact to signed offer.
          </p>
        </div>

        <div className="tracker-header-stats">
          <div className="tracker-stat-chip">
            <span className="stat-number">{totalCount}</span>
            <span className="stat-label">Total Tracked</span>
          </div>
          <div className="tracker-stat-chip interviewing">
            <span className="stat-number">{interviewingCount}</span>
            <span className="stat-label">Interviews</span>
          </div>
          <div className="tracker-stat-chip offer">
            <span className="stat-number">{offerCount}</span>
            <span className="stat-label">Offers</span>
          </div>
          <button className="btn-add-application" onClick={handleOpenAddModal}>
            + Add Job
          </button>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="tracker-toolbar">
        <div className="tracker-search-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="tracker-search-input"
            placeholder="Search by role, company, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Kanban Board */}
      {loading ? (
        <div className="tracker-loading-state">
          <div className="btn-spinner"></div>
          <p>Loading your job pipeline...</p>
        </div>
      ) : (
        <KanbanBoard
          applications={filteredApps}
          onStatusChange={handleStatusChange}
          onEdit={handleOpenEditModal}
          onDelete={handleDelete}
        />
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="tracker-modal-overlay">
          <div className="tracker-modal-card fade-in">
            <div className="tracker-modal-header">
              <h3>{editingApp ? "✏️ Edit Application" : "📌 Track New Job Application"}</h3>
              <button
                className="btn-modal-close"
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="tracker-modal-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="tracker-label">Job Title *</label>
                  <input
                    type="text"
                    required
                    className="tracker-input"
                    placeholder="e.g. Senior Frontend Engineer"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="tracker-label">Company Name *</label>
                  <input
                    type="text"
                    required
                    className="tracker-input"
                    placeholder="e.g. Stripe, Razorpay"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="tracker-label">Location</label>
                  <input
                    type="text"
                    className="tracker-input"
                    placeholder="e.g. Bengaluru / Remote"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="tracker-label">Salary / Compensation</label>
                  <input
                    type="text"
                    className="tracker-input"
                    placeholder="e.g. ₹25L - ₹32L"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="tracker-label">Status Stage</label>
                  <select
                    className="tracker-input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="wishlist">⭐ Wishlist</option>
                    <option value="applied">📬 Applied</option>
                    <option value="interviewing">🎙️ Interviewing</option>
                    <option value="offer">🎉 Offer Received</option>
                    <option value="rejected">📁 Archived / Rejected</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="tracker-label">Date Applied</label>
                  <input
                    type="date"
                    className="tracker-input"
                    value={formData.appliedDate}
                    onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="tracker-label">Interview Date</label>
                  <input
                    type="date"
                    className="tracker-input"
                    value={formData.interviewDate}
                    onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="tracker-label">Follow-up Reminder Date</label>
                  <input
                    type="date"
                    className="tracker-input"
                    value={formData.reminderDate}
                    onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="tracker-label">Job Posting URL</label>
                <input
                  type="url"
                  className="tracker-input"
                  placeholder="https://..."
                  value={formData.sourceUrl}
                  onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="tracker-label">Notes & Recruiter Contact</label>
                <textarea
                  rows="3"
                  className="tracker-input"
                  placeholder="Key contacts, referral info, interview rounds, salary expectations..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="tracker-modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? "Saving..." : editingApp ? "Update Application" : "Track Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
