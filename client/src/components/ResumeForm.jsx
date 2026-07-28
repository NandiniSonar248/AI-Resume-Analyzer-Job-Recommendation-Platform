import { useState, useRef } from "react";
import { analyzeResume } from "../api";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
];
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt"];

export default function ResumeForm({ setData, setError }) {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const ext = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
      if (!ALLOWED_TYPES.includes(selectedFile.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
        setError("Please upload a PDF, DOCX, DOC, or TXT file");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size should be less than 10MB");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Please upload your resume (PDF, DOCX, or TXT)");
      return;
    }
    if (!jd.trim()) {
      setError("Please paste the job description");
      return;
    }
    if (jd.trim().length < 50) {
      setError("Job description is too short. Please paste the complete job posting.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jd);

    setLoading(true);
    setData(null);

    try {
      const result = await analyzeResume(formData);
      setData(result);
    } catch (err) {
      setError(err.response?.data?.error || "Analysis failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setJd("");
    setData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <span>📄</span> Upload Resume
      </div>
      <form onSubmit={handleSubmit} className="card-body">
        <div className="form-group">
          <label className="form-label">Resume (PDF, DOCX, DOC, TXT)</label>
          <div 
            className={`file-upload ${file ? "has-file" : ""}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
            />
            <div className="file-upload-icon">
              {file ? "✅" : "📤"}
            </div>
            <div className="file-upload-text">
              {file ? "File selected" : "Click to upload or drag & drop"}
            </div>
            {file && <div className="file-name">{file.name}</div>}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Job Description</label>
          <textarea
            placeholder="Paste the complete job description here..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
        </div>

        <button 
          type="submit" 
          className={`btn ${loading ? "btn-loading" : ""}`}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Analyzing...
            </>
          ) : (
            <>
              <span>🔍</span>
              Analyze Resume
            </>
          )}
        </button>

        {(file || jd) && !loading && (
          <button 
            type="button" 
            onClick={handleReset}
            style={{
              marginTop: "10px",
              background: "transparent",
              color: "#64748b",
              border: "1px solid #e2e8f0"
            }}
            className="btn"
          >
            Reset
          </button>
        )}
      </form>
    </div>
  );
}