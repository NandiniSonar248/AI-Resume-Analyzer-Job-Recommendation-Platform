import { useState, useEffect } from "react";
import { searchJobs, matchJobsWithSkills, getTrendingJobs } from "../api";

const ALL_INDIAN_STATES = [
  // Union Territories & National
  { name: "All India", value: "India" },
  { name: "Remote", value: "Remote" },

  // States (Alphabetically)
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

export default function JobsPage({ userSkills = [] }) {
  const [jobs, setJobs] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("India");
  const [activeTab, setActiveTab] = useState("search"); // search, matched, trending
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTrending();
    if (userSkills.length > 0) {
      loadMatchedJobs();
    }
  }, [userSkills]);

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
    try {
      const data = await matchJobsWithSkills(userSkills, location);
      setJobs(data.jobs || []);
      setActiveTab("matched");
    } catch (err) {
      setError("Failed to match jobs");
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
      const data = await searchJobs(searchQuery, location);
      setJobs(data.jobs || []);
      setActiveTab("search");
    } catch (err) {
      setError("Failed to search jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrendingClick = async (category) => {
    setSearchQuery(category.name);
    setLoading(true);
    try {
      const data = await searchJobs(category.name, location);
      setJobs(data.jobs || []);
      setActiveTab("search");
    } catch (err) {
      setError("Failed to search jobs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="jobs-page">
      {/* Search Header */}
      <div className="jobs-header">
        <h2>🔍 Find Your Dream Job</h2>
        <p>Search from thousands of jobs across top portals</p>
        
        <form onSubmit={handleSearch} className="jobs-search-form">
          <div className="search-inputs">
            <div className="search-field">
              <span className="search-icon">💼</span>
              <input
                type="text"
                placeholder="Job title, skills, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="search-field location">
              <span className="search-icon">📍</span>
              <select value={location} onChange={(e) => setLocation(e.target.value)}>
                {ALL_INDIAN_STATES.map(state => (
                  <option key={state.value} value={state.value}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="search-btn" disabled={loading}>
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
        {userSkills.length > 0 && (
          <button 
            className={`tab ${activeTab === "matched" ? "active" : ""}`}
            onClick={() => { setActiveTab("matched"); loadMatchedJobs(); }}
          >
            🎯 Matched for You
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Trending Categories */}
      {activeTab === "trending" && (
        <div className="trending-section">
          <h3>📈 Trending Job Categories</h3>
          <div className="trending-grid">
            {trending.map((cat) => (
              <div 
                key={cat.id} 
                className="trending-card"
                onClick={() => handleTrendingClick(cat)}
              >
                <div className="trending-icon">{cat.icon}</div>
                <h4>{cat.name}</h4>
                <p className="trending-count">{cat.count}</p>
                <span className="trending-growth">{cat.growth}</span>
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

      {/* Job Listings */}
      {(activeTab === "search" || activeTab === "matched") && (
        <div className="jobs-list">
          {loading ? (
            <div className="loading-jobs">
              <div className="spinner"></div>
              <p>Finding the best jobs for you...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="no-jobs">
              <span className="no-jobs-icon">🔍</span>
              <h3>No jobs found</h3>
              <p>Try searching with different keywords or check trending categories</p>
            </div>
          ) : (
            <>
              <div className="jobs-count">
                Found <strong>{jobs.length}</strong> jobs
                {activeTab === "matched" && " matched to your skills"}
              </div>
              {jobs.map((job) => (
                <div key={job.id} className="job-card">
                  <div className="job-header">
                    <div className="job-logo">
                      {job.logo ? (
                        <img src={job.logo} alt={job.company} />
                      ) : (
                        <span className="job-logo-placeholder">
                          {job.company?.charAt(0) || "J"}
                        </span>
                      )}
                    </div>
                    <div className="job-main">
                      <h3 className="job-title">{job.title}</h3>
                      <p className="job-company">{job.company}</p>
                    </div>
                    <div className="job-source">
                      <span className="source-icon">{job.sourceIcon}</span>
                      <span className="source-name">{job.source}</span>
                    </div>
                  </div>
                  
                  <div className="job-details">
                    <span className="job-location">📍 {job.location}</span>
                    <span className="job-salary">💰 {job.salary}</span>
                    {job.isRemote && <span className="job-remote">🌍 Remote</span>}
                  </div>

                  {job.matchScore !== undefined && (
                    <div className="job-match">
                      <div className="match-bar">
                        <div 
                          className="match-fill" 
                          style={{ width: `${job.matchScore}%` }}
                        ></div>
                      </div>
                      <span className="match-score">{job.matchScore}% Match</span>
                    </div>
                  )}

                  {job.tags?.length > 0 && (
                    <div className="job-tags">
                      {job.tags.slice(0, 5).map((tag, i) => (
                        <span key={i} className="job-tag">{tag}</span>
                      ))}
                    </div>
                  )}

                  <p className="job-description">{job.description}</p>

                  <div className="job-actions">
                    <a 
                      href={job.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="apply-btn"
                    >
                      Apply Now →
                    </a>
                    <button className="save-btn">💾 Save</button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
