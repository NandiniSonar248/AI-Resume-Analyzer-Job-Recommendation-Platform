import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import useSocket from "../../hooks/useSocket";
import useSpeechRecognition from "../../hooks/useSpeechRecognition";
import useSpeechSynthesis from "../../hooks/useSpeechSynthesis";
import RoundSelector from "./RoundSelector";
import VoiceControls from "./VoiceControls";
import SpeechAnalyticsReport from "./SpeechAnalyticsReport";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function InterviewRoom({
  resumeText = "",
  jobDescription = "",
  roleTitle = "Software Engineer",
  companyName = "Target Company"
}) {
  const [session, setSession] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentRound, setCurrentRound] = useState("HR/Behavioral");
  const [completedRounds, setCompletedRounds] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [turnStatus, setTurnStatus] = useState("idle"); // idle | interviewer_speaking | listening | evaluating | round_done | finished
  const [finalReport, setFinalReport] = useState(null);
  const [autoVoiceOutput, setAutoVoiceOutput] = useState(true);

  // Custom hooks
  const { socket, connected, connectionError, emit, on } = useSocket(sessionId, !!sessionId);
  const {
    isListening,
    transcript,
    setTranscript,
    interimTranscript,
    isSupported: isRecSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();
  const { isSpeaking, isSupported: isSynthSupported, speak, stop: stopSpeaking } = useSpeechSynthesis();

  // Initialize or fetch session
  const initSession = async () => {
    setLoading(true);
    setFinalReport(null);
    setCompletedRounds([]);
    setCurrentQuestion(null);
    setTurnStatus("idle");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE}/interview/session`,
        { resumeText, jobDescription, roleTitle, companyName },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setSession(res.data.session);
      setSessionId(res.data.session.sessionId);
      setCurrentRound(res.data.session.availableRounds[0]);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to start interview session");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initSession();
    return () => {
      stopSpeaking();
    };
  }, [resumeText, jobDescription]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Server sends next question
    const offQuestion = on("interview:question", ({ question, currentRound: round }) => {
      setCurrentQuestion(question);
      setCurrentRound(round);
      resetTranscript();

      if (autoVoiceOutput && isSynthSupported) {
        setTurnStatus("interviewer_speaking");
        speak(question.text, () => {
          setTurnStatus("idle");
        });
      } else {
        setTurnStatus("idle");
      }
    });

    // Server updates status
    const offStatus = on("interview:status", ({ status }) => {
      if (status === "generating_question" || status === "generating_followup") {
        setTurnStatus("generating_question");
      } else if (status === "evaluating_answer") {
        setTurnStatus("evaluating");
      } else if (status === "compiling_report") {
        setTurnStatus("compiling_report");
      }
    });

    // Round completed
    const offRoundCompleted = on("interview:round_completed", ({ completedRound, nextRound }) => {
      setCompletedRounds((prev) => [...new Set([...prev, completedRound])]);
      setTurnStatus("round_done");
      toast.success(`✓ Completed ${completedRound}!`);
      if (nextRound) {
        setCurrentRound(nextRound);
      }
    });

    // Full session report ready
    const offReport = on("interview:session_report", ({ report }) => {
      setFinalReport(report);
      setTurnStatus("finished");
      toast.success("🏆 Interview completed! Report ready.");
    });

    const offError = on("interview:error", ({ message }) => {
      toast.error(message || "Socket error during interview");
      setTurnStatus("idle");
    });

    return () => {
      offQuestion();
      offStatus();
      offRoundCompleted();
      offReport();
      offError();
    };
  }, [socket, on, autoVoiceOutput, isSynthSupported, speak, resetTranscript]);

  // Actions
  const handleStartRound = (round) => {
    const targetRound = round || currentRound;
    setCurrentRound(targetRound);
    setTurnStatus("generating_question");
    emit("interview:start_round", {
      sessionId,
      roundType: targetRound
    });
  };

  const handleStopListening = () => {
    const { durationSeconds, pauseIntervals } = stopListening();
    return { durationSeconds, pauseIntervals };
  };

  const handleSubmitAnswer = () => {
    if (!currentQuestion) return;

    let timing = { durationSeconds: 0, pauses: [] };
    if (isListening) {
      timing = handleStopListening();
    }

    const fullAnswer = transcript.trim();
    if (!fullAnswer) {
      toast.error("Please speak or type an answer first");
      return;
    }

    setTurnStatus("evaluating");
    emit("interview:submit_answer", {
      sessionId,
      questionId: currentQuestion.id,
      answerText: fullAnswer,
      speechMetrics: {
        durationSeconds: timing.durationSeconds || Math.max(Math.round(fullAnswer.split(/\s+/).length / 2.5), 1),
        pauses: timing.pauseIntervals || []
      }
    });
  };

  const handleFinishEarly = () => {
    emit("interview:request_report", { sessionId });
  };

  if (loading) {
    return (
      <div className="interview-loading-box">
        <div className="btn-spinner"></div>
        <p>Initializing your personalized mock interview...</p>
      </div>
    );
  }

  if (finalReport) {
    return (
      <SpeechAnalyticsReport
        report={finalReport}
        onRestart={initSession}
      />
    );
  }

  return (
    <div className="interview-room-wrapper fade-in">
      {/* Top Banner: Connection status & Voice Toggle */}
      <div className="interview-top-bar">
        <div className="interview-role-meta">
          <h3 className="interview-role-title">Live Interview: {roleTitle}</h3>
          <span className="interview-company-name">Target: {companyName}</span>
        </div>

        <div className="interview-controls-meta">
          <label className="toggle-voice-label">
            <input
              type="checkbox"
              checked={autoVoiceOutput}
              onChange={(e) => setAutoVoiceOutput(e.target.checked)}
            />
            <span>🔊 Spoken Interviewer Voice</span>
          </label>

          <span className={`connection-indicator ${connected ? "online" : "offline"}`}>
            <span className="indicator-dot"></span>
            {connected ? "Real-Time Connected" : "Reconnecting..."}
          </span>

          <button className="btn-finish-early" onClick={handleFinishEarly} title="End interview and view report">
            🏁 End & View Report
          </button>
        </div>
      </div>

      {connectionError && (
        <div className="connection-error-banner">
          ⚠️ {connectionError}. Re-attempting real-time connection...
        </div>
      )}

      {/* Multi-Round Progress Bar */}
      {session && (
        <RoundSelector
          availableRounds={session.availableRounds}
          currentRound={currentRound}
          completedRounds={completedRounds}
          onSelectRound={(r) => handleStartRound(r)}
          disabled={turnStatus === "evaluating" || turnStatus === "interviewer_speaking"}
        />
      )}

      {/* Active Question Stage */}
      <div className="interview-stage-card">
        {/* Interviewer Persona Avatar */}
        <div className="interviewer-avatar-row">
          <div className={`interviewer-avatar ${isSpeaking ? "speaking-pulse" : ""}`}>
            🤖
          </div>
          <div className="interviewer-meta">
            <span className="interviewer-name">Senior AI Technical Interviewer</span>
            <span className="interviewer-status">
              {isSpeaking
                ? "🗣️ Speaking question aloud..."
                : turnStatus === "evaluating"
                ? "🧠 Evaluating response depth & delivery..."
                : turnStatus === "generating_question"
                ? "⚡ Preparing dynamic follow-up..."
                : "👂 Waiting for your answer..."}
            </span>
          </div>

          {currentQuestion && isSynthSupported && (
            <button
              className="btn-replay-audio"
              onClick={() => speak(currentQuestion.text)}
              disabled={isSpeaking}
            >
              🔄 Replay Question Audio
            </button>
          )}
        </div>

        {/* Question Display */}
        {currentQuestion ? (
          <div className="interview-question-bubble">
            <div className="question-meta-row">
              <span className="question-round-badge">{currentQuestion.round} Round</span>
              <span className="question-number-badge">
                Question {currentQuestion.questionNumber} of {currentQuestion.maxQuestionsInRound}
              </span>
              <span className="question-focus-badge">{currentQuestion.focusArea}</span>
            </div>

            <p className="question-text-content">{currentQuestion.text}</p>
          </div>
        ) : (
          <div className="interview-start-cta">
            <h4>Ready to start the {currentRound} round?</h4>
            <p>
              The interviewer will speak each question aloud. You can answer using your microphone or by typing.
              Follow-up questions adapt dynamically based on what you say.
            </p>
            <button
              className="btn-primary-lg"
              onClick={() => handleStartRound(currentRound)}
              disabled={!connected}
            >
              🚀 Begin {currentRound} Round
            </button>
          </div>
        )}

        {/* Turn Status Spinner if waiting on AI */}
        {(turnStatus === "generating_question" || turnStatus === "evaluating") && (
          <div className="turn-status-banner">
            <span className="btn-spinner"></span>
            <span>
              {turnStatus === "evaluating"
                ? "Analyzing answer substance, filler words, and speaking pace..."
                : "Formulating adaptive follow-up..."}
            </span>
          </div>
        )}

        {/* Round Completion Transition Prompt */}
        {turnStatus === "round_done" && (
          <div className="round-done-banner">
            <h4>🎉 {completedRounds[completedRounds.length - 1]} Round Completed!</h4>
            <p>You can advance to the next round or complete your session to generate your final hiring evaluation.</p>
            <div className="round-done-actions">
              <button
                className="btn-primary"
                onClick={() => handleStartRound(currentRound)}
              >
                Proceed to {currentRound} Round ➔
              </button>
              <button className="btn-secondary" onClick={handleFinishEarly}>
                View Final Performance Report 🏁
              </button>
            </div>
          </div>
        )}

        {/* Voice and Text Input Controls */}
        {currentQuestion && turnStatus !== "round_done" && (
          <VoiceControls
            isListening={isListening}
            transcript={transcript}
            interimTranscript={interimTranscript}
            onStartListening={startListening}
            onStopListening={handleStopListening}
            onSubmitAnswer={handleSubmitAnswer}
            onTextChange={setTranscript}
            isSupported={isRecSupported}
            disabled={turnStatus === "evaluating" || turnStatus === "generating_question"}
          />
        )}
      </div>
    </div>
  );
}
