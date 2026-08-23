import { useState, useRef, useEffect } from "react";
import { FiCheck, FiCopy, FiEdit2, FiSend, FiX } from "react-icons/fi";
import ModuleShell from "../../../components/Common/ModuleShell";
import { useToast } from "../../../components/Common/Toast";
import styles from "../../../styles/Modules.module.css";
import { useAdvisingContext } from "../../../hooks/useAdvisingContext";
import { ROLE_QUICK_PROMPTS } from "../../../utils/advisingSnapshot";
import { renderChatMarkdown } from "../../../utils/renderChatMarkdown";

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
  const toast = useToast();
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
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const messagesEndRef = useRef(null);
  const composerInputRef = useRef(null);
  const editTextareaRef = useRef(null);

  const quickPrompts = ROLE_QUICK_PROMPTS[role] || ROLE_QUICK_PROMPTS.student;
  const contextKey = `${role}-${selectedStudentUserId || snapshot?.studentUserId || "self"}`;
  const canSend = !isThinking && !loading && Boolean(snapshot);

  const resizeComposer = () => {
    const field = composerInputRef.current;
    if (!field) return;
    field.style.height = "auto";
    const nextHeight = Math.min(field.scrollHeight, 160);
    field.style.height = `${Math.max(nextHeight, 42)}px`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  useEffect(() => {
    resizeComposer();
  }, [query]);

  useEffect(() => {
    if (loading) return;

    setMessages([
      {
        id: 1,
        sender: "bot",
        text: welcomeMessage,
      },
    ]);
    setEditingMessageId(null);
    setEditDraft("");
    setQuery("");
  }, [contextKey, loading, welcomeMessage]);

  useEffect(() => {
    if (!editingMessageId) return;

    const frameId = window.requestAnimationFrame(() => {
      const field = editTextareaRef.current;
      if (!field) return;
      field.focus();
      const length = field.value.length;
      field.setSelectionRange(length, length);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [editingMessageId]);

  const handleCopyMessage = async (message) => {
    try {
      await navigator.clipboard.writeText(message.text || "");
      setCopiedMessageId(message.id);
      toast.success("Copied to clipboard.");
      window.setTimeout(() => {
        setCopiedMessageId((current) =>
          current === message.id ? null : current,
        );
      }, 1600);
    } catch {
      toast.error("Unable to copy message.");
    }
  };

  const handleStartEdit = (message) => {
    if (!canSend || message.sender !== "user") return;
    setEditingMessageId(message.id);
    setEditDraft(message.text || "");
    setQuery("");
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditDraft("");
  };

  const requestAiReply = async ({ prompt, historyMessages }) => {
    const response = await fetch(`${getApiRoot()}/api/v1/advising/chat`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        message: prompt,
        history: historyMessages,
        studentSnapshot: snapshot,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "Failed to receive AI response.");
    }

    return data.reply || "I couldn't process your request at this moment.";
  };

  const handleAsk = async (promptText = query) => {
    const cleanedPrompt = (promptText || "").trim();
    if (!cleanedPrompt || !canSend) return;

    // If an inline edit is open, prefer completing that edit instead.
    if (editingMessageId) {
      await handleSaveEdit();
      return;
    }

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: cleanedPrompt,
    };

    const historyForApi = messages.filter(
      (message, index) => !(index === 0 && message.sender === "bot"),
    );

    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setIsThinking(true);

    try {
      const reply = await requestAiReply({
        prompt: cleanedPrompt,
        historyMessages: historyForApi,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: reply,
        },
      ]);
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

  const handleSaveEdit = async () => {
    const cleanedPrompt = editDraft.trim();
    if (!cleanedPrompt) {
      toast.error("Edited prompt cannot be empty.");
      return;
    }
    if (!canSend || !editingMessageId) return;

    const editIndex = messages.findIndex(
      (message) => message.id === editingMessageId,
    );
    if (editIndex < 0) {
      handleCancelEdit();
      return;
    }

    const historyBeforeEdit = messages
      .slice(0, editIndex)
      .filter((message, index) => !(index === 0 && message.sender === "bot"));

    const updatedUserMessage = {
      id: editingMessageId,
      sender: "user",
      text: cleanedPrompt,
    };

    setMessages((prev) => [...prev.slice(0, editIndex), updatedUserMessage]);
    setEditingMessageId(null);
    setEditDraft("");
    setQuery("");
    setIsThinking(true);

    try {
      const reply = await requestAiReply({
        prompt: cleanedPrompt,
        historyMessages: historyBeforeEdit,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: reply,
        },
      ]);
    } catch (requestError) {
      console.error("AI Advising Edit Error:", requestError);
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
                disabled={!canSend || Boolean(editingMessageId)}
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
            {messages.map((message) => {
              const isUser = message.sender === "user";
              const isCopied = copiedMessageId === message.id;
              const isEditing = editingMessageId === message.id;

              return (
                <div
                  key={message.id}
                  className={`${styles.chatMessageRow} ${
                    isUser ? styles.chatMessageRowUser : styles.chatMessageRowBot
                  }`}
                >
                  {isEditing ? (
                    <div className={`${styles.chatMessage} ${styles.chatUser} ${styles.chatEditPanel}`}>
                      <textarea
                        ref={editTextareaRef}
                        className={styles.chatEditTextarea}
                        value={editDraft}
                        rows={Math.min(8, Math.max(3, editDraft.split("\n").length + 1))}
                        disabled={isThinking}
                        onChange={(event) => setEditDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Escape") {
                            event.preventDefault();
                            handleCancelEdit();
                          }
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            handleSaveEdit();
                          }
                        }}
                      />
                      <div className={styles.chatEditActions}>
                        <button
                          type="button"
                          className={styles.chatActionButton}
                          title="Cancel edit"
                          aria-label="Cancel edit"
                          disabled={isThinking}
                          onClick={handleCancelEdit}
                        >
                          <FiX size={15} aria-hidden="true" />
                          <span>Cancel</span>
                        </button>
                        <button
                          type="button"
                          className={`${styles.chatActionButton} ${styles.chatEditSaveButton}`}
                          title="Save and resend"
                          aria-label="Save and resend"
                          disabled={isThinking || !editDraft.trim()}
                          onClick={handleSaveEdit}
                        >
                          <FiSend size={15} aria-hidden="true" />
                          <span>Save &amp; Resend</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`${styles.chatMessage} ${
                          isUser ? styles.chatUser : styles.chatBot
                        } ${!isUser ? styles.chatMarkdown : ""}`}
                      >
                        {isUser ? message.text : renderChatMarkdown(message.text)}
                      </div>

                      <div className={styles.chatMessageActions}>
                        {isUser ? (
                          <>
                            <button
                              type="button"
                              className={styles.chatActionButton}
                              title="Edit prompt"
                              aria-label="Edit prompt"
                              disabled={!canSend || Boolean(editingMessageId)}
                              onClick={() => handleStartEdit(message)}
                            >
                              <FiEdit2 size={15} aria-hidden="true" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              className={`${styles.chatActionButton} ${
                                isCopied ? styles.chatActionButtonActive : ""
                              }`}
                              title="Copy prompt"
                              aria-label="Copy prompt"
                              onClick={() => handleCopyMessage(message)}
                            >
                              {isCopied ? (
                                <FiCheck size={15} aria-hidden="true" />
                              ) : (
                                <FiCopy size={15} aria-hidden="true" />
                              )}
                              <span>{isCopied ? "Copied" : "Copy"}</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className={`${styles.chatActionButton} ${
                              isCopied ? styles.chatActionButtonActive : ""
                            }`}
                            title="Copy response"
                            aria-label="Copy response"
                            onClick={() => handleCopyMessage(message)}
                          >
                            {isCopied ? (
                              <FiCheck size={15} aria-hidden="true" />
                            ) : (
                              <FiCopy size={15} aria-hidden="true" />
                            )}
                            <span>{isCopied ? "Copied" : "Copy"}</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
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
            <textarea
              ref={composerInputRef}
              className={styles.aiComposerInput}
              value={query}
              rows={1}
              placeholder={
                editingMessageId
                  ? "Finish or cancel the edit above..."
                  : "Write a message here..."
              }
              disabled={!canSend || Boolean(editingMessageId)}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleAsk();
                }
              }}
            />
            <button
              type="button"
              className={`${styles.aiComposerSend} ${
                isThinking ? styles.aiComposerSendLoading : ""
              }`}
              disabled={
                !canSend ||
                Boolean(editingMessageId) ||
                (!isThinking && !query.trim())
              }
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
