import { useState, useEffect } from "react";
import { searchJobs, matchJobsWithSkills, getTrendingJobs, createApplication } from "../api";
import toast from "react-hot-toast";

const ALL_INDIAN_STATES = [
  { name: "All India", value: "India" },
  { name: "Remote", value: "Remote" },
  { name: "Andhra Pradesh", value: "Andhra Pradesh" },
  { name: "Arunachal Pradesh", value: "Arunachal Pradesh" },
  { name: "Assam", value: "Assam" },
  { name: "Bihar", value: "Bihar" },
  { name: "Chhattisgarh", value: "Chhattisgarh" },
  { name: "Goa", value: "Goa" },
  { name: "Gujarat", value: "Gujarat" },
  { name: "Haryana", value: "Haryana" },
  { name: "Himachal Pradesh", value: "Himachal Pradesh" },
  { name: "Jharkhand", value: "Jharkhand" },
  { name: "Karnataka", value: "Karnataka" },
  { name: "Kerala", value: "Kerala" },
  { name: "Madhya Pradesh", value: "Madhya Pradesh" },
  { name: "Maharashtra", value: "Maharashtra" },
  { name: "Manipur", value: "Manipur" },
  { name: "Meghalaya", value: "Meghalaya" },
  { name: "Mizoram", value: "Mizoram" },
  { name: "Nagaland", value: "Nagaland" },
  { name: "Odisha", value: "Odisha" },
  { name: "Punjab", value: "Punjab" },
  { name: "Rajasthan", value: "Rajasthan" },
  { name: "Sikkim", value: "Sikkim" },
  { name: "Tamil Nadu", value: "Tamil Nadu" },
  { name: "Telangana", value: "Telangana" },
  { name: "Tripura", value: "Tripura" },
  { name: "Uttar Pradesh", value: "Uttar Pradesh" },
  { name: "Uttarakhand", value: "Uttarakhand" },
  { name: "West Bengal", value: "West Bengal" },
];

/**
 * SOURCE_COLORS — Per-source badge styling.
 * Each job card shows which real source it came from so the user
 * can verify provenance. These map to the `source` field on each job object.
 */
const SOURCE_STYLES = {
  RemoteOK: { bg: "#e0f2fe", color: "#0369a1", icon: "🌍" },
  Adzuna:   { bg: "#fef3c7", color: "#92400e", icon: "🔷" },
  JSearch:  { bg: "#f0fdf4", color: "#166534", icon: "🔍" },
};

/**
 * JobCard — Individual job listing card.
 *
 * The Apply button:
 * - Is always an <a href={job.url} target="_blank" rel="noopener noreferrer">
 * - Opens the real source site (LinkedIn, Indeed, Glassdoor, employer site)
 *   in a new tab
 * - Never submits an application in-platform. This is intentional and matches
 *   how all real aggregators (Indeed, Glassdoor, LinkedIn) work.
 *
 * Why? LinkedIn/Indeed/Glassdoor/Naukri don't expose job application submission
 * APIs to third parties. Their application flows require platform authentication
 * and their own ATS integrations. Even enterprise products get read-only access.
 * The redirect-to-source pattern is the industry standard — not a limitation.
 */
function JobCard({ job, isAutoMatched }) {
  const sourceStyle = SOURCE_STYLES[job.source] || { bg: "#f5f5f5", color: "#333", icon: "💼" };
  const [tracked, setTracked] = useState(false);
  const [tracking, setTracking] = useState(false);

  const handleTrack = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to track applications");
      return;
    }

    setTracking(true);
    try {
      await createApplication({
        jobTitle: job.title || "Job Title",
        company: job.company || "Company",
        location: job.location || "Remote",
        salary: job.salary || "",
        source: job.source || "Aggregator",
        sourceUrl: job.url || "",
        status: "applied"
      });
      setTracked(true);
      toast.success(`Tracked "${job.title}" in Application Tracker!`, { icon: "📌" });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to track application");
    } finally {
      setTracking(false);
    }
  };

  return (
    <div className={`job-card ${isAutoMatched ? "job-card--matched" : ""}`}>
      <div className="job-header">
        <div className="job-logo">
          {job.logo ? (
            <img
              src={job.logo}
              alt={job.company}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <span className="job-logo-placeholder">
              {job.company?.charAt(0)?.toUpperCase() || "J"}
            </span>
          )}
        </div>
        <div className="job-main">
          <h3 className="job-title">{job.title}</h3>
          <p className="job-company">{job.company}</p>
        </div>
        {/* Source badge — shows which real platform this listing is from */}
        <div
          className="job-source-badge"
          style={{ background: sourceStyle.bg, color: sourceStyle.color }}
          title={`Listed on ${job.source}`}
        >
          <span>{sourceStyle.icon}</span>
          <span>{job.source}</span>
        </div>
      </div>

      <div className="job-details">
        <span className="job-location">📍 {job.location}</span>
        {job.salary && <span className="job-salary">💰 {job.salary}</span>}
        {job.isRemote && <span className="job-remote">🌐 Remote</span>}
      </div>

      {/* Match score bar — shown for auto-matched jobs */}
      {job.matchScore !== undefined && (
        <div className="job-match">
          <div className="match-bar">
            <div
              className="match-fill"
              style={{ width: `${job.matchScore}%` }}
            />
          </div>
          <span className="match-score">{job.matchScore}% Match</span>
        </div>
      )}

      {/* Skill tags */}
      {job.tags?.length > 0 && (
        <div className="job-tags">
          {job.tags.slice(0, 6).map((tag, i) => (
            <span key={i} className="job-tag">{tag}</span>
          ))}
        </div>
      )}

      {/* Truncated description */}
      {job.description && (
        <p className="job-description">{job.description}</p>
      )}

      <div className="job-actions">
        {/*
          APPLY BUTTON — REDIRECT PATTERN (industry standard)
          Opens the real source URL in a new tab.
        */}
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="apply-btn"
          id={`apply-${job.id}`}
        >
          Apply on {job.source} →
        </a>

        <button
          type="button"
          onClick={handleTrack}
          disabled={tracking || tracked}
          className={`btn-track-job ${tracked ? "is-tracked" : ""}`}
          title={tracked ? "Already tracked in your pipeline" : "Add to Application Tracker Kanban"}
        >
          {tracked ? "✓ Tracked" : tracking ? "Saving..." : "📌 Track Job"}
        </button>
      </div>
    </div>
  );
}

/**
 * EmptyState — Shown when a search returns 0 real results.
 * The message is honest: we say "no live listings found right now"
 * and suggest alternatives. We never fill this space with synthetic data.
 */
function EmptyState({ query, isAutoMatch }) {
  return (
    <div className="no-jobs">
      <span className="no-jobs-icon">🔎</span>
      <h3>No live listings found right now</h3>
      {isAutoMatch ? (
        <p>
          No real-time listings matched your resume skills at this moment.
          Try a manual search below, or check back later — job listings update frequently.
        </p>
      ) : (
        <p>
          {query
            ? `No live listings found for "${query}". Try different keywords, broaden your location, or check back later.`
            : "Search for jobs using the form above to see live listings."}
        </p>
      )}
      <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.5rem" }}>
        Sources searched: RemoteOK · Adzuna · JSearch (Google for Jobs)
      </p>
    </div>
  );
}

/**
 * JobsPage — Main job search and matching interface.
 *
 * Props:
 *   userSkills      — skills from ATS analysis (for manual matched tab)
 *   autoMatchedJobs — jobs auto-matched after resume upload (from Dashboard)
 *   autoMatchLoading — true while auto-matching is in progress
 */
export default function JobsPage({ userSkills = [], autoMatchedJobs = [], autoMatchLoading = false }) {
  const [jobs, setJobs] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("India");
  const [activeTab, setActiveTab] = useState(
    // If auto-matched jobs arrive, start on that tab
    autoMatchedJobs.length > 0 ? "matched" : "trending"
  );
  const [error, setError] = useState(null);

  // When autoMatchedJobs arrives (from Dashboard post-upload), switch tab
  useEffect(() => {
    if (autoMatchedJobs.length > 0) {
      setActiveTab("matched");
    }
  }, [autoMatchedJobs]);

  useEffect(() => {
    loadTrending();
  }, []);

  const loadTrending = async () => {
    try {
      const data = await getTrendingJobs();
      setTrending(data.categories || []);
    } catch (err) {
      console.error("Failed to load trending:", err);
    }
  };

  const loadMatchedJobs = async () => {
    if (userSkills.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const data = await matchJobsWithSkills(userSkills, location);
      setJobs(data.jobs || []);
      setActiveTab("search"); // Use search tab for manual skill match
    } catch (err) {
      setError("Failed to match jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await searchJobs(searchQuery.trim(), location);
      setJobs(data.jobs || []);
      setActiveTab("search");
    } catch (err) {
      setError("Failed to search jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrendingClick = async (category) => {
    const query = category.searchQuery || category.name;
    setSearchQuery(query);
    setLoading(true);
    setError(null);
    try {
      const data = await searchJobs(query, location);
      setJobs(data.jobs || []);
      setActiveTab("search");
    } catch (err) {
      setError("Failed to search jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Determine which jobs list to show in the listings area
  const displayJobs = activeTab === "matched" ? autoMatchedJobs : jobs;
  const isAutoMatchTab = activeTab === "matched";

  return (
    <div className="jobs-page">
      {/* Search Header */}
      <div className="jobs-header">
        <h2>🔍 Find Your Dream Job</h2>
        <p>Live listings from RemoteOK, Adzuna, and JSearch (Google for Jobs / LinkedIn / Indeed / Glassdoor)</p>

        <form onSubmit={handleSearch} className="jobs-search-form">
          <div className="search-inputs">
            <div className="search-field">
              <span className="search-icon">💼</span>
              <input
                type="text"
                id="job-search-input"
                placeholder="Job title, skills, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="search-field location">
              <span className="search-icon">📍</span>
              <select
                id="job-location-select"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                {ALL_INDIAN_STATES.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              id="job-search-btn"
              className="search-btn"
              disabled={loading}
            >
              {loading ? "Searching..." : "Search Jobs"}
            </button>
          </div>
        </form>
      </div>

      {/* Tabs */}
      <div className="jobs-tabs">
        <button
          className={`tab ${activeTab === "trending" ? "active" : ""}`}
          onClick={() => setActiveTab("trending")}
        >
          🔥 Trending
        </button>
        <button
          className={`tab ${activeTab === "search" ? "active" : ""}`}
          onClick={() => setActiveTab("search")}
        >
          🔍 Search Results
        </button>

        {/* Auto-matched tab — appears after resume upload */}
        {(autoMatchedJobs.length > 0 || autoMatchLoading) && (
          <button
            className={`tab ${activeTab === "matched" ? "active" : ""}`}
            onClick={() => setActiveTab("matched")}
          >
            🎯 Matched for Your Resume
            {autoMatchedJobs.length > 0 && (
              <span className="tab-count">{autoMatchedJobs.length}</span>
            )}
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Trending Categories */}
      {activeTab === "trending" && (
        <div className="trending-section">
          <h3>📈 Trending Job Categories</h3>
          <p className="trending-note">Click any category to search for live listings</p>
          <div className="trending-grid">
            {trending.map((cat) => (
              <div
                key={cat.id}
                className="trending-card"
                onClick={() => handleTrendingClick(cat)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleTrendingClick(cat)}
              >
                <div className="trending-icon">{cat.icon}</div>
                <h4>{cat.name}</h4>
                <div className="trending-skills">
                  {cat.skills?.slice(0, 3).map((skill, i) => (
                    <span key={i} className="skill-chip">{skill}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auto-matched jobs banner — shown while matching is in progress */}
      {activeTab === "matched" && autoMatchLoading && (
        <div className="loading-jobs">
          <div className="spinner" />
          <p>Matching live jobs to your resume skills...</p>
        </div>
      )}

      {/* Job Listings — for Search Results and Matched tabs */}
      {(activeTab === "search" || activeTab === "matched") && !autoMatchLoading && (
        <div className="jobs-list">
          {loading ? (
            <div className="loading-jobs">
              <div className="spinner" />
              <p>Finding live listings from RemoteOK, Adzuna, and JSearch...</p>
            </div>
          ) : displayJobs.length === 0 ? (
            <EmptyState
              query={searchQuery}
              isAutoMatch={isAutoMatchTab}
            />
          ) : (
            <>
              <div className="jobs-count">
                Found <strong>{displayJobs.length}</strong> live listings
                {isAutoMatchTab && " matched to your resume"}
                {" "}<span className="jobs-count-note">(from RemoteOK · Adzuna · JSearch)</span>
              </div>
              {displayJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isAutoMatched={isAutoMatchTab}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
