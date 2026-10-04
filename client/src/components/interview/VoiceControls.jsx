import React, { useState, useEffect } from "react";

/**
 * VoiceControls — Phase 4 Component
 * =====================================
 * Provides interactive voice input with live transcription, recording timer,
 * verbal wave pulse, and manual text editing fallback.
 */
export default function VoiceControls({
  isListening,
  transcript,
  interimTranscript,
  onStartListening,
  onStopListening,
  onSubmitAnswer,
  onTextChange,
  isSupported = true,
  disabled = false
}) {
  const [seconds, setSeconds] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isListening) {
      setSeconds(0);
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isListening]);

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleMicToggle = () => {
    if (isListening) {
      onStopListening();
    } else {
      setIsTyping(false);
      onStartListening();
    }
  };

  const currentText = transcript + (interimTranscript ? ` ${interimTranscript}` : "");

  return (
    <div className="voice-controls-panel">
      {/* Mic Status & Wave Visualizer */}
      <div className="mic-action-row">
        <button
          className={`mic-button ${isListening ? "listening" : ""}`}
          onClick={handleMicToggle}
          disabled={disabled || !isSupported}
          title={isListening ? "Click to stop recording" : "Click to speak your answer"}
        >
          <span className="mic-icon">{isListening ? "⏹️" : "🎙️"}</span>
          <span className="mic-label">
            {isListening ? `Recording (${formatTimer(seconds)})` : "Click Mic to Answer"}
          </span>
        </button>

        {isListening && (
          <div className="audio-wave-bars">
            <span className="wave-bar bar-1"></span>
            <span className="wave-bar bar-2"></span>
            <span className="wave-bar bar-3"></span>
            <span className="wave-bar bar-4"></span>
            <span className="wave-bar bar-5"></span>
          </div>
        )}

        <button
          className="btn-toggle-type"
          onClick={() => setIsTyping(!isTyping)}
          type="button"
        >
          {isTyping ? "🎙️ Use Voice" : "⌨️ Type Answer"}
        </button>
      </div>

      {!isSupported && (
        <div className="speech-unsupported-notice">
          ℹ️ Your browser does not support Web Speech voice input. You can type your answers below.
        </div>
      )}

      {/* Answer Editor / Transcription Box */}
      <div className="transcription-box">
        <label className="transcription-label">
          {isListening ? "🔴 Listening... (speech will appear here live):" : "Your Answer:"}
        </label>
        <textarea
          className="transcription-textarea"
          rows={4}
          placeholder="Speak into your microphone or type your response here..."
          value={currentText}
          onChange={(e) => onTextChange(e.target.value)}
          disabled={disabled}
        />

        <div className="transcription-footer">
          <span className="word-count-indicator">
            {currentText.trim() ? currentText.trim().split(/\s+/).length : 0} words
          </span>

          <button
            className="btn-submit-answer"
            onClick={onSubmitAnswer}
            disabled={disabled || !currentText.trim() || isListening}
          >
            Submit Answer ➔
          </button>
        </div>
      </div>
    </div>
  );
}
