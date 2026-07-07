import { useMemo, useState } from "react";
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
    text: "Welcome to AI Academic Advising. How can I help you improve a student's performance today?",
  },
];

const AIAcademicAdvisingModule = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [query, setQuery] = useState("");

  const handleAsk = () => {
    if (!query.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      sender: "user",
      text: query.trim(),
    };
    const botMessage = {
      id: messages.length + 2,
      sender: "bot",
      text: "Based on current performance, the student should strengthen core mathematics, maintain attendance, and follow a weekly review plan. Prioritize higher-risk subjects first.",
    };

    setMessages((prev) => [...prev, newMessage, botMessage]);
    setQuery("");
  };

  const aiNotes = [
    {
      id: 1,
      title: "Time Management Plan",
      content:
        "Suggest weekly study blocks and review time for core technical subjects.",
    },
    {
      id: 2,
      title: "Course Recommendations",
      content:
        "Recommend tutoring for Calculus and Physics for students with GWA below 3.0.",
    },
  ];

  const previousSessions = [
    { id: 1, title: "Advising Session - March", status: "Completed" },
    { id: 2, title: "AI Recommendation - April", status: "Completed" },
  ];

  const chatMessages = useMemo(() => messages, [messages]);

  return (
    <ModuleShell
      title="AI Academic and Advising Module"
      description="Provide AI-assisted academic advising and personalized recommendations for students based on performance and risk profiles."
      activeKey="ai-advising"
      menuItems={moduleLinks}
    >
      <div style={{ marginBottom: "var(--space-xl)" }}>
        <div
          className={styles.moduleTitleSmall}
          style={{ marginBottom: "var(--space-lg)" }}
        >
          AI Chat Interface
        </div>
        <div
          className={styles.moduleCard}
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: "600px",
            padding: 0,
            overflow: "hidden",
          }}
        >
          <div
            className={styles.chatWindow}
            style={{
              flex: 1,
              marginBottom: 0,
              borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
              border: "none",
              borderBottom: "1px solid var(--color-border-neutral)",
            }}
          >
            {chatMessages.map((message) => (
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
          <div
            className={styles.chatInputRow}
            style={{
              marginTop: 0,
              padding: "var(--space-lg)",
              gap: "var(--space-md)",
            }}
          >
            <input
              className={styles.chatInput}
              value={query}
              placeholder="Ask how the student can improve..."
              onChange={(event) => setQuery(event.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAsk();
                }
              }}
            />
            <button className={styles.primaryButton} onClick={handleAsk}>
              Send
            </button>
          </div>
        </div>
      </div>
    </ModuleShell>
  );
};

export default AIAcademicAdvisingModule;
