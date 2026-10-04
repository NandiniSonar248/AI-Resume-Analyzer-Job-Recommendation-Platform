/**
 * useSpeechRecognition.js — Browser-Native Speech Recognition Hook
 * =================================================================
 * PURPOSE:
 *   Wraps the Web Speech API (SpeechRecognition / webkitSpeechRecognition)
 *   to capture the candidate's spoken answers in real-time.
 *
 * HOW IT WORKS:
 *   - Continuous listening during an active answer turn.
 *   - Emits interim transcripts for live visual feedback as the user speaks.
 *   - Measures speaking duration and tracks silence/pause durations
 *     (using performance.now()) to feed the speechAnalytics service.
 *   - Provides fallback support detection for browsers without Web Speech support.
 */

import { useState, useEffect, useRef, useCallback } from "react";

export default function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const startTimeRef = useRef(0);
  const lastSpeechTimeRef = useRef(0);
  const pauseIntervalsRef = useRef([]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const now = performance.now();
      if (lastSpeechTimeRef.current > 0) {
        const pauseSec = (now - lastSpeechTimeRef.current) / 1000;
        if (pauseSec > 1.5) {
          pauseIntervalsRef.current.push(pauseSec);
        }
      }
      lastSpeechTimeRef.current = now;

      let final = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) {
          final += item[0].transcript + " ";
        } else {
          interim += item[0].transcript;
        }
      }

      if (final) {
        setTranscript((prev) => (prev ? `${prev} ${final.trim()}` : final.trim()));
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (e) => {
      // Ignore normal silence aborts
      if (e.error !== "no-speech") {
        setError(e.error);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (err) {}
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    setTranscript("");
    setInterimTranscript("");
    pauseIntervalsRef.current = [];
    startTimeRef.current = performance.now();
    lastSpeechTimeRef.current = performance.now();

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      // If already started, ignore
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) {
      return { durationSeconds: 0, pauseIntervals: [] };
    }

    try {
      recognitionRef.current.stop();
    } catch (e) {}

    setIsListening(false);
    const durationSeconds = startTimeRef.current > 0
      ? (performance.now() - startTimeRef.current) / 1000
      : 0;

    return {
      durationSeconds: Math.round(durationSeconds),
      pauseIntervals: [...pauseIntervalsRef.current]
    };
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    isListening,
    transcript,
    setTranscript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript
  };
}
