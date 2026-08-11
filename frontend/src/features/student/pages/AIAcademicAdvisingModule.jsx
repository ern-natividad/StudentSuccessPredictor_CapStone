import { useState } from "react";
import ModuleShell from "../../../components/Common/ModuleShell";
import styles from "../../../styles/Modules.module.css";

const moduleLinks = [
  {
    key: "pre-enrollment",
    label: "Degree Recommendation",
    path: "/modules/pre-enrollment",
  },
  {
    key: "academic-performance",
    label: "Performance Forecasting",
    path: "/modules/academic-performance",
  },
  {
    key: "ai-advising",
    label: "AI Advising",
    path: "/modules/ai-advising",
  },
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

const AIAcademicAdvisingModule = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [query, setQuery] = useState("");

  const handleAsk = (promptText = query) => {
    const cleanedPrompt = (promptText || "").trim();
    if (!cleanedPrompt) return;

    const newMessage = {
      id: Date.now(),
      sender: "user",
      text: cleanedPrompt,
    };

    const botMessage = {
      id: Date.now() + 1,
      sender: "bot",
      text: "Based on the current student performance profile, I recommend focusing on attendance consistency, subject-level support in high-risk courses, and a weekly review schedule with measurable checkpoints.",
    };

    setMessages((prev) => [...prev, newMessage, botMessage]);
    setQuery("");
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
            <div className={styles.aiSidebarMetric}>Risk: Medium</div>
            <div className={styles.aiSidebarMetric}>Focus: Attendance & Core Subjects</div>
          </div>
          <div className={styles.aiSidebarTitle}>Quick prompts</div>
          <div className={styles.aiQuickPromptList}>
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className={styles.aiQuickPrompt}
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
            <div className={styles.aiChatStatus}>Online</div>
          </div>

          <div className={styles.chatWindow}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.chatMessage} ${
                  message.sender === "user" ? styles.chatUser : styles.chatBot
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className={styles.aiComposer}>
            <button type="button" className={styles.aiComposerPlus}>
              +
            </button>
            <input
              className={styles.aiComposerInput}
              value={query}
              placeholder="Write a message here..."
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAsk();
                }
              }}
            />
            <button type="button" className={styles.aiComposerSend} onClick={() => handleAsk()}>
              ↑
            </button>
          </div>
        </div>
      </div>
    </ModuleShell>
  );
};

export default AIAcademicAdvisingModule;
