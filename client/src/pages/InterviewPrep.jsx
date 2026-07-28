/**
 * InterviewPrep.jsx - Interview Preparation Practice Page
 * ========================================================
 * Allows users to practice interview questions generated from
 * a job description and their resume
 */

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import InterviewQuestion from "../components/InterviewQuestion";
import { useAuth } from "../context/AuthContext";

export default function InterviewPrep() {
  const { isGuest } = useAuth();
  const [stage, setStage] = useState("input"); // input, questions, practice, results
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState("");
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [scores, setScores] = useState([]);
  const [overallPerformance, setOverallPerformance] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Generate interview questions
  const handleGenerateQuestions = async () => {
    if (!jobDescription.trim() || !resume.trim()) {
      toast.error("Please enter both job description and resume");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/interview/generate-questions`,
        {
          jobDescription,
          resume,
        }
      );

      if (response.data.success && response.data.questions.length > 0) {
        setQuestions(response.data.questions);
        setUserAnswers({});
        setEvaluations({});
        setScores([]);
        setSelectedQuestionIndex(0);
        setStage("questions");
        toast.success(`Generated ${response.data.questions.length} interview questions!`);
      } else {
        toast.error("Failed to generate questions. Please try again.");
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      toast.error(
        error.response?.data?.error || "Failed to generate questions"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle moving to practice mode
  const handleStartPractice = (index) => {
    setSelectedQuestionIndex(index);
    setStage("practice");
  };

  // Handle submitting answer for evaluation
  const handleSubmitAnswer = async () => {
    const currentQuestion = questions[selectedQuestionIndex];
    const userAnswer = userAnswers[selectedQuestionIndex] || "";

    if (!userAnswer.trim()) {
      toast.error("Please type an answer before submitting");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/interview/evaluate-answer`,
        {
          question: currentQuestion.question,
          userAnswer,
          jobDescription,
          resume,
        }
      );

      if (response.data.success) {
        const evaluation = response.data.evaluation;
        setEvaluations({
          ...evaluations,
          [selectedQuestionIndex]: evaluation,
        });

        // Add score to array
        const newScores = [...scores];
        if (!newScores[selectedQuestionIndex]) {
          newScores[selectedQuestionIndex] = evaluation.score;
        }
        setScores(newScores);

        toast.success("Answer evaluated! Check the feedback below.");
      } else {
        toast.error("Failed to evaluate answer");
      }
    } catch (error) {
      console.error("Error evaluating answer:", error);
      toast.error(
        error.response?.data?.error || "Failed to evaluate answer"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle finishing interview
  const handleFinishInterview = async () => {
    const validScores = Object.values(evaluations).map((e) => e.score);

    if (validScores.length === 0) {
      toast.error("Please evaluate at least one question before finishing");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/interview/calculate-performance`,
        {
          scores: validScores,
        }
      );

      if (response.data.success) {
        setOverallPerformance(response.data.performance);
        setStage("results");
        toast.success("Interview complete! Check your results below.");
      }
    } catch (error) {
      console.error("Error calculating performance:", error);
      toast.error("Failed to calculate performance");
    }
  };

  // Reset everything
  const handleReset = () => {
    setStage("input");
    setJobDescription("");
    setResume("");
    setQuestions([]);
    setUserAnswers({});
    setEvaluations({});
    setScores([]);
    setOverallPerformance(null);
  };

  // STAGE 1: INPUT
  if (stage === "input") {
    return (
      <div className="interview-prep-container">
        <div className="interview-header">
          <h1>🎯 Interview Preparation</h1>
          <p>Practice interview questions tailored to your job description and resume</p>
        </div>

        <div className="interview-input-section">
          <div className="input-group">
            <label>📄 Job Description</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              rows="8"
              className="interview-textarea"
            />
            <small>Copy and paste the complete job description</small>
          </div>

          <div className="input-group">
            <label>📋 Your Resume</label>
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Paste your resume here..."
              rows="8"
              className="interview-textarea"
            />
            <small>Copy and paste your complete resume text</small>
          </div>

          <button
            onClick={handleGenerateQuestions}
            disabled={loading || !jobDescription.trim() || !resume.trim()}
            className="btn-primary interview-btn"
          >
            {loading ? "🔄 Generating Questions..." : "✨ Generate Interview Questions"}
          </button>
        </div>

        {isGuest && (
          <div className="info-box">
            <p>💡 Tip: You're using guest mode. Sign up to save your interview practice sessions!</p>
          </div>
        )}
      </div>
    );
  }

  // STAGE 2: QUESTIONS LIST
  if (stage === "questions") {
    return (
      <div className="interview-prep-container">
        <div className="interview-header">
          <h1>🎯 Interview Questions</h1>
          <p>{questions.length} questions generated based on your inputs</p>
        </div>

        <div className="questions-grid">
          {questions.map((q, index) => (
            <div
              key={index}
              className={`question-card ${
                evaluations[index] ? "completed" : ""
              } ${selectedQuestionIndex === index ? "selected" : ""}`}
            >
              <div className="question-header">
                <span className="question-number">Q{index + 1}</span>
                <span className={`difficulty ${q.difficulty}`}>
                  {q.difficulty}
                </span>
              </div>
              <p className="question-text">{q.question}</p>
              <p className="question-category">📚 {q.category}</p>
              {evaluations[index] && (
                <div className="score-badge">
                  Score: {evaluations[index].score}%
                </div>
              )}
              <button
                onClick={() => handleStartPractice(index)}
                className="btn-secondary"
              >
                {evaluations[index] ? "👁️ Review" : "✏️ Practice"}
              </button>
            </div>
          ))}
        </div>

        <div className="interview-actions">
          <button onClick={handleReset} className="btn-outline">
            ← Back
          </button>
          {scores.length > 0 && (
            <button onClick={handleFinishInterview} className="btn-primary">
              ✅ Finish Interview ({scores.length}/{questions.length})
            </button>
          )}
        </div>
      </div>
    );
  }

  // STAGE 3: PRACTICE MODE
  if (stage === "practice") {
    const currentQuestion = questions[selectedQuestionIndex];
    const currentEvaluation = evaluations[selectedQuestionIndex];
    const currentAnswer = userAnswers[selectedQuestionIndex] || "";

    return (
      <InterviewQuestion
        question={currentQuestion}
        index={selectedQuestionIndex}
        totalQuestions={questions.length}
        userAnswer={currentAnswer}
        onAnswerChange={(answer) =>
          setUserAnswers({ ...userAnswers, [selectedQuestionIndex]: answer })
        }
        evaluation={currentEvaluation}
        onSubmit={handleSubmitAnswer}
        onNavigate={(direction) => {
          const newIndex =
            direction === "next"
              ? Math.min(selectedQuestionIndex + 1, questions.length - 1)
              : Math.max(selectedQuestionIndex - 1, 0);
          setSelectedQuestionIndex(newIndex);
        }}
        onBack={() => setStage("questions")}
        loading={loading}
        jobDescription={jobDescription}
      />
    );
  }

  // STAGE 4: RESULTS
  if (stage === "results" && overallPerformance) {
    return (
      <div className="interview-prep-container">
        <div className="interview-header">
          <h1>🎉 Interview Results</h1>
          <p>Here's how you performed</p>
        </div>

        <div className="results-section">
          <div className="performance-card">
            <div className="score-circle">
              <div className="score-number">
                {overallPerformance.overallScore}
              </div>
              <div className="score-label">Overall Score</div>
            </div>

            <div className="performance-details">
              <div className="performance-row">
                <span>Rating</span>
                <span className={`rating ${overallPerformance.rating.toLowerCase()}`}>
                  {overallPerformance.rating}
                </span>
              </div>
              <div className="performance-row">
                <span>Questions Practiced</span>
                <span>{overallPerformance.totalQuestions}</span>
              </div>
              <div className="performance-row">
                <span>Highest Score</span>
                <span>{overallPerformance.highestScore}%</span>
              </div>
              <div className="performance-row">
                <span>Lowest Score</span>
                <span>{overallPerformance.lowestScore}%</span>
              </div>
            </div>
          </div>

          <div className="improvements-section">
            <h3>💡 Areas to Improve</h3>
            <ul>
              {overallPerformance.overallScore >= 90 && (
                <li>🎯 Excellent performance! You're well-prepared for this role.</li>
              )}
              {overallPerformance.overallScore >= 80 &&
                overallPerformance.overallScore < 90 && (
                  <li>
                    ✨ Great job! Focus on the lower-scored questions for extra
                    polish.
                  </li>
                )}
              {overallPerformance.overallScore >= 70 &&
                overallPerformance.overallScore < 80 && (
                  <li>
                    📈 Good effort! Review the feedback on each question and
                    practice more.
                  </li>
                )}
              {overallPerformance.overallScore < 70 && (
                <li>
                  💪 Keep practicing! Review the sample answers and tips for each
                  question.
                </li>
              )}
              <li>
                🎤 Practice speaking your answers aloud to build confidence
              </li>
              <li>
                ⏱️ Work on concise answers - aim for 1-2 minutes per answer
              </li>
              <li>📚 Research the company before your actual interview</li>
            </ul>
          </div>

          <div className="question-scores">
            <h3>📊 Score by Question</h3>
            <div className="scores-list">
              {questions.map((q, index) => (
                <div key={index} className="score-item">
                  <span className="question-num">Q{index + 1}</span>
                  <span className="question-short">{q.question.substring(0, 40)}...</span>
                  {evaluations[index] && (
                    <span className="score">{evaluations[index].score}%</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="interview-actions">
          <button
            onClick={() => setStage("questions")}
            className="btn-secondary"
          >
            👁️ Review Answers
          </button>
          <button onClick={handleReset} className="btn-primary">
            🔄 Practice Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}
