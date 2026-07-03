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
    key: "what-if-simulator",
    label: "What-If Simulator",
    path: "/modules/what-if-simulator",
  },
  {
    key: "ai-advising",
    label: "AI Advising",
    path: "/modules/ai-advising",
  },
];

const initialMessages = [
  { id: 1, sender: "bot", text: "Welcome to AI Academic Advising. How can I help you improve a student's performance today?" },
];

const AIAcademicAdvisingModule = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [query, setQuery] = useState("");

  const handleAsk = () => {
    if (!query.trim()) return;

    const newMessage = { id: messages.length + 1, sender: "user", text: query.trim() };
    const botMessage = {
      id: messages.length + 2,
      sender: "bot",
      text: "Based on current performance, the student should strengthen core mathematics, maintain attendance, and follow a weekly review plan. Prioritize higher-risk subjects first.",
    };

    setMessages((prev) => [...prev, newMessage, botMessage]);
    setQuery("");
  };

  const aiNotes = [
    { id: 1, title: "Time Management Plan", content: "Suggest weekly study blocks and review time for core technical subjects." },
    { id: 2, title: "Course Recommendations", content: "Recommend tutoring for Calculus and Physics for students with GWA below 3.0." },
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
      <div className={styles.sectionGrid}>
        <div className={styles.moduleCard}>
          <div className={styles.moduleTitleSmall}>Student Profile Summary</div>
          <div className={styles.infoBlock}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Academic Performance</span>
              <span className={styles.infoValue}>3.18 GWA</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Risk Level</span>
              <span className={`${styles.statusChip} ${styles.statusHigh}`}>High</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Attendance Summary</span>
              <span className={styles.infoValue}>88%</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Strengths</span>
              <span className={styles.infoValue}>Analytical thinking, lab work</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Weaknesses</span>
              <span className={styles.infoValue}>Time management, math fundamentals</span>
            </div>
          </div>
        </div>

        <div className={styles.moduleCard}>
          <div className={styles.moduleTitleSmall}>Personalized Recommendations</div>
          <div className={styles.infoBlock}>
            {aiNotes.map((note) => (
              <div key={note.id} className={styles.infoRow}>
                <span className={styles.infoLabel}>{note.title}</span>
                <span className={styles.infoValue}>{note.content}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.sectionGrid}>
        <div className={styles.moduleCard}>
          <div className={styles.moduleTitleSmall}>AI Chat Interface</div>
          <div className={styles.chatWindow}>
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
          <div className={styles.chatInputRow}>
            <input
              className={styles.chatInput}
              value={query}
              placeholder="Ask how the student can improve..."
              onChange={(event) => setQuery(event.target.value)}
            />
            <button className={styles.primaryButton} onClick={handleAsk}>
              Send
            </button>
          </div>
        </div>

        <div className={styles.moduleCard}>
          <div className={styles.moduleTitleSmall}>Advising Notes</div>
          <div className={styles.infoBlock}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Latest Note</span>
              <span className={styles.infoValue}>Review classes weekly and assign weekly check-ins.</span>
            </div>
            <div className={styles.buttonGroup}>
              <button className={styles.secondaryButtonCompact}>Edit Notes</button>
              <button className={styles.secondaryButtonCompact}>Archive Notes</button>
            </div>
          </div>

          <div className={styles.moduleTitleSmall}>Prediction Explanation</div>
          <div className={styles.placeholderChart} style={{ minHeight: "160px" }}>
            <div>Feature Importance / SHAP Explanation</div>
            <span>Placeholder for AI explanation of prediction drivers.</span>
          </div>
        </div>
      </div>

      <div className={styles.cardRow}>
        <div className={styles.moduleCard}>
          <div className={styles.moduleTitleSmall}>Activity History</div>
          <div className={styles.infoBlock}>
            {previousSessions.map((session) => (
              <div key={session.id} className={styles.infoRow}>
                <span className={styles.infoLabel}>{session.title}</span>
                <span className={styles.infoValue}>{session.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.moduleCard}>
          <div className={styles.moduleTitleSmall}>Export Advising Report</div>
          <p className={styles.moduleSubtitle}>
            Export a student advising summary for record-keeping and intervention planning.
          </p>
          <div className={styles.buttonGroup}>
            <button className={styles.primaryButton}>Export PDF</button>
          </div>
        </div>
      </div>
    </ModuleShell>
  );
};

export default AIAcademicAdvisingModule;
