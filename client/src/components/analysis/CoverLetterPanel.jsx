import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * CoverLetterPanel — Phase 3 Component
 * =======================================
 * Calls POST /api/resume/cover-letter using the resume + JD context already
 * available in the parent ResultPanel from the analysis response.
 * Lets the user optionally supply their name, company name, and role name
 * so the letter is properly personalised before generating.
 */
export default function CoverLetterPanel({ resumeText, jobDescription, userName }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    companyName: "",
    roleName: ""
  });
  const [showForm, setShowForm] = useState(true);

  const handleGenerate = async () => {
    if (!resumeText || !jobDescription) {
      toast.error("Resume text and job description are required");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE}/resume/cover-letter`,
        {
          resumeText,
          jobDescription,
          userName: userName || "",
          companyName: form.companyName || "the company",
          roleName: form.roleName || "this position"
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setResult(res.data);
      setShowForm(false);
      toast.success("Cover letter generated!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to generate cover letter");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result?.coverLetter) return;
    const header = `Dear Hiring Manager,\n\n`;
    const footer = `\n\nSincerely,\n${userName || "Your Name"}`;
    const fullLetter = header + result.coverLetter + footer;
    const blob = new Blob([fullLetter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Cover-Letter.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="phase3-panel">
      {showForm && !result ? (
        <div className="phase3-cta-box">
          <div className="phase3-cta-icon">✉️</div>
          <h4>AI Cover Letter Generator</h4>
          <p>
            Generates a professional, JD-matched cover letter using your resume and the job description you already
            provided. Optionally add the company name and role title to personalise it further.
          </p>

          <div className="cover-letter-form">
            <div className="form-row">
              <label className="form-label">Company Name <span className="optional">(optional)</span></label>
              <input
                type="text"
                className="phase3-input"
                placeholder="e.g. Google, Infosys, Startup Inc."
                value={form.companyName}
                onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                maxLength={200}
              />
            </div>
            <div className="form-row">
              <label className="form-label">Role / Job Title <span className="optional">(optional)</span></label>
              <input
                type="text"
                className="phase3-input"
                placeholder="e.g. Senior Frontend Developer"
                value={form.roleName}
                onChange={e => setForm(f => ({ ...f, roleName: e.target.value }))}
                maxLength={200}
              />
            </div>
          </div>

          <button
            className="phase3-action-btn"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <><span className="btn-spinner" /> Writing cover letter...</>
            ) : (
              "✉️ Generate Cover Letter"
            )}
          </button>
        </div>
      ) : result ? (
        <div className="phase3-result">
          <div className="phase3-output-header">
            <div>
              <h4>✉️ Your Cover Letter</h4>
              <span className="word-count-badge">{result.wordCount} words</span>
            </div>
            <div className="phase3-output-actions">
              <button className="btn-secondary-sm" onClick={() => { setResult(null); setShowForm(true); }}>
                🔄 Re-generate
              </button>
              <button className="btn-download-sm" onClick={handleDownload}>
                ⬇️ Download .txt
              </button>
            </div>
          </div>

          {/* Formatted letter preview */}
          <div className="cover-letter-preview">
            <p className="cover-letter-salutation">Dear Hiring Manager,</p>
            <div className="cover-letter-body">
              {result.coverLetter.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <p className="cover-letter-signoff">
              Sincerely,<br />
              <strong>{userName || "[Your Name]"}</strong>
            </p>
          </div>

          <div className="cover-letter-tip">
            💡 <strong>Tip:</strong> Add your contact details at the top and the hiring manager's name if you know it before sending.
          </div>
        </div>
      ) : null}
    </div>
  );
}
