import { useState, useRef, useEffect } from "react";
import ModuleShell from "../../../components/Common/ModuleShell";
import styles from "../../../styles/Modules.module.css";

const moduleLinks = [
  { key: "pre-enrollment", label: "Degree Recommendation", path: "/modules/pre-enrollment" },
  { key: "academic-performance", label: "Performance Forecasting", path: "/modules/academic-performance" },
  { key: "ai-advising", label: "AI Advising", path: "/modules/ai-advising" },
];

const initialMessages = [
  {
    id: 1,
    sender: "bot",
    text: "Welcome back. I can help you review academic risk, suggest next steps, and prepare a student-specific advising plan.",
  },
];

const quickPrompts = [
  "Summarize this student's risk level",
  "What should the student improve first?",
  "Create a weekly advising plan",
];

const getApiRoot = () => {
  const configured =
    import.meta.env?.VITE_API_BASE_URL || "http://localhost:5001/api";
  return configured.replace(/\/api\/?$/, "");
};

const AIAcademicAdvisingModule = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [query, setQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  // Student snapshot profile passed into AI context
  const studentSnapshot = {
    studentId: "STU-2026-089",
    riskLevel: "Medium",
    focusAreas: "Attendance & Core Subjects (Calculus, Circuits)",
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleAsk = async (promptText = query) => {
    const cleanedPrompt = (promptText || "").trim();
    if (!cleanedPrompt || isThinking) return;

    // 1. Add user query to chat state
    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: cleanedPrompt,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setIsThinking(true);

    try {
      const conversationHistory = messages.filter(
        (message, index) => !(index === 0 && message.sender === "bot"),
      );

      const response = await fetch(`${getApiRoot()}/api/v1/advising/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: cleanedPrompt,
          history: conversationHistory,
          studentSnapshot: studentSnapshot,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to receive AI response.");
      }

      // 3. Append Gemini AI reply to chat state
      const botMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: data.reply || "I couldn't process your request at this moment.",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("AI Advising Communication Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text:
            error.message ||
            "Unable to reach the AI server. Please verify that your backend server is running on port 5001.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <ModuleShell
      title="AI Academic and Advising Module"
      description="Provide AI-assisted academic advising and personalized recommendations for students based on performance and risk profiles."
      activeKey="ai-advising"
      menuItems={moduleLinks}
    >
      <div className={styles.aiChatLayout}>
        <aside className={styles.aiSidebar}>
          <div className={styles.aiSidebarLabel}>AI Advisor</div>
          <div className={styles.aiSidebarCard}>
            <div className={styles.aiSidebarTitle}>Student Support Snapshot</div>
            <div className={styles.aiSidebarMetric}>Risk: {studentSnapshot.riskLevel}</div>
            <div className={styles.aiSidebarMetric}>Focus: {studentSnapshot.focusAreas}</div>
          </div>
          <div className={styles.aiSidebarTitle}>Quick prompts</div>
          <div className={styles.aiQuickPromptList}>
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className={styles.aiQuickPrompt}
                disabled={isThinking}
                onClick={() => handleAsk(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        </aside>

        <div className={styles.aiChatPanel}>
          <div className={styles.aiChatHeader}>
            <div>
              <div className={styles.aiChatEyebrow}>Academic Advising AI</div>
              <div className={styles.aiChatTitle}>How can I help today?</div>
            </div>
          </div>

          <div className={styles.chatWindow}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.chatMessage} ${
                  message.sender === "user" ? styles.chatUser : styles.chatBot
                }`}
                style={{ whiteSpace: "pre-wrap" }}
              >
                {message.text}
              </div>
            ))}
            {isThinking && (
              <div 
                className={`${styles.chatMessage} ${styles.chatBot}`} 
                style={{ fontStyle: "italic", opacity: 0.7 }}
              >
                AI Adviser is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.aiComposer}>
            <input
              className={styles.aiComposerInput}
              value={query}
              placeholder="Write a message here..."
              disabled={isThinking}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAsk();
                }
              }}
            />
            <button
              type="button"
              className={styles.aiComposerSend}
              disabled={isThinking || !query.trim()}
              onClick={() => handleAsk()}
            >
              ↑
            </button>
          </div>
        </div>
      </div>
    </ModuleShell>
  );
};

export default AIAcademicAdvisingModule;