import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { useDashboard } from "../../hooks/useDashboard";
import styles from "../../styles/Dashboard.module.css";
import commonStyles from "../../styles/Common.module.css";

const StudentPrediction = () => {
  const { user } = useAuth();
  const { students } = useDashboard();
  const currentStudent = students.find((student) =>
    user.name.toLowerCase().startsWith(student.name.toLowerCase().split(" ")[0]),
  );

  const studentData = currentStudent || students[0];

  return (
    <div>
      <h1 className={styles.pageTitle}>Prediction Result</h1>
      <div className={styles.card}>
        <div className={commonStyles.metric}>
          <div className={commonStyles.metricLabel}>Student</div>
          <div className={commonStyles.metricValue}>{user.name}</div>
        </div>
        <div className={commonStyles.metric}>
          <div className={commonStyles.metricLabel}>Current GPA</div>
          <div className={commonStyles.metricValue}>
            {studentData.gpa.toFixed(2)}
          </div>
        </div>
        <div className={commonStyles.metric}>
          <div className={commonStyles.metricLabel}>Predicted GPA</div>
          <div className={commonStyles.metricValue}>
            {studentData.pred.toFixed(2)}
          </div>
        </div>
        <div className={commonStyles.metric}>
          <div className={commonStyles.metricLabel}>Risk Level</div>
          <div className={commonStyles.metricValue}>{studentData.risk}</div>
        </div>
        <div className={commonStyles.metric}>
          <div className={commonStyles.metricLabel}>Confidence</div>
          <div className={commonStyles.metricValue}>{studentData.conf}%</div>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.cardTitle}>What This Means</div>
        <p className={styles.cardText}>
          Your personalized prediction is based on your current academic profile and performance indicators.
          Use the What-If Simulator to explore how adjustments in course results could change your GPA and risk.
        </p>
      </div>
    </div>
  );
};

export default StudentPrediction;
