import React from "react";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import { useDashboard } from "../../../hooks/useDashboard";
import styles from "../../../styles/Dashboard.module.css";
import commonStyles from "../../../styles/Common.module.css";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

const DashboardOverview = () => {
  const { alerts, students } = useDashboard();

  const safeStudents = Array.isArray(students) ? students : [];

  const riskCounts = {
    Low: safeStudents.filter((s) => s.risk_level === "Low").length,
    Medium: safeStudents.filter((s) => s.risk_level === "Medium").length,
    High: safeStudents.filter((s) => s.risk_level === "High").length,
    Critical: safeStudents.filter((s) => s.risk_level === "Critical").length,
  };

  const riskChartData = {
    labels: ["Low", "Medium", "High", "Critical"],
    datasets: [
      {
        data: [
          riskCounts.Low,
          riskCounts.Medium,
          riskCounts.High,
          riskCounts.Critical,
        ],
        backgroundColor: ["#2d7a4f", "#C9A200", "#d47000", "#c0392b"],
        borderWidth: 3,
        borderColor: "#fff",
      },
    ],
  };

  const currentGpaValues = safeStudents
    .map((student) => Number(student.current_gpa))
    .filter((value) => Number.isFinite(value));
  const predictedGpaValues = safeStudents
    .map((student) => Number(student.predicted_gpa))
    .filter((value) => Number.isFinite(value));

  const averageCurrentGpa = currentGpaValues.length
    ? (currentGpaValues.reduce((sum, value) => sum + value, 0) /
        currentGpaValues.length).toFixed(2)
    : "—";

  const averagePredictedGpa = predictedGpaValues.length
    ? (predictedGpaValues.reduce((sum, value) => sum + value, 0) /
        predictedGpaValues.length).toFixed(2)
    : "—";

  const gpaChartData = {
    labels: ["Current Average", "Predicted Average"],
    datasets: [
      {
        label: "Current",
        data: [averageCurrentGpa === "—" ? null : Number(averageCurrentGpa)],
        borderColor: "#C9A200",
        backgroundColor: "rgba(197,162,0,0.08)",
        pointBackgroundColor: "#C9A200",
        tension: 0.4,
        fill: true,
        borderWidth: 2.5,
      },
      {
        label: "Predicted",
        data: [averagePredictedGpa === "—" ? null : Number(averagePredictedGpa)],
        borderColor: "#8B6F00",
        borderDash: [5, 4],
        pointStyle: "circle",
        pointBorderColor: "#8B6F00",
        pointBackgroundColor: "#fff",
        tension: 0.4,
        borderWidth: 2,
      },
    ],
  };

  const getAlertIcon = (severity) => {
    const icons = {
      critical: "fas fa-exclamation-triangle",
      high: "fas fa-bell",
      medium: "fas fa-thumbtack",
      low: "fas fa-info-circle",
    };
    return icons[severity] || "fas fa-info-circle";
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>Dashboard</h1>

      <div
        className={commonStyles.grid}
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
      >
        {/* Key Metrics */}
        <div className={styles.card}>
          <div className={commonStyles.metric}>
            <div className={commonStyles.metricLabel}>Total Students</div>
            <div className={commonStyles.metricValue}>{students.length}</div>
          </div>
          <div className={commonStyles.metric}>
            <div className={commonStyles.metricLabel}>At Risk</div>
            <div
              className={commonStyles.metricValue}
              style={{ color: "#d47000" }}
            >
              {riskCounts.High + riskCounts.Critical}
            </div>
          </div>
          <div className={commonStyles.metric}>
            <div className={commonStyles.metricLabel}>Avg GPA</div>
            <div className={commonStyles.metricValue}>{averageCurrentGpa}</div>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Risk Distribution</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              gap: "1rem",
              padding: "0.5rem 0",
            }}
          >
            {/* Doughnut Chart */}
            <div
              style={{
                position: "relative",
                height: "160px",
                width: "160px",
                flexShrink: 0,
              }}
            >
              <Doughnut
                data={riskChartData}
                options={{
                  cutout: "72%",
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (context) =>
                          ` ${context.label}: ${context.raw} students`,
                      },
                    },
                  },
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>

            {/* Side Legend with Student Counts */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                fontSize: "0.875rem",
              }}
            >
              {riskChartData.labels?.map((label, index) => {
                const value = riskChartData.datasets?.[0]?.data?.[index] ?? 0;
                const color =
                  riskChartData.datasets?.[0]?.backgroundColor?.[index] ??
                  "#cbd5e1";

                return (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "3px",
                        backgroundColor: color,
                        display: "inline-block",
                      }}
                    />
                    <span style={{ fontWeight: 500, color: "#334155" }}>
                      {label}:
                    </span>
                    <span style={{ fontWeight: 600, color: "#0f172a" }}>
                      {value} {value === 1 ? "student" : "students"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div
        className={commonStyles.grid}
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          marginTop: "24px",
        }}
      >
        <div className={styles.card}>
          <div className={styles.cardTitle}>GPA Trend Analysis</div>
          <div style={{ position: "relative", height: "250px" }}>
            <Line
              data={gpaChartData}
              options={{
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: { font: { size: 10 }, boxWidth: 10, padding: 12 },
                  },
                },
                scales: {
                  y: {
                    min: 2.5,
                    max: 4.0,
                    grid: { color: "rgba(0,0,0,0.05)" },
                    ticks: { font: { size: 10 } },
                  },
                  x: {
                    grid: { display: false },
                    ticks: { font: { size: 10 } },
                  },
                },
                elements: { point: { radius: 4 } },
                responsive: true,
                maintainAspectRatio: false,
              }}
            />
          </div>
        </div>

        {/* Recent Alerts */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Recent Alerts</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {alerts.slice(0, 4).map((alert, idx) => (
              <div key={idx} className={styles.alertItem}>
                <div className={`${styles.alertIcon} ${styles[alert.sev]}`}>
                  <i className={getAlertIcon(alert.sev)}></i>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={styles.alertName}>{alert.name}</div>
                  <div
                    className={styles.alertDesc}
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {alert.desc}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#a89870",
                    flexShrink: 0,
                    marginLeft: "8px",
                  }}
                >
                  {alert.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
