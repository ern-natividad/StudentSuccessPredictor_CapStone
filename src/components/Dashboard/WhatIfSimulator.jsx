import React, { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import styles from "../../styles/Dashboard.module.css";
import commonStyles from "../../styles/Common.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

const WhatIfSimulator = () => {
  const [inputs, setInputs] = useState({
    attendance: 85,
    gpa: 3.0,
    studyHours: 20,
    participation: 75,
  });

  const handleInputChange = (name, value) => {
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  // Simulate prediction
  const predictGPA = () => {
    const { attendance, studyHours, participation } = inputs;
    const predicted =
      2.0 +
      (attendance / 100) * 0.8 +
      (studyHours / 30) * 0.7 +
      (participation / 100) * 0.5;
    return Math.min(Math.max(predicted, 1.0), 4.0);
  };

  const predictionData = {
    labels: ["Current", "Predicted"],
    datasets: [
      {
        label: "GPA",
        data: [inputs.gpa, predictGPA()],
        backgroundColor: ["rgba(201, 162, 0, 0.3)", "rgba(45, 122, 79, 0.3)"],
        borderColor: ["#C9A200", "#2d7a4f"],
        borderWidth: 2,
      },
    ],
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>What-If Simulator</h1>

      <div
        className={commonStyles.grid}
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}
      >
        <div className={styles.card}>
          <div className={styles.cardTitle}>Input Parameters</div>

          <div className={commonStyles.sliderContainer}>
            <div className={commonStyles.sliderLabel}>
              <span>Attendance Rate</span>
              <span className={commonStyles.sliderValue}>
                {inputs.attendance}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={inputs.attendance}
              onChange={(e) =>
                handleInputChange("attendance", parseInt(e.target.value))
              }
              className={commonStyles.sliderInput}
            />
          </div>

          <div className={commonStyles.sliderContainer}>
            <div className={commonStyles.sliderLabel}>
              <span>Current GPA</span>
              <span className={commonStyles.sliderValue}>
                {inputs.gpa.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="4"
              step="0.1"
              value={inputs.gpa}
              onChange={(e) =>
                handleInputChange("gpa", parseFloat(e.target.value))
              }
              className={commonStyles.sliderInput}
            />
          </div>

          <div className={commonStyles.sliderContainer}>
            <div className={commonStyles.sliderLabel}>
              <span>Weekly Study Hours</span>
              <span className={commonStyles.sliderValue}>
                {inputs.studyHours}h
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              value={inputs.studyHours}
              onChange={(e) =>
                handleInputChange("studyHours", parseInt(e.target.value))
              }
              className={commonStyles.sliderInput}
            />
          </div>

          <div className={commonStyles.sliderContainer}>
            <div className={commonStyles.sliderLabel}>
              <span>Class Participation</span>
              <span className={commonStyles.sliderValue}>
                {inputs.participation}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={inputs.participation}
              onChange={(e) =>
                handleInputChange("participation", parseInt(e.target.value))
              }
              className={commonStyles.sliderInput}
            />
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Prediction Results</div>

          <div className={commonStyles.metric}>
            <div className={commonStyles.metricLabel}>Current GPA</div>
            <div className={commonStyles.metricValue}>
              {inputs.gpa.toFixed(2)}
            </div>
          </div>

          <div className={commonStyles.metric}>
            <div className={commonStyles.metricLabel}>Predicted GPA</div>
            <div
              className={commonStyles.metricValue}
              style={{ color: "#2d7a4f" }}
            >
              {predictGPA().toFixed(2)}
            </div>
          </div>

          <div className={commonStyles.metric}>
            <div className={commonStyles.metricLabel}>Projected Change</div>
            <div
              className={commonStyles.metricValue}
              style={{
                color: predictGPA() > inputs.gpa ? "#2d7a4f" : "#c0392b",
              }}
            >
              {predictGPA() > inputs.gpa ? "+" : ""}
              {(predictGPA() - inputs.gpa).toFixed(2)}
            </div>
          </div>

          <div className={commonStyles.metric}>
            <div className={commonStyles.metricLabel}>Success Probability</div>
            <div className={commonStyles.metricValue}>
              {Math.min(100, Math.max(0, (predictGPA() / 4) * 100)).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      <div className={styles.card} style={{ marginTop: "20px" }}>
        <div className={styles.cardTitle}>GPA Comparison</div>
        <div style={{ position: "relative", height: "300px" }}>
          <Line
            data={predictionData}
            options={{
              plugins: {
                legend: { position: "top" },
              },
              scales: {
                y: { min: 1, max: 4, ticks: { stepSize: 0.5 } },
              },
              responsive: true,
              maintainAspectRatio: false,
            }}
          />
        </div>
      </div>

      <div className={styles.card} style={{ marginTop: "20px" }}>
        <div className={styles.cardTitle}>Insights & Recommendations</div>
        <ul style={{ fontSize: "13px", lineHeight: "2", color: "#5a5240" }}>
          <li>
            • Increasing study hours has the most significant impact on GPA
          </li>
          <li>• Consistent attendance is crucial for academic success</li>
          <li>• Active participation improves overall performance</li>
          {predictGPA() > inputs.gpa && (
            <li style={{ color: "#2d7a4f" }}>
              ✓ Your predicted improvements suggest positive trajectory
            </li>
          )}
          {predictGPA() <= inputs.gpa && inputs.attendance < 80 && (
            <li style={{ color: "#c0392b" }}>
              ⚠ Improving attendance should be a priority
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default WhatIfSimulator;
