/**
 * InterviewQuestion.jsx - Single Interview Question Component
 * ===========================================================
 * Handles displaying one question, getting user answer, and showing evaluation
 */

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function InterviewQuestion({
  question,
  index,
  totalQuestions,
  userAnswer,
  onAnswerChange,
  evaluation,
  onSubmit,
  onNavigate,
  onBack,
  loading,
  jobDescription,
}) {
  const [showSampleAnswer, setShowSampleAnswer] = useState(false);
  const [sampleAnswer, setSampleAnswer] = useState("");
  const [loadingSample, setLoadingSample] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Fetch sample answer
  const handleShowSampleAnswer = async () => {
    if (sampleAnswer) {
      setShowSampleAnswer(!showSampleAnswer);
      return;
    }

    setLoadingSample(true);
    try {
      const response = await axios.post(`${API_URL}/interview/sample-answer`, {
        question: question.question,
        jobDescription,
      });

      if (response.data.success) {
        setSampleAnswer(response.data.sampleAnswer);
        setShowSampleAnswer(true);
        toast.success("Sample answer loaded!");
      } else {
        toast.error("Failed to load sample answer");
      }
    } catch (error) {
      console.error("Error loading sample answer:", error);
      toast.error("Failed to load sample answer");
    } finally {
      setLoadingSample(false);
    }
  };

  return (
    <div className="interview-question-page">
      <div className="interview-header">
        <h1>Interview Practice</h1>
        <p>
          Question {index + 1} of {totalQuestions}
        </p>
      </div>

      <div className="question-container">
        {/* Question Card */}
        <div className="question-card-large">
          <div className="question-meta">
            <span className="difficulty-badge">{question.difficulty}</span>
            <span className="category-badge">{question.category}</span>
          </div>
          <h2 className="question-text-large">{question.question}</h2>
        </div>

        {/* Answer Input */}
        <div className="answer-section">
          <label className="answer-label">Your Answer</label>
          <textarea
            value={userAnswer}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="Type your answer here... (Be specific and use examples from your experience)"
            rows="6"
            className="answer-textarea"
            disabled={!!evaluation}
          />
          <small className="character-count">
            {userAnswer.length} characters
          </small>
        </div>

        {/* Evaluation Results */}
        {evaluation && (
          <div className="evaluation-section">
            {/* Score */}
            <div className="score-display">
              <div className="score-box">
                <div className="score-value">{evaluation.score}%</div>
                <div className="score-label">Your Score</div>
              </div>
            </div>

            {/* Strengths */}
            <div className="feedback-card strengths">
              <h4>✅ What You Did Well</h4>
              <p>{evaluation.strengths}</p>
            </div>

            {/* Improvements */}
            <div className="feedback-card improvements">
              <h4>📈 Areas to Improve</h4>
              <p>{evaluation.improvements}</p>
            </div>

            {/* Tips */}
            <div className="feedback-card tips">
              <h4>💡 Tips for Next Time</h4>
              <ul>
                {evaluation.tips &&
                  evaluation.tips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
              </ul>
            </div>

            {/* Missing Keywords */}
            {evaluation.missingKeywords && evaluation.missingKeywords.length > 0 && (
              <div className="feedback-card keywords">
                <h4>🔑 Keywords You Could Have Mentioned</h4>
                <div className="keywords-list">
                  {evaluation.missingKeywords.map((keyword, i) => (
                    <span key={i} className="keyword-tag">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Sample Answer */}
            <div className="sample-answer-section">
              <button
                onClick={handleShowSampleAnswer}
                disabled={loadingSample}
                className="btn-secondary"
              >
                {loadingSample
                  ? "🔄 Loading Sample Answer..."
                  : showSampleAnswer
                  ? "👁️ Hide Sample Answer"
                  : "📖 Show Sample Answer"}
              </button>

              {showSampleAnswer && sampleAnswer && (
                <div className="sample-answer-box">
                  <h4>Sample Answer</h4>
                  <p>{sampleAnswer}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="question-actions">
          <div className="navigation-buttons">
            <button
              onClick={onBack}
              className="btn-outline"
              disabled={loading}
            >
              ← Back to Questions
            </button>

            {index > 0 && (
              <button
                onClick={() => onNavigate("prev")}
                className="btn-secondary"
              >
                ← Previous
              </button>
            )}

            {index < totalQuestions - 1 && (
              <button
                onClick={() => onNavigate("next")}
                className="btn-secondary"
              >
                Next →
              </button>
            )}
          </div>

          <div className="submit-buttons">
            {!evaluation ? (
              <button
                onClick={onSubmit}
                disabled={loading || !userAnswer.trim()}
                className="btn-primary"
              >
                {loading ? "⏳ Evaluating..." : "✅ Get Feedback"}
              </button>
            ) : (
              <button
                onClick={() => onAnswerChange("")}
                className="btn-secondary"
              >
                🔄 Edit Answer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${((index + 1) / totalQuestions) * 100}%` }}
        ></div>
      </div>
    </div>
  );
}
