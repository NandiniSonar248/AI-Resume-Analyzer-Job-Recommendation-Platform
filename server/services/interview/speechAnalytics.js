/**
 * speechAnalytics.js — Speech Metrics & Verbal Telemetry Analyzer
 * ===================================================================
 * PURPOSE:
 *   Analyzes candidate verbal delivery and speech habits during mock interviews:
 *     - Filler word detection ("um", "uh", "like", "you know", "basically")
 *     - Speaking pace (Words Per Minute — WPM)
 *     - Pause pattern & hesitation frequency
 *     - Verbal delivery health score (0-100)
 *
 * HOW METRICS ARE DERIVED FROM WEB SPEECH API DATA:
 *   - The browser Web Speech API (`SpeechRecognition`) provides transcription
 *     strings along with speech event timestamps (`performance.now()`).
 *   - Speaking Pace (WPM): `(totalWords / durationSeconds) * 60`.
 *     Optimal conversational pace is 125-160 WPM.
 *   - Filler Words: Tokenized match against standard hesitation markers.
 *   - Pauses: Gaps between spoken utterances exceeding 2.0 seconds.
 */

const FILLER_PATTERNS = [
  { word: "um", regex: /\bum+\b/gi },
  { word: "uh", regex: /\buh+\b/gi },
  { word: "like", regex: /\blike\b/gi },
  { word: "you know", regex: /\byou know\b/gi },
  { word: "basically", regex: /\bbasically\b/gi },
  { word: "actually", regex: /\bactually\b/gi },
  { word: "sort of", regex: /\bsort of\b/gi },
  { word: "kind of", regex: /\bkind of\b/gi },
  { word: "i mean", regex: /\bi mean\b/gi },
  { word: "literally", regex: /\bliterally\b/gi }
];

/**
 * Analyze a single answer's verbal delivery
 */
export function analyzeSpeechMetrics(transcript = "", durationSeconds = 0, pauseIntervals = []) {
  const cleanText = transcript.trim();
  const words = cleanText ? cleanText.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  // Safe duration calculation (default to minimum 1s to prevent division by 0)
  const duration = Math.max(durationSeconds, wordCount > 0 ? (wordCount / 2.5) : 1);
  const wordsPerMinute = Math.round((wordCount / duration) * 60);

  // Detect and count fillers
  const detectedFillers = {};
  let totalFillers = 0;

  for (const { word, regex } of FILLER_PATTERNS) {
    const matches = cleanText.match(regex);
    if (matches && matches.length > 0) {
      detectedFillers[word] = matches.length;
      totalFillers += matches.length;
    }
  }

  // Calculate filler frequency (fillers per 100 words)
  const fillerRatio = wordCount > 0 ? (totalFillers / wordCount) * 100 : 0;

  // Rate speaking pace
  let paceRating = "Optimal";
  let paceFeedback = "Well-paced and easy to follow (125–160 WPM).";
  if (wordsPerMinute < 100) {
    paceRating = "Too Slow";
    paceFeedback = "Speaking pace is on the slower side (<100 WPM). Aim for a slightly more energetic delivery.";
  } else if (wordsPerMinute > 170) {
    paceRating = "Too Fast";
    paceFeedback = "Speaking pace is hurried (>170 WPM). Remember to pause between key ideas to let the interviewer absorb your points.";
  }

  // Evaluate pause patterns
  const significantPauses = pauseIntervals.filter(p => p >= 2.0).length;

  // Compute verbal delivery score (out of 100)
  let deliveryScore = 95;
  deliveryScore -= Math.min(totalFillers * 4, 30); // Max -30 for excessive fillers
  if (paceRating !== "Optimal") deliveryScore -= 15;
  if (significantPauses > 3) deliveryScore -= 10;
  deliveryScore = Math.max(Math.min(deliveryScore, 100), 40);

  return {
    wordCount,
    durationSeconds: Math.round(duration),
    wordsPerMinute,
    paceRating,
    paceFeedback,
    totalFillers,
    fillerRatio: Math.round(fillerRatio * 10) / 10,
    detectedFillers,
    significantPauses,
    deliveryScore
  };
}

/**
 * Aggregate metrics across all turns in an entire interview session
 */
export function aggregateSessionSpeech(turns = []) {
  if (!turns || turns.length === 0) {
    return {
      overallWPM: 135,
      totalWords: 0,
      totalDurationMinutes: 0,
      totalFillers: 0,
      fillerBreakdown: {},
      averageDeliveryScore: 85,
      summary: "No spoken responses recorded."
    };
  }

  let totalWords = 0;
  let totalDurationSec = 0;
  let totalFillers = 0;
  const fillerBreakdown = {};
  let totalScore = 0;

  turns.forEach(turn => {
    const sm = turn.speechMetrics || {};
    const wc = sm.wordCount || (turn.answer ? turn.answer.split(/\s+/).length : 0);
    const dur = sm.durationSeconds || Math.max(wc / 2.5, 1);
    const fillers = sm.fillerCount || 0;

    totalWords += wc;
    totalDurationSec += dur;
    totalFillers += fillers;
    totalScore += (sm.deliveryScore || 85);
  });

  const durationMin = Math.round((totalDurationSec / 60) * 10) / 10;
  const overallWPM = totalDurationSec > 0 ? Math.round((totalWords / totalDurationSec) * 60) : 135;
  const averageDeliveryScore = Math.round(totalScore / turns.length);

  return {
    overallWPM,
    totalWords,
    totalDurationMinutes: durationMin,
    totalFillers,
    averageDeliveryScore,
    summary: `Spoke ${totalWords} total words over ${durationMin} minutes at ${overallWPM} WPM with ${totalFillers} verbal fillers detected.`
  };
}

export default { analyzeSpeechMetrics, aggregateSessionSpeech };
