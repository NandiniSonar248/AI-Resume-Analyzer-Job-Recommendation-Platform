import { useState } from "react";
import { optimizeResume, generatePDFResume, analyzeKeywords } from "../api";

export default function ResumeBuilder() {
  const [step, setStep] = useState(1); // 1: Job Description, 2: Personal Info, 3: Experience, 4: Preview
  const [loading, setLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [optimizedResume, setOptimizedResume] = useState(null);
  const [error, setError] = useState(null);
  
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    portfolio: "",
    targetRole: "",
    yearsOfExperience: "",
    skills: [],
    experience: [],
    education: [],
    projects: []
  });

  const [newSkill, setNewSkill] = useState("");

  const handleAnalyzeJD = async () => {
    if (!jobDescription.trim() || jobDescription.length < 50) {
      setError("Please enter a complete job description (min 50 characters)");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeKeywords(jobDescription);
      setKeywords(data.keywords || []);
      setStep(2);
    } catch (err) {
      setError("Failed to analyze job description");
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !userData.skills.includes(newSkill.trim())) {
      setUserData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skill) => {
    setUserData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const addExperience = () => {
    setUserData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        title: "",
        company: "",
        location: "",
        dates: "",
        bullets: [""]
      }]
    }));
  };

  const updateExperience = (index, field, value) => {
    const updated = [...userData.experience];
    updated[index][field] = value;
    setUserData(prev => ({ ...prev, experience: updated }));
  };

  const addEducation = () => {
    setUserData(prev => ({
      ...prev,
      education: [...prev.education, { degree: "", institution: "", year: "" }]
    }));
  };

  const addProject = () => {
    setUserData(prev => ({
      ...prev,
      projects: [...prev.projects, { name: "", description: "", technologies: [] }]
    }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await optimizeResume(userData, jobDescription, keywords);
      setOptimizedResume(data.resume);
      setStep(4);
    } catch (err) {
      setError("Failed to generate resume");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!optimizedResume) return;
    
    setLoading(true);
    try {
      const blob = await generatePDFResume(optimizedResume);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ATS-Optimized-Resume.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resume-builder">
      {/* Progress Steps */}
      <div className="builder-progress">
        <div className={`progress-step ${step >= 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}>
          <span className="step-number">1</span>
          <span className="step-label">Job Description</span>
        </div>
        <div className="progress-line"></div>
        <div className={`progress-step ${step >= 2 ? "active" : ""} ${step > 2 ? "completed" : ""}`}>
          <span className="step-number">2</span>
          <span className="step-label">Personal Info</span>
        </div>
        <div className="progress-line"></div>
        <div className={`progress-step ${step >= 3 ? "active" : ""} ${step > 3 ? "completed" : ""}`}>
          <span className="step-number">3</span>
          <span className="step-label">Experience</span>
        </div>
        <div className="progress-line"></div>
        <div className={`progress-step ${step >= 4 ? "active" : ""}`}>
          <span className="step-number">4</span>
          <span className="step-label">Preview</span>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Step 1: Job Description */}
      {step === 1 && (
        <div className="builder-card">
          <h2>📋 Paste the Job Description</h2>
          <p className="builder-subtitle">We'll extract keywords to optimize your resume</p>
          
          <textarea
            className="jd-textarea"
            placeholder="Paste the complete job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={12}
          />
          
          <div className="builder-actions">
            <button 
              onClick={handleAnalyzeJD} 
              className="primary-btn"
              disabled={loading || jobDescription.length < 50}
            >
              {loading ? (
                <><span className="spinner-small"></span> Analyzing...</>
              ) : (
                "Analyze & Continue →"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Personal Info */}
      {step === 2 && (
        <div className="builder-card">
          <h2>👤 Personal Information</h2>
          
          {keywords.length > 0 && (
            <div className="extracted-keywords">
              <h4>🎯 Extracted Keywords ({keywords.length})</h4>
              <div className="keyword-pills">
                {keywords.map((kw, i) => (
                  <span key={i} className="keyword-pill">{kw}</span>
                ))}
              </div>
            </div>
          )}

          <div className="form-grid">
            <div className="form-field">
              <label>Full Name *</label>
              <input
                type="text"
                value={userData.name}
                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="form-field">
              <label>Target Role *</label>
              <input
                type="text"
                value={userData.targetRole}
                onChange={(e) => setUserData({ ...userData, targetRole: e.target.value })}
                placeholder="Full Stack Developer"
              />
            </div>
            <div className="form-field">
              <label>Email *</label>
              <input
                type="email"
                value={userData.email}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="form-field">
              <label>Phone *</label>
              <input
                type="tel"
                value={userData.phone}
                onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                placeholder="+91 9876543210"
              />
            </div>
            <div className="form-field">
              <label>Location</label>
              <input
                type="text"
                value={userData.location}
                onChange={(e) => setUserData({ ...userData, location: e.target.value })}
                placeholder="Bangalore, India"
              />
            </div>
            <div className="form-field">
              <label>Years of Experience</label>
              <input
                type="text"
                value={userData.yearsOfExperience}
                onChange={(e) => setUserData({ ...userData, yearsOfExperience: e.target.value })}
                placeholder="3"
              />
            </div>
            <div className="form-field full-width">
              <label>LinkedIn Profile</label>
              <input
                type="url"
                value={userData.linkedin}
                onChange={(e) => setUserData({ ...userData, linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/johndoe"
              />
            </div>
          </div>

          {/* Skills Section */}
          <div className="skills-section">
            <h4>💡 Skills</h4>
            <div className="skill-input-row">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="Add a skill..."
              />
              <button onClick={addSkill} className="add-btn">+ Add</button>
            </div>
            <div className="skills-list">
              {userData.skills.map((skill, i) => (
                <span key={i} className="skill-tag">
                  {skill}
                  <button onClick={() => removeSkill(skill)}>×</button>
                </span>
              ))}
              {keywords.filter(k => !userData.skills.includes(k)).slice(0, 5).map((kw, i) => (
                <span 
                  key={`suggested-${i}`} 
                  className="skill-tag suggested"
                  onClick={() => setUserData(prev => ({ ...prev, skills: [...prev.skills, kw] }))}
                >
                  + {kw}
                </span>
              ))}
            </div>
          </div>

          <div className="builder-actions">
            <button onClick={() => setStep(1)} className="secondary-btn">← Back</button>
            <button onClick={() => setStep(3)} className="primary-btn">Continue →</button>
          </div>
        </div>
      )}

      {/* Step 3: Experience */}
      {step === 3 && (
        <div className="builder-card">
          <h2>💼 Experience & Education</h2>

          {/* Work Experience */}
          <div className="section-block">
            <div className="section-header">
              <h4>Work Experience</h4>
              <button onClick={addExperience} className="add-btn">+ Add Experience</button>
            </div>
            {userData.experience.map((exp, i) => (
              <div key={i} className="experience-item">
                <div className="form-grid">
                  <div className="form-field">
                    <label>Job Title</label>
                    <input
                      type="text"
                      value={exp.title}
                      onChange={(e) => updateExperience(i, "title", e.target.value)}
                      placeholder="Software Developer"
                    />
                  </div>
                  <div className="form-field">
                    <label>Company</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateExperience(i, "company", e.target.value)}
                      placeholder="Tech Corp"
                    />
                  </div>
                  <div className="form-field">
                    <label>Duration</label>
                    <input
                      type="text"
                      value={exp.dates}
                      onChange={(e) => updateExperience(i, "dates", e.target.value)}
                      placeholder="Jan 2022 - Present"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Education */}
          <div className="section-block">
            <div className="section-header">
              <h4>Education</h4>
              <button onClick={addEducation} className="add-btn">+ Add Education</button>
            </div>
            {userData.education.map((edu, i) => (
              <div key={i} className="education-item">
                <div className="form-grid">
                  <div className="form-field">
                    <label>Degree</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => {
                        const updated = [...userData.education];
                        updated[i].degree = e.target.value;
                        setUserData(prev => ({ ...prev, education: updated }));
                      }}
                      placeholder="B.Tech in Computer Science"
                    />
                  </div>
                  <div className="form-field">
                    <label>Institution</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => {
                        const updated = [...userData.education];
                        updated[i].institution = e.target.value;
                        setUserData(prev => ({ ...prev, education: updated }));
                      }}
                      placeholder="IIT Delhi"
                    />
                  </div>
                  <div className="form-field">
                    <label>Year</label>
                    <input
                      type="text"
                      value={edu.year}
                      onChange={(e) => {
                        const updated = [...userData.education];
                        updated[i].year = e.target.value;
                        setUserData(prev => ({ ...prev, education: updated }));
                      }}
                      placeholder="2022"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Projects */}
          <div className="section-block">
            <div className="section-header">
              <h4>Projects (Optional)</h4>
              <button onClick={addProject} className="add-btn">+ Add Project</button>
            </div>
            {userData.projects.map((proj, i) => (
              <div key={i} className="project-item">
                <div className="form-grid">
                  <div className="form-field">
                    <label>Project Name</label>
                    <input
                      type="text"
                      value={proj.name}
                      onChange={(e) => {
                        const updated = [...userData.projects];
                        updated[i].name = e.target.value;
                        setUserData(prev => ({ ...prev, projects: updated }));
                      }}
                      placeholder="E-commerce Platform"
                    />
                  </div>
                  <div className="form-field full-width">
                    <label>Description</label>
                    <textarea
                      value={proj.description}
                      onChange={(e) => {
                        const updated = [...userData.projects];
                        updated[i].description = e.target.value;
                        setUserData(prev => ({ ...prev, projects: updated }));
                      }}
                      placeholder="Built a full-stack e-commerce platform..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="builder-actions">
            <button onClick={() => setStep(2)} className="secondary-btn">← Back</button>
            <button 
              onClick={handleGenerate} 
              className="primary-btn"
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner-small"></span> Generating...</>
              ) : (
                "Generate ATS Resume →"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Preview */}
      {step === 4 && optimizedResume && (
        <div className="builder-card preview-card">
          <div className="preview-header">
            <h2>✨ Your ATS-Optimized Resume</h2>
            <div className="ats-score-badge">
              <span className="score">{optimizedResume.atsScore}</span>
              <span className="label">ATS Score</span>
            </div>
          </div>

          <div className="resume-preview">
            {/* Personal Info */}
            <div className="preview-section header-section">
              <h1 className="resume-name">{optimizedResume.personalInfo?.name}</h1>
              <p className="resume-contact">
                {optimizedResume.personalInfo?.email} | {optimizedResume.personalInfo?.phone} | {optimizedResume.personalInfo?.location}
              </p>
              {optimizedResume.personalInfo?.linkedin && (
                <p className="resume-links">{optimizedResume.personalInfo.linkedin}</p>
              )}
            </div>

            {/* Summary */}
            <div className="preview-section">
              <h3>Professional Summary</h3>
              <p>{optimizedResume.summary}</p>
            </div>

            {/* Skills */}
            <div className="preview-section">
              <h3>Technical Skills</h3>
              {optimizedResume.skills && Object.entries(optimizedResume.skills).map(([category, skills]) => (
                <div key={category} className="skill-category">
                  <strong>{category}:</strong> {Array.isArray(skills) ? skills.join(", ") : skills}
                </div>
              ))}
            </div>

            {/* Suggestions */}
            {optimizedResume.suggestions && (
              <div className="ai-suggestions-box">
                <h3>💡 AI Suggestions</h3>
                <p>{optimizedResume.suggestions}</p>
              </div>
            )}
          </div>

          <div className="builder-actions">
            <button onClick={() => setStep(3)} className="secondary-btn">← Edit</button>
            <button onClick={handleDownloadPDF} className="primary-btn download-btn" disabled={loading}>
              {loading ? "Generating PDF..." : "📥 Download PDF"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
