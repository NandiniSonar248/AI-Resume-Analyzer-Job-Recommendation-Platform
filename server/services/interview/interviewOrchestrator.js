/**
 * interviewOrchestrator.js — Stateful Multi-Round Interview Manager
 * ===================================================================
 * PURPOSE:
 *   Manages the stateful session lifecycle of a multi-round mock interview:
 *     - Round 1: HR & Behavioral (Culture fit, STAR method, conflict resolution)
 *     - Round 2: Technical (JD-specific architecture, system design, core tech)
 *     - Round 3: Coding & Problem Solving (Algorithmic reasoning, edge cases, if developer role)
 *
 * DESIGN ARCHITECTURE:
 *   - Fast in-memory active session store (Map) for real-time sub-millisecond
 *     lookups during active voice socket exchanges.
 *   - Automatic expiration (1 hour inactivity TTL) to prevent memory leaks.
 *   - Formats conversational history into a structured prompt context so
 *     `questionGenerator.js` can ask adaptive, deep follow-up questions.
 *
 * HOW IT CONNECTS:
 *   - Called by: `server/sockets/interviewSocket.js` and `server/routes/interviewRoutes.js`
 *   - Uses: `questionGenerator.js` to create the next adaptive question
 *   - Uses: `sessionScorer.js` to produce end-of-session performance reports
 */

import crypto from "crypto";

// Active session store: sessionId -> InterviewSession
const activeSessions = new Map();

// TTL: 1 hour in ms
const SESSION_TTL_MS = 60 * 60 * 1000;

export const ROUND_TYPES = {
  HR: "HR/Behavioral",
  TECHNICAL: "Technical",
  CODING: "Coding"
};

export const QUESTIONS_PER_ROUND = 3; // 3 deep, adaptive questions per round

/**
 * Clean up stale sessions
 */
function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [id, session] of activeSessions.entries()) {
    if (now - session.lastActivityAt > SESSION_TTL_MS) {
      activeSessions.delete(id);
    }
  }
}
setInterval(cleanupExpiredSessions, 15 * 60 * 1000);

/**
 * Detect if JD is a software development role that warrants a Coding round
 */
export function isCodingApplicable(jobDescription = "") {
  const text = jobDescription.toLowerCase();
  const devKeywords = [
    "developer", "engineer", "software", "frontend", "backend", "fullstack",
    "python", "javascript", "react", "node", "java", "c++", "golang", "devops"
  ];
  return devKeywords.some(kw => text.includes(kw));
}

/**
 * Create a new stateful interview session
 */
export function createInterviewSession({
  userId,
  resumeText = "",
  jobDescription = "",
  roleTitle = "Software Professional",
  companyName = "Target Company"
}) {
  const sessionId = crypto.randomUUID();
  const hasCoding = isCodingApplicable(jobDescription);

  const availableRounds = [
    ROUND_TYPES.HR,
    ROUND_TYPES.TECHNICAL
  ];
  if (hasCoding) {
    availableRounds.push(ROUND_TYPES.CODING);
  }

  const session = {
    sessionId,
    userId: userId || "guest",
    resumeText,
    jobDescription,
    roleTitle,
    companyName,
    availableRounds,
    currentRoundIndex: 0,
    currentRound: availableRounds[0],
    turns: [], // Array of { id, round, question, answer, evaluation, speechMetrics, timestamp }
    currentQuestion: null,
    speechTelemetry: [], // Streamed pauses, filler words
    status: "ready", // ready | in_progress | round_complete | completed
    createdAt: Date.now(),
    lastActivityAt: Date.now()
  };

  activeSessions.set(sessionId, session);
  return session;
}

/**
 * Retrieve session by ID
 */
export function getInterviewSession(sessionId) {
  const session = activeSessions.get(sessionId);
  if (session) {
    session.lastActivityAt = Date.now();
  }
  return session || null;
}

/**
 * Start or switch to a specific round
 */
export function startInterviewRound(sessionId, roundType) {
  const session = getInterviewSession(sessionId);
  if (!session) throw new Error("Session not found");

  if (!Object.values(ROUND_TYPES).includes(roundType)) {
    throw new Error(`Invalid round type: ${roundType}`);
  }

  session.currentRound = roundType;
  session.currentRoundIndex = session.availableRounds.indexOf(roundType);
  session.status = "in_progress";
  session.lastActivityAt = Date.now();

  return session;
}

/**
 * Get current round's questions count
 */
export function getRoundTurnCount(session, roundType) {
  return session.turns.filter(t => t.round === roundType).length;
}

/**
 * Add a new generated question to the session
 */
export function setSessionCurrentQuestion(sessionId, questionData) {
  const session = getInterviewSession(sessionId);
  if (!session) throw new Error("Session not found");

  const questionObj = {
    id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    round: session.currentRound,
    questionNumber: getRoundTurnCount(session, session.currentRound) + 1,
    maxQuestionsInRound: QUESTIONS_PER_ROUND,
    text: questionData.question,
    focusArea: questionData.focusArea || "General",
    expectedAspects: questionData.expectedAspects || [],
    generatedAt: Date.now()
  };

  session.currentQuestion = questionObj;
  session.lastActivityAt = Date.now();
  return questionObj;
}

/**
 * Record a candidate's answer and evaluation
 */
export function recordCandidateAnswer(sessionId, { questionId, answerText, speechMetrics = {} }) {
  const session = getInterviewSession(sessionId);
  if (!session) throw new Error("Session not found");

  const turn = {
    id: questionId || session.currentQuestion?.id || `turn_${Date.now()}`,
    round: session.currentRound,
    questionNumber: session.currentQuestion?.questionNumber || (session.turns.length + 1),
    question: session.currentQuestion?.text || "Unknown Question",
    focusArea: session.currentQuestion?.focusArea || "General",
    answer: answerText,
    speechMetrics: {
      durationSeconds: speechMetrics.durationSeconds || 0,
      wordCount: speechMetrics.wordCount || answerText.trim().split(/\s+/).length,
      wordsPerMinute: speechMetrics.wordsPerMinute || 0,
      fillerCount: speechMetrics.fillerCount || 0,
      pauseCount: speechMetrics.pauseCount || 0
    },
    answeredAt: Date.now()
  };

  session.turns.push(turn);
  session.currentQuestion = null;
  session.lastActivityAt = Date.now();

  const roundTurns = getRoundTurnCount(session, session.currentRound);
  const isRoundComplete = roundTurns >= QUESTIONS_PER_ROUND;

  if (isRoundComplete) {
    const isLastRound = session.currentRoundIndex >= session.availableRounds.length - 1;
    session.status = isLastRound ? "completed" : "round_complete";
  }

  return {
    turn,
    roundTurns,
    isRoundComplete,
    isSessionComplete: session.status === "completed"
  };
}

/**
 * Build conversational transcript context for LLM prompt
 */
export function getConversationTranscript(sessionId) {
  const session = getInterviewSession(sessionId);
  if (!session || session.turns.length === 0) return "No previous questions answered yet.";

  return session.turns.map((t, idx) => {
    return `[Turn ${idx + 1} - Round: ${t.round}]
Interviewer: "${t.question}"
Candidate Answer: "${t.answer}"`;
  }).join("\n\n");
}

export default {
  createInterviewSession,
  getInterviewSession,
  startInterviewRound,
  setSessionCurrentQuestion,
  recordCandidateAnswer,
  getConversationTranscript,
  isCodingApplicable,
  ROUND_TYPES,
  QUESTIONS_PER_ROUND
};
