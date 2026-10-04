/**
 * useSpeechSynthesis.js — Browser-Native Voice Synthesis Hook
 * =============================================================
 * PURPOSE:
 *   Converts interviewer questions into spoken audio using browser SpeechSynthesis.
 *   Provides the authentic "interviewer speaking to you" acoustic experience.
 */

import { useState, useEffect, useRef, useCallback } from "react";

export default function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const voiceRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setIsSupported(false);
      return;
    }

    const selectBestVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      // Prefer natural English voices (Google US English, Samantha, Daniel, Microsoft Zira)
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Natural") ||
            v.name.includes("Google") ||
            v.name.includes("Premium") ||
            v.name.includes("Samantha"))
      );
      voiceRef.current = preferred || voices.find((v) => v.lang.startsWith("en")) || voices[0];
    };

    selectBestVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = selectBestVoice;
    }

    return () => {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    };
  }, []);

  const speak = useCallback((text, onEndCallback) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(text);
    if (voiceRef.current) {
      utterance.voice = voiceRef.current;
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEndCallback) onEndCallback();
    };
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isSpeaking,
    isSupported,
    speak,
    stop
  };
}
