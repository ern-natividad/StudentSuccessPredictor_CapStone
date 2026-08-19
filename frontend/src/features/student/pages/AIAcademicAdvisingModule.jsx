import { useState, useRef, useEffect } from "react";
import ModuleShell from "../../../components/Common/ModuleShell";
import styles from "../../../styles/Modules.module.css";
import { useAdvisingContext } from "../../../hooks/useAdvisingContext";
import { ROLE_QUICK_PROMPTS } from "../../../utils/advisingSnapshot";

const moduleLinks = [
  { key: "pre-enrollment", label: "Degree Recommendation", path: "/modules/pre-enrollment" },
  { key: "academic-performance", label: "Performance Forecasting", path: "/modules/academic-performance" },
  { key: "ai-advising", label: "AI Advising", path: "/modules/ai-advising" },
];

const getApiRoot = () => {
  const configured =
    import.meta.env?.VITE_API_BASE_URL || "http://localhost:5001/api";
  return configured.replace(/\/api\/?$/, "");
};

const getAuthHeaders = () => {
  const token = sessionStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const formatGpa = (value) =>
  value === null || value === undefined ? "—" : Number(value).toFixed(2);

const AIAcademicAdvisingModule = () => {
  const {
    role,
    snapshot,
    loading,
    error,
    welcomeMessage,
    accessibleStudents,
    selectedStudentUserId,
    setSelectedStudentUserId,
  } = useAdvisingContext();

  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = ROLE_QUICK_PROMPTS[role] || ROLE_QUICK_PROMPTS.student;
  const contextKey = `${role}-${selectedStudentUserId || snapshot?.studentUserId || "self"}`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  useEffect(() => {
    if (loading) return;

    setMessages([
      {
        id: 1,
        sender: "bot",
        text: welcomeMessage,
      },
    ]);
  }, [contextKey, loading, welcomeMessage]);

  const handleAsk = async (promptText = query) => {
    const cleanedPrompt = (promptText || "").trim();
    if (!cleanedPrompt || isThinking || loading || !snapshot) return;

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
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message: cleanedPrompt,
          history: conversationHistory,
          studentSnapshot: snapshot,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to receive AI response.");
      }

      const botMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: data.reply || "I couldn't process your request at this moment.",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (requestError) {
      console.error("AI Advising Communication Error:", requestError);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text:
            requestError.message ||
            "Unable to reach the AI server. Please verify that your backend server is running on port 5001.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const sidebarTitle =
    role === "student" ? "Your Academic Snapshot" : "Student Advising Snapshot";

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

          {(role === "staff" || role === "admin") && (
            <div>
              <div className={styles.aiSidebarTitle}>Select student</div>
              <select
                className={styles.aiSidebarSelect}
                value={selectedStudentUserId}
                disabled={loading || accessibleStudents.length === 0}
                onChange={(event) => setSelectedStudentUserId(event.target.value)}
              >
                {accessibleStudents.length === 0 ? (
                  <option value="">No students available</option>
                ) : (
                  accessibleStudents.map((student) => (
                    <option key={student.user_id} value={student.user_id}>
                      {student.full_name} ({student.student_id})
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          <div className={styles.aiSidebarCard}>
            <div className={styles.aiSidebarTitle}>{sidebarTitle}</div>
            {loading ? (
              <div className={styles.aiSidebarMetric}>Loading student data...</div>
            ) : error ? (
              <div className={styles.aiSidebarMetric}>{error}</div>
            ) : snapshot ? (
              <>
                <div className={styles.aiSidebarMetric}>
                  Student: {snapshot.studentName} ({snapshot.studentId})
                </div>
                <div className={styles.aiSidebarMetric}>Risk: {snapshot.riskLevel}</div>
                <div className={styles.aiSidebarMetric}>
                  Current GWA: {formatGpa(snapshot.currentGpa)} | Predicted:{" "}
                  {formatGpa(snapshot.predictedGpa)}
                </div>
                <div className={styles.aiSidebarMetric}>
                  Grades on record: {snapshot.gradeCount}
                </div>
                <div className={styles.aiSidebarMetric}>Trend: {snapshot.trend}</div>
                <div className={styles.aiSidebarMetric}>Focus: {snapshot.focusAreas}</div>
              </>
            ) : (
              <div className={styles.aiSidebarMetric}>No advising data available.</div>
            )}
          </div>

          <div className={styles.aiSidebarTitle}>Quick prompts</div>
          <div className={styles.aiQuickPromptList}>
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className={styles.aiQuickPrompt}
                disabled={isThinking || loading || !snapshot}
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
              <div className={styles.aiChatTitle}>
                {role === "student"
                  ? "How can I help with your academic plan?"
                  : "How can I help with this student's plan?"}
              </div>
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
              disabled={isThinking || loading || !snapshot}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleAsk();
                }
              }}
            />
            <button
              type="button"
              className={`${styles.aiComposerSend} ${
                isThinking ? styles.aiComposerSendLoading : ""
              }`}
              disabled={isThinking || loading || !snapshot || (!isThinking && !query.trim())}
              aria-busy={isThinking}
              aria-label={isThinking ? "Sending message" : "Send message"}
              onClick={() => handleAsk()}
            >
              {!isThinking ? "↑" : null}
            </button>
          </div>
        </div>
      </div>
    </ModuleShell>
  );
};

export default AIAcademicAdvisingModule;
