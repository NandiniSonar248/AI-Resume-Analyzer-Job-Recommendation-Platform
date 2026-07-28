import { useState, useRef, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function AIChat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: "👋 Hi! I'm your AI career coach. I can help with resume tips, job search advice, interview prep, and career questions. What would you like help with?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message to AI
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      role: "user",
      content: input,
      timestamp: new Date()
    };
    setMessages([...messages, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE}/chat/message`,
        { message: input },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      if (response.data.success) {
        const assistantMessage = {
          id: messages.length + 2,
          role: "assistant",
          content: response.data.message,
          followUp: response.data.followUpQuestions,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);

        if (!isOpen) {
          setUnreadCount(unreadCount + 1);
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to get response. Try again.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Clear chat
  const clearChat = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${API_BASE}/chat/history`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );
      setMessages([
        {
          id: 1,
          role: "assistant",
          content: "👋 Chat cleared! How can I help you today?",
          timestamp: new Date()
        }
      ]);
      toast.success("Chat cleared");
    } catch (error) {
      toast.error("Failed to clear chat");
    }
  };

  // Quick question handler
  const askQuickQuestion = (question) => {
    setInput(question);
  };

  if (!isOpen) {
    return (
      <div className="ai-chat-button" onClick={() => {
        setIsOpen(true);
        setUnreadCount(0);
      }}>
        <div className="chat-icon">🤖</div>
        <div className="chat-label">AI Coach</div>
        {unreadCount > 0 && <div className="unread-badge">{unreadCount}</div>}
      </div>
    );
  }

  return (
    <div className="ai-chat-window">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-title">
          <span className="chat-icon">🤖</span>
          AI Career Coach
        </div>
        <div className="chat-actions">
          <button onClick={clearChat} title="Clear chat" className="clear-btn">
            🗑️
          </button>
          <button onClick={() => setIsOpen(false)} className="close-btn">
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === "user" ? "👤" : "🤖"}
            </div>
            <div className="message-content">
              <div className="message-text">{msg.content}</div>

              {/* Follow-up suggestions */}
              {msg.followUp && msg.role === "assistant" && (
                <div className="followup-suggestions">
                  {msg.followUp.map((q, i) => (
                    <button
                      key={i}
                      className="suggestion-btn"
                      onClick={() => askQuickQuestion(q)}
                    >
                      💬 {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about resumes, jobs, interviews..."
          disabled={loading}
          className="chat-input"
        />
        <button type="submit" disabled={loading} className="send-btn">
          {loading ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}

// CSS for chat component
const chatStyles = `
.ai-chat-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50px;
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  z-index: 99;
}

.ai-chat-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
}

.ai-chat-button .chat-icon {
  font-size: 20px;
}

.ai-chat-button .unread-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.ai-chat-window {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 380px;
  max-height: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 5px 40px rgba(0, 0, 0, 0.16);
  display: flex;
  flex-direction: column;
  z-index: 100;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px;
  border-radius: 12px 12px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.chat-actions {
  display: flex;
  gap: 8px;
}

.clear-btn, .close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.clear-btn:hover, .close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  display: flex;
  gap: 10px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  justify-content: flex-end;
}

.message-avatar {
  font-size: 20px;
  flex-shrink: 0;
}

.message-content {
  max-width: 80%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-text {
  background: #f0f0f0;
  padding: 10px 14px;
  border-radius: 12px;
  line-height: 1.4;
  font-size: 14px;
}

.message.user .message-text {
  background: #667eea;
  color: white;
}

.followup-suggestions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.suggestion-btn {
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px 12px;
  text-align: left;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.suggestion-btn:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.typing-indicator {
  display: flex;
  gap: 4px;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  background: #999;
  border-radius: 50%;
  animation: bounce 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 80%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-8px);
  }
}

.chat-input-form {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #eee;
}

.chat-input {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
  transition: border 0.2s;
}

.chat-input:focus {
  border-color: #667eea;
}

.send-btn {
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: #5568d3;
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .ai-chat-window {
    width: calc(100% - 20px);
    max-height: 80vh;
  }
}
`;
