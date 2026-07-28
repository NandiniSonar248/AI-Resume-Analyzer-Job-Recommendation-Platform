/**
 * AI Chat Service - Personal AI Assistant for Users
 * Helps users with resume, job search, career questions
 */

import Groq from "groq-sdk";

const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Conversation history (per user/session)
const chatHistory = new Map();

/**
 * Initialize chat session for user
 */
export function initializeChatSession(userId) {
  if (!chatHistory.has(userId)) {
    chatHistory.set(userId, []);
  }
}

/**
 * Send message to AI assistant and get response
 */
export async function chatWithAI(userId, userMessage) {
  // Initialize session if needed
  if (!chatHistory.has(userId)) {
    initializeChatSession(userId);
  }

  const history = chatHistory.get(userId);

  // Add user message to history
  history.push({
    role: "user",
    content: userMessage
  });

  // Keep only last 10 messages (context window)
  const contextMessages = history.slice(-10);

  try {
    const response = await Promise.race([
      groqClient.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a professional career coach and resume expert assistant. Help users with:
1. Resume improvement tips
2. Job search strategies
3. Interview preparation
4. Career advice
5. Salary negotiation
6. ATS optimization

RULES:
- Be concise and professional
- Give actionable advice
- Ask clarifying questions if needed
- Provide examples when helpful
- Be encouraging and positive
- Keep responses under 300 words
- Format with bullet points for clarity`
          },
          ...contextMessages
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 500
      }),
      timeout(15000) // 15 second timeout
    ]);

    const assistantMessage = response.choices[0]?.message?.content || "I couldn't process that. Please try again.";

    // Add assistant response to history
    history.push({
      role: "assistant",
      content: assistantMessage
    });

    // Keep history size manageable
    if (history.length > 50) {
      chatHistory.set(userId, history.slice(-20));
    }

    return {
      success: true,
      message: assistantMessage,
      followUpSuggestions: generateFollowUpQuestions(userMessage)
    };
  } catch (error) {
    console.warn("Chat AI error:", error.message);
    return {
      success: false,
      message: "I apologize, I'm temporarily unavailable. Please try again later.",
      error: error.message
    };
  }
}

/**
 * Generate suggested follow-up questions
 */
function generateFollowUpQuestions(userMessage) {
  const messageLower = userMessage.toLowerCase();

  if (messageLower.includes("resume") || messageLower.includes("cv")) {
    return [
      "How can I improve my ATS score?",
      "What keywords should I add?",
      "Should I use a resume template?"
    ];
  } else if (messageLower.includes("interview")) {
    return [
      "What are common interview questions?",
      "How do I prepare for technical interviews?",
      "Tips for answering behavioral questions?"
    ];
  } else if (messageLower.includes("job")) {
    return [
      "How do I find the right job?",
      "Should I apply to startups or big companies?",
      "How to negotiate salary?"
    ];
  } else if (messageLower.includes("skill")) {
    return [
      "Which skills are in high demand?",
      "How do I learn new skills quickly?",
      "Should I get certifications?"
    ];
  }

  return [
    "Tell me more about that",
    "How can I implement this?",
    "What's your opinion on this?"
  ];
}

/**
 * Clear chat history for user
 */
export function clearChatHistory(userId) {
  chatHistory.delete(userId);
}

/**
 * Get chat history for user
 */
export function getChatHistory(userId) {
  return chatHistory.get(userId) || [];
}

/**
 * Timeout helper
 */
function timeout(ms) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Chat request timeout")), ms)
  );
}
