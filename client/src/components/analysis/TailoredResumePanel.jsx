import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * TailoredResumePanel — Phase 3 Component
 * ==========================================
 * Calls POST /api/resume/tailor which uses tailoringService.js with the
 * 5-layer anti-hallucination guardrail. Prominently shows:
 *   1. The disclaimer the user MUST read before using the output
 *   2. The guardrail report (clean / violations found)
 *   3. The tailored resume text
 *   4. A download button (plain text — no fake PDF renderer)
 *
 * HOW IT CONNECTS:
 *   - Receives resumeText and jobDescription from parent ResultPanel (from analysis response)
 *   - Posts to /api/resume/tailor
 *   - Renders guardrail status + tailored output
 */
export default function TailoredResumePanel({ resumeText, jobDescription }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTailor = async () => {
    if (!resumeText || !jobDescription) {
      toast.error("Resume text and job description are required");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE}/resume/tailor`,
        { resumeText, jobDescription },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setResult(res.data);
      toast.success("Tailored resume generated!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to tailor resume");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result?.tailoredResume) return;
    const blob = new Blob([result.tailoredResume], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ATS-Tailored-Resume.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="phase3-panel">
      {!result ? (
        <div className="phase3-cta-box">
          <div className="phase3-cta-icon">✂️</div>
          <h4>JD-Tailored Resume Rewrite</h4>
          <p>
            Rephrases your existing resume to better match this job description — using stronger action verbs,
            front-loading relevant experience, and incorporating JD terminology where your skills already support it.
          </p>
          <div className="guardrail-notice">
            <span className="guardrail-badge">🛡️ Anti-Hallucination Guardrail Active</span>
            <p>
              The AI is strictly constrained to rephrase only what you already wrote. It cannot invent new skills,
              employers, metrics, or experience. A post-generation validation check will flag anything suspicious.
            </p>
          </div>
          <button
            className="phase3-action-btn"
            onClick={handleTailor}
            disabled={loading}
          >
            {loading ? (
              <><span className="btn-spinner" /> Tailoring resume...</>
            ) : (
              "✂️ Generate Tailored Resume"
            )}
          </button>
        </div>
      ) : (
        <div className="phase3-result">
          {/* Disclaimer — always shown first, prominent */}
          <div className="disclaimer-box">
            <strong>⚠️ Important — Read Before Using</strong>
            <p>{result.disclaimer}</p>
          </div>

          {/* Guardrail Report */}
          {result.guardrailReport && (
            <div className={`guardrail-report ${result.guardrailReport.clean ? "guardrail-clean" : "guardrail-flagged"}`}>
              <strong>{result.guardrailReport.message}</strong>
              {!result.guardrailReport.clean && result.guardrailReport.violations?.length > 0 && (
                <ul className="guardrail-violations">
                  {result.guardrailReport.violations.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Tailored Resume Output */}
          <div className="phase3-output-header">
            <h4>📄 Tailored Resume Draft</h4>
            <div className="phase3-output-actions">
              <button className="btn-secondary-sm" onClick={() => setResult(null)}>
                🔄 Re-generate
              </button>
              <button className="btn-download-sm" onClick={handleDownload}>
                ⬇️ Download .txt
              </button>
            </div>
          </div>
          <pre className="phase3-text-output">{result.tailoredResume}</pre>
        </div>
      )}
    </div>
  );
}
