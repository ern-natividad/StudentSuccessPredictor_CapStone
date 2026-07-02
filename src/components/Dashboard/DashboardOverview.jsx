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
import { useDashboard } from "../../hooks/useDashboard";
import styles from "../../styles/Dashboard.module.css";
import commonStyles from "../../styles/Common.module.css";

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

  // Risk distribution data
  const riskCounts = {
    Low: students.filter((s) => s.risk_level === "Low").length,
    Medium: students.filter((s) => s.risk_level === "Medium").length,
    High: students.filter((s) => s.risk_level === "High").length,
    Critical: students.filter((s) => s.risk_level === "Critical").length,
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

  // GPA trend data
  const gpaChartData = {
    labels: [
      "1st Sem Y1",
      "2nd Sem Y1",
      "1st Sem Y2",
      "2nd Sem Y2",
      "1st Sem Y3",
      "2nd Sem Y3",
    ],
    datasets: [
      {
        label: "Cohort Average",
        data: [2.9, 3.0, 3.05, 3.1, 3.08, null],
        borderColor: "#C9A200",
        backgroundColor: "rgba(197,162,0,0.08)",
        pointBackgroundColor: "#C9A200",
        tension: 0.4,
        fill: true,
        borderWidth: 2.5,
      },
      {
        label: "Predicted",
        data: [null, null, null, null, 3.08, 3.14],
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
            <div className={commonStyles.metricValue}>3.08</div>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Risk Distribution</div>
          <div
            style={{
              position: "relative",
              height: "160px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
        </div>

        {/* Model Version */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Model Status</div>
          <div className={commonStyles.metric}>
            <div className={commonStyles.metricLabel}>Current Version</div>
            <div className={commonStyles.metricValue}>v1.3.0</div>
          </div>
          <div className={commonStyles.metric}>
            <div className={commonStyles.metricLabel}>Accuracy</div>
            <div className={commonStyles.metricValue}>94.2%</div>
          </div>
          <div className={commonStyles.metric}>
            <div className={commonStyles.metricLabel}>Last Updated</div>
            <div style={{ fontSize: "12px", color: "#5a5240" }}>
              Yesterday 14:30
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
