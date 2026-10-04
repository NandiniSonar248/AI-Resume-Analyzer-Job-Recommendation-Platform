/**
 * interviewSocket.js — Real-Time Interview Socket Handler
 * ========================================================
 * PURPOSE:
 *   Manages the bidirectional WebSocket connection for live mock interviews.
 *   Enables instantaneous back-and-forth conversation, question streaming,
 *   and real-time speech telemetry without the overhead of HTTP polling.
 *
 * SOCKET LIFECYCLE & ARCHITECTURE:
 *   1. Connection & Handshake:
 *      Client connects via ws:// (or wss://). Socket.io performs the initial
 *      HTTP 101 upgrade. CORS is strictly locked to process.env.FRONTEND_URL.
 *   2. Session Room Isolation:
 *      Each interview instance has a unique `sessionId`. Client emits
 *      `interview:join` with sessionId. The socket joins that room, ensuring
 *      data from one candidate's interview is strictly isolated from others.
 *   3. Event-Driven Turns:
 *      Client emits `interview:answer` -> Server emits `interview:thinking`
 *      -> questionGenerator produces next question -> Server emits `interview:question`.
 *   4. Disconnect Handling:
 *      Graceful cleanup on tab close or network drop.
 *
 * WHY SOCKET.IO INSTEAD OF REST FOR INTERVIEWS:
 *   - Low Latency: Persistent TCP connection avoids TLS/TCP renegotiation (~150ms saved per turn).
 *   - Push Capability: Server can proactively trigger timeouts, hints, and interviewer voice responses.
 *   - Telemetry Streaming: User speech events (pauses, filler words) can be streamed as they occur.
 */

import { Server } from "socket.io";
import logger from "../utils/logger.js";
import {
  getInterviewSession,
  startInterviewRound,
  setSessionCurrentQuestion,
  recordCandidateAnswer,
  getConversationTranscript
} from "../services/interview/interviewOrchestrator.js";
import { generateNextQuestion } from "../services/interview/questionGenerator.js";
import { analyzeSpeechMetrics } from "../services/interview/speechAnalytics.js";
import { generateSessionReport } from "../services/interview/sessionScorer.js";

let io = null;

export function initInterviewSocket(httpServer, allowedOrigin) {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigin || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 30000,
    pingInterval: 25000
  });

  io.on("connection", (socket) => {
    logger.info(`🔌 [Socket.io] Client connected: ${socket.id}`);

    // Join isolated interview session room
    socket.on("interview:join", ({ sessionId, userId }) => {
      if (!sessionId) {
        return socket.emit("interview:error", { message: "sessionId is required to join" });
      }
      socket.join(sessionId);
      socket.data.sessionId = sessionId;
      socket.data.userId = userId;
      logger.info(`🎙️ [Socket.io] Socket ${socket.id} joined interview session: ${sessionId}`);
      socket.emit("interview:joined", { sessionId, socketId: socket.id, timestamp: Date.now() });
    });

    // Start a specific interview round
    socket.on("interview:start_round", async ({ sessionId, roundType }) => {
      try {
        const session = getInterviewSession(sessionId);
        if (!session) {
          return socket.emit("interview:error", { message: "Session not found or expired" });
        }

        startInterviewRound(sessionId, roundType);
        socket.emit("interview:status", { status: "generating_question", roundType });

        // Generate opening question for this round
        const questionData = await generateNextQuestion({
          roundType,
          questionNumber: 1,
          totalQuestions: 3,
          jobDescription: session.jobDescription,
          resumeText: session.resumeText,
          conversationHistory: getConversationTranscript(sessionId),
          lastAnswer: ""
        });

        const currentQ = setSessionCurrentQuestion(sessionId, questionData);
        io.to(sessionId).emit("interview:question", {
          question: currentQ,
          currentRound: roundType,
          sessionStatus: session.status
        });
      } catch (err) {
        logger.error(`Error in interview:start_round: ${err.message}`);
        socket.emit("interview:error", { message: "Failed to start interview round" });
      }
    });

    // Client submits answer to current question
    socket.on("interview:submit_answer", async ({ sessionId, questionId, answerText, speechMetrics = {} }) => {
      try {
        const session = getInterviewSession(sessionId);
        if (!session) {
          return socket.emit("interview:error", { message: "Session not found" });
        }

        // Analyze speech delivery metrics
        const analyzedSpeech = analyzeSpeechMetrics(
          answerText,
          speechMetrics.durationSeconds,
          speechMetrics.pauses || []
        );

        // Record the turn in session orchestrator
        const result = recordCandidateAnswer(sessionId, {
          questionId,
          answerText,
          speechMetrics: analyzedSpeech
        });

        // Notify client answer was recorded with speech feedback
        socket.emit("interview:answer_recorded", {
          turn: result.turn,
          speechMetrics: analyzedSpeech,
          isRoundComplete: result.isRoundComplete,
          isSessionComplete: result.isSessionComplete
        });

        // If session is complete -> Generate final report
        if (result.isSessionComplete) {
          socket.emit("interview:status", { status: "compiling_report" });
          const report = await generateSessionReport(session);
          io.to(sessionId).emit("interview:session_report", { report });
          return;
        }

        // If round is complete -> Prompt user to advance to next round
        if (result.isRoundComplete) {
          io.to(sessionId).emit("interview:round_completed", {
            completedRound: session.currentRound,
            availableRounds: session.availableRounds,
            nextRoundIndex: session.currentRoundIndex + 1,
            nextRound: session.availableRounds[session.currentRoundIndex + 1] || null
          });
          return;
        }

        // Otherwise -> Generate next ADAPTIVE follow-up question
        socket.emit("interview:status", { status: "generating_followup" });
        const nextQData = await generateNextQuestion({
          roundType: session.currentRound,
          questionNumber: result.roundTurns + 1,
          totalQuestions: 3,
          jobDescription: session.jobDescription,
          resumeText: session.resumeText,
          conversationHistory: getConversationTranscript(sessionId),
          lastAnswer: answerText
        });

        const nextQ = setSessionCurrentQuestion(sessionId, nextQData);
        io.to(sessionId).emit("interview:question", {
          question: nextQ,
          currentRound: session.currentRound,
          sessionStatus: session.status
        });
      } catch (err) {
        logger.error(`Error in interview:submit_answer: ${err.message}`);
        socket.emit("interview:error", { message: "Failed to process interview answer" });
      }
    });

    // Request final session report explicitly
    socket.on("interview:request_report", async ({ sessionId }) => {
      try {
        const session = getInterviewSession(sessionId);
        if (!session) return socket.emit("interview:error", { message: "Session not found" });

        socket.emit("interview:status", { status: "compiling_report" });
        const report = await generateSessionReport(session);
        io.to(sessionId).emit("interview:session_report", { report });
      } catch (err) {
        logger.error(`Error in interview:request_report: ${err.message}`);
        socket.emit("interview:error", { message: "Failed to generate report" });
      }
    });

    // Disconnect
    socket.on("disconnect", (reason) => {
      logger.info(`🔌 [Socket.io] Client disconnected: ${socket.id} (reason: ${reason})`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io has not been initialized yet!");
  }
  return io;
}

export default { initInterviewSocket, getIO };
