import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { useDashboard } from "../../hooks/useDashboard";
import styles from "../../styles/Dashboard.module.css";
import commonStyles from "../../styles/Common.module.css";

const StudentPrediction = () => {
  const { user } = useAuth();
  const { students, showPage } = useDashboard();
  const currentStudent = students.find((student) =>
    user.name
      .toLowerCase()
      .startsWith(student.full_name.toLowerCase().split(" ")[0]),
  );

  const studentData = currentStudent || students[0];
  const successPercent = Math.min(
    99,
    Math.max(65, Math.round(studentData.predicted_gpa * 24)),
  );
  const bestProgram =
    studentData.predicted_gpa >= 3.7
      ? "Computer Engineering"
      : studentData.current_gpa >= 3.2
        ? "Electronics Engineering"
        : "Civil Engineering";

  const programCards = [
    {
      name: "Computer Engineering",
      percent: successPercent,
      badge: "Best fit",
      active: true,
    },
    {
      name: "Electronics Engineering",
      percent: Math.max(74, successPercent - 6),
      badge: "Good match",
    },
    {
      name: "Civil Engineering",
      percent: Math.max(68, successPercent - 12),
      badge: "Good match",
    },
    {
      name: "Mechanical Engineering",
      percent: Math.max(61, successPercent - 18),
      badge: "Fair match",
    },
  ];

  const scoreCards = [
    {
      label: "Current GPA",
      value: `${studentData.current_gpa.toFixed(2)}`,
      note: "Above target",
    },
    {
      label: "Predicted GPA",
      value: `${studentData.predicted_gpa.toFixed(2)}`,
      note: "Projected",
    },
    {
      label: "Risk Level",
      value: studentData.risk_level,
      note: studentData.risk_level === "Low" ? "Stable" : "Needs support",
    },
    {
      label: "Confidence",
      value: `${studentData.confidence_score}%`,
      note: "Model confidence",
    },
  ];

  return (
    <div className={styles.studentPredictionPage}>
      <div className={styles.pageHeaderSection}>
        <h1 className={styles.pageTitle}>Engineering program predictor</h1>
        <p className={styles.pageDesc}>
          Based on your academic profile and current performance indicators,
          here is your personalized student dashboard summary.
        </p>
      </div>

      <div className={styles.resultBanner}>
        <div>
          <div className={styles.resultPct}>{successPercent}%</div>
          <div className={styles.resultPctLabel}>Success probability</div>
        </div>
        <div className={styles.resultDivider} />
        <div>
          <div className={styles.resultProgram}>Best fit: {bestProgram}</div>
          <div className={styles.resultSub}>
            Strong match based on your GPA trend, confidence score, and academic
            performance.
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>All program predictions</div>
        <div className={styles.programGrid}>
          {programCards.map((program) => (
            <div
              key={program.name}
              className={`${styles.programCard} ${program.active ? styles.programCardActive : ""}`}
            >
              <div className={styles.programPercent}>{program.percent}%</div>
              <div className={styles.programName}>{program.name}</div>
              <div className={styles.programBarBg}>
                <div
                  className={styles.programBar}
                  style={{ width: `${program.percent}%` }}
                />
              </div>
              <div className={styles.programBadge}>{program.badge}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Score breakdown</div>
        <div className={styles.scoreGrid}>
          {scoreCards.map((item) => (
            <div key={item.label} className={styles.scoreTile}>
              <div className={styles.scoreLabel}>{item.label}</div>
              <div className={styles.scoreValue}>{item.value}</div>
              <div className={styles.scoreNote}>{item.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Guidance note</div>
        <p className={styles.cardText}>
          Your profile shows a strong academic trajectory. Continue monitoring
          your grades, review the simulator, and focus on the programs that best
          match your current strengths.
        </p>
        <div className={styles.buttonRow}>
          <button
            className={commonStyles.btnSmallOutline}
            onClick={() => showPage("simulator")}
          >
            Open What-If Simulator
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentPrediction;
