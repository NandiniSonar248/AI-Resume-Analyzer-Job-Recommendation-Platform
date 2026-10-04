/**
 * useSocket.js — Custom React Hook for Managing Socket.io Lifecycle
 * ===================================================================
 * PURPOSE:
 *   Encapsulates the persistent WebSocket connection for live mock interviews.
 *   Handles automatic connection, room isolation by sessionId, graceful reconnection,
 *   and unmount cleanup.
 *
 * HOW IT CONNECTS:
 *   - Used by the InterviewRoom component
 *   - Connects to the backend server (e.g. http://localhost:5000)
 *   - Emits interview events (e.g. interview:join, interview:submit_answer)
 *   - Listens for server pushes (e.g. interview:question, interview:status)
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

// Determine server root URL (strip /api if present)
const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  return apiUrl.replace(/\/api\/?$/, "");
};

export default function useSocket(sessionId, autoConnect = true) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    if (!autoConnect) return;

    const socketUrl = getSocketUrl();
    const token = localStorage.getItem("token");

    // Initialize socket client
    const socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setConnectionError(null);
      if (sessionId) {
        socket.emit("interview:join", { sessionId });
      }
    });

    socket.on("connect_error", (err) => {
      setConnectionError(err.message || "Failed to connect to real-time interview service");
      setConnected(false);
    });

    socket.on("disconnect", (reason) => {
      setConnected(false);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [sessionId, autoConnect]);

  const emit = useCallback((event, data) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
      return true;
    }
    return false;
  }, []);

  const on = useCallback((event, callback) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on(event, callback);
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    connected,
    connectionError,
    emit,
    on
  };
}
