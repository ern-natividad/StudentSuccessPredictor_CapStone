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
import ModuleShell from "../../../components/Common/ModuleShell";
import styles from "../../../styles/Dashboard.module.css";
import commonStyles from "../../../styles/Common.module.css";
import { normalizeWhatIfPayload } from "../../../utils/dataNormalization";

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
    hsGpa: 85, // High School GPA (percent)
    shsGpa: 3.0, // Senior High School GPA (1.0 - 4.0)
    cetScore: 60, // WMSU CET score (0 - 100)
    screening: 70, // Screening result (0 - 100)
  });

  const handleInputChange = (name, value) => {
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  // Heuristic prediction combining inputs
  const predictGPA = () => {
    const { hsGpa, shsGpa, cetScore, screening } = inputs;

    const predicted =
      1.5 +
      (hsGpa / 100) * 0.6 +
      (shsGpa / 4) * 1.0 +
      (cetScore / 100) * 0.6 +
      (screening / 100) * 0.7;

    return Math.min(Math.max(predicted, 1.0), 4.0);
  };

  const normalizedScenario = normalizeWhatIfPayload(inputs);

  const predictionData = {
    labels: ["SHS GPA", "Predicted"],
    datasets: [
      {
        label: "GPA",
        data: [
          normalizedScenario.senior_high_school_gpa,
          normalizedScenario.predicted_gpa,
        ],
        backgroundColor: ["rgba(201, 162, 0, 0.3)", "rgba(45, 122, 79, 0.3)"],
        borderColor: ["#C9A200", "#2d7a4f"],
        borderWidth: 2,
      },
    ],
  };

  return (
    <ModuleShell 
      title="What-If Simulator" 
      description="Simulate student performance metrics and academic risk scenarios."
    >
      <div 
        className={commonStyles.grid} 
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}
      >
        <div className={styles.card}>
          <div className={styles.cardTitle}>Input Parameters</div>
          <div className={commonStyles.sliderContainer}>
            <div className={commonStyles.sliderLabel}>
              <span>High School GPA (%)</span>
              <span>{inputs.hsGpa}%</span>
            </div>
            <input
              type="range"
              min="75"
              max="100"
              value={inputs.hsGpa}
              onChange={(e) => handleInputChange("hsGpa", Number(e.target.value))}
              className={commonStyles.slider}
            />
          </div>

          <div className={commonStyles.sliderContainer}>
            <div className={commonStyles.sliderLabel}>
              <span>Senior High School GPA</span>
              <span>{inputs.shsGpa}</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="4.0"
              step="0.1"
              value={inputs.shsGpa}
              onChange={(e) => handleInputChange("shsGpa", Number(e.target.value))}
              className={commonStyles.slider}
            />
          </div>

          <div className={commonStyles.sliderContainer}>
            <div className={commonStyles.sliderLabel}>
              <span>WMSU CET Score</span>
              <span>{inputs.cetScore}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={inputs.cetScore}
              onChange={(e) => handleInputChange("cetScore", Number(e.target.value))}
              className={commonStyles.slider}
            />
          </div>

          <div className={commonStyles.sliderContainer}>
            <div className={commonStyles.sliderLabel}>
              <span>Screening Score</span>
              <span>{inputs.screening}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={inputs.screening}
              onChange={(e) => handleInputChange("screening", Number(e.target.value))}
              className={commonStyles.slider}
            />
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Performance Projection</div>
          <div style={{ height: "200px", position: "relative" }}>
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

        <div className={styles.card} style={{ marginTop: "20px", gridColumn: "1 / -1" }}>
          <div className={styles.cardTitle}>Insights & Recommendations</div>
          <ul style={{ fontSize: "13px", lineHeight: "2", color: "#5a5240", listStyleType: "none", paddingLeft: 0 }}>
            <li>
              • Strong Senior High School GPA is a key indicator of college
              performance
            </li>
            <li>• Higher WMSU CET scores correlate with better predicted GPA</li>
            <li>
              • Screening results reflect non-academic factors that affect risk
            </li>
            {predictGPA() > inputs.shsGpa && (
              <li style={{ color: "#2d7a4f", marginTop: "4px" }}>
                ✓ Your predicted improvements suggest a positive trajectory
              </li>
            )}
            {predictGPA() <= inputs.shsGpa && inputs.hsGpa < 80 && (
              <li style={{ color: "#c0392b", marginTop: "4px" }}>
                ⚠ Consider improving foundational metrics (HS GPA/CET) or review
                screening factors
              </li>
            )}
          </ul>
        </div>
      </div>
    </ModuleShell>
  );
};

export default WhatIfSimulator;