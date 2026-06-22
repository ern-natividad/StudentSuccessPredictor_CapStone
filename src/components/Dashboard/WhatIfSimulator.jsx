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

  const predictionData = {
    labels: ["SHS GPA", "Predicted"],
    datasets: [
      {
        label: "GPA",
        data: [inputs.shsGpa, predictGPA()],
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
              <span>High School GPA</span>
              <span className={commonStyles.sliderValue}>{inputs.hsGpa}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={inputs.hsGpa}
              onChange={(e) => handleInputChange("hsGpa", parseInt(e.target.value))}
              className={commonStyles.sliderInput}
            />
          </div>

          <div className={commonStyles.sliderContainer}>
            <div className={commonStyles.sliderLabel}>
              <span>Senior High School GPA</span>
              <span className={commonStyles.sliderValue}>{inputs.shsGpa.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="1"
              max="4"
              step="0.1"
              value={inputs.shsGpa}
              onChange={(e) => handleInputChange("shsGpa", parseFloat(e.target.value))}
              className={commonStyles.sliderInput}
            />
          </div>

          <div className={commonStyles.sliderContainer}>
            <div className={commonStyles.sliderLabel}>
              <span>WMSU CET Scores</span>
              <span className={commonStyles.sliderValue}>{inputs.cetScore}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={inputs.cetScore}
              onChange={(e) => handleInputChange("cetScore", parseInt(e.target.value))}
              className={commonStyles.sliderInput}
            />
          </div>

          <div className={commonStyles.sliderContainer}>
            <div className={commonStyles.sliderLabel}>
              <span>Screening Result</span>
              <span className={commonStyles.sliderValue}>{inputs.screening}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={inputs.screening}
              onChange={(e) => handleInputChange("screening", parseInt(e.target.value))}
              className={commonStyles.sliderInput}
            />
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Prediction Results</div>

          <div className={commonStyles.metric}>
            <div className={commonStyles.metricLabel}>High School GPA</div>
            <div className={commonStyles.metricValue}>{inputs.hsGpa}%</div>
          </div>

          <div className={commonStyles.metric}>
            <div className={commonStyles.metricLabel}>Senior High School GPA</div>
            <div className={commonStyles.metricValue}>{inputs.shsGpa.toFixed(2)}</div>
          </div>

          <div className={commonStyles.metric}>
            <div className={commonStyles.metricLabel}>WMSU CET Scores</div>
            <div className={commonStyles.metricValue}>{inputs.cetScore}</div>
          </div>

          <div className={commonStyles.metric}>
            <div className={commonStyles.metricLabel}>Screening Result</div>
            <div className={commonStyles.metricValue}>{inputs.screening}%</div>
          </div>

          <div className={commonStyles.metric}>
            <div className={commonStyles.metricLabel}>Predicted GPA</div>
            <div className={commonStyles.metricValue} style={{ color: "#2d7a4f" }}>
              {predictGPA().toFixed(2)}
            </div>
          </div>

          <div className={commonStyles.metric}>
            <div className={commonStyles.metricLabel}>Projected Change (vs SHS GPA)</div>
            <div
              className={commonStyles.metricValue}
              style={{ color: predictGPA() > inputs.shsGpa ? "#2d7a4f" : "#c0392b" }}
            >
              {predictGPA() > inputs.shsGpa ? "+" : ""}
              {(predictGPA() - inputs.shsGpa).toFixed(2)}
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
          <li>• Strong Senior High School GPA is a key indicator of college performance</li>
          <li>• Higher WMSU CET scores correlate with better predicted GPA</li>
          <li>• Screening results reflect non-academic factors that affect risk</li>
          {predictGPA() > inputs.shsGpa && (
            <li style={{ color: "#2d7a4f" }}>✓ Your predicted improvements suggest a positive trajectory</li>
          )}
          {predictGPA() <= inputs.shsGpa && inputs.hsGpa < 80 && (
            <li style={{ color: "#c0392b" }}>⚠ Consider improving foundational metrics (HS GPA/CET) or review screening factors</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default WhatIfSimulator;
