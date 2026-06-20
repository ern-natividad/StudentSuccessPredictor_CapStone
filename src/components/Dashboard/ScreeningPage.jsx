import React, { useState } from "react";
import styles from "../../styles/Dashboard.module.css";
import commonStyles from "../../styles/Common.module.css";

const ScreeningPage = () => {
  const [responses, setResponses] = useState({
    q1: 0,
    q2: 0,
    q3: 0,
    q4: 0,
    q5: 0,
  });

  const rubric = [
    {
      id: "q1",
      label: "Attendance Rate",
      description: "How many classes has the student attended?",
    },
    {
      id: "q2",
      label: "Assignment Submission",
      description: "On-time assignment submission rate",
    },
    {
      id: "q3",
      label: "Participation",
      description: "Class participation and engagement level",
    },
    {
      id: "q4",
      label: "Academic Performance",
      description: "Recent quiz/exam scores",
    },
    {
      id: "q5",
      label: "Behavioral Conduct",
      description: "Discipline records and conduct",
    },
  ];

  const handleResponseChange = (id, value) => {
    setResponses((prev) => ({ ...prev, [id]: parseInt(value) }));
  };

  const riskScore =
    Object.values(responses).reduce((a, b) => a + b, 0) /
    Object.keys(responses).length;
  const getRiskLevel = () => {
    if (riskScore >= 4) return { level: "Low", color: "#2d7a4f" };
    if (riskScore >= 3) return { level: "Medium", color: "#C9A200" };
    if (riskScore >= 2) return { level: "High", color: "#d47000" };
    return { level: "Critical", color: "#c0392b" };
  };

  const risk = getRiskLevel();

  return (
    <div>
      <h1 className={styles.pageTitle}>Screening Rubric</h1>

      <div className={styles.card} style={{ marginBottom: "20px" }}>
        <div className={styles.cardTitle}>Academic Screening Assessment</div>
        <p style={{ fontSize: "13px", color: "#5a5240", marginBottom: "20px" }}>
          Evaluate student performance across multiple dimensions. Rate each
          item from 1 (Concerning) to 5 (Excellent).
        </p>

        {rubric.map((item) => (
          <div key={item.id} className={commonStyles.sliderContainer}>
            <div className={commonStyles.sliderLabel}>
              <span>{item.label}</span>
              <span className={commonStyles.sliderValue}>
                {responses[item.id]}
              </span>
            </div>
            <p
              style={{
                fontSize: "12px",
                color: "#a89870",
                marginBottom: "8px",
              }}
            >
              {item.description}
            </p>
            <input
              type="range"
              min="0"
              max="5"
              value={responses[item.id]}
              onChange={(e) => handleResponseChange(item.id, e.target.value)}
              className={commonStyles.sliderInput}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "10px",
                color: "#a89870",
                marginTop: "4px",
              }}
            >
              <span>Concerning</span>
              <span>Excellent</span>
            </div>
          </div>
        ))}
      </div>

      <div
        className={commonStyles.grid}
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
      >
        <div className={styles.card}>
          <div className={styles.cardTitle}>Overall Assessment</div>
          <div className={commonStyles.statBlock}>
            <div
              className={commonStyles.statValue}
              style={{ color: risk.color }}
            >
              {risk.level}
            </div>
            <div className={commonStyles.statLabel}>Risk Level</div>
          </div>
          <div className={commonStyles.metric}>
            <div className={commonStyles.metricLabel}>Risk Score</div>
            <div className={commonStyles.metricValue}>
              {riskScore.toFixed(2)} / 5
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Recommendations</div>
          <ul style={{ fontSize: "13px", lineHeight: "1.8", color: "#5a5240" }}>
            {riskScore < 2.5 && (
              <>
                <li>• Immediate intervention recommended</li>
                <li>• Schedule academic counseling</li>
                <li>• Consider tutoring services</li>
              </>
            )}
            {riskScore >= 2.5 && riskScore < 3.5 && (
              <>
                <li>• Regular monitoring advised</li>
                <li>• Study support offered</li>
                <li>• Progress check-ins recommended</li>
              </>
            )}
            {riskScore >= 3.5 && (
              <>
                <li>• Continue current support plan</li>
                <li>• Encourage continued engagement</li>
                <li>• Monitor for changes</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ScreeningPage;
