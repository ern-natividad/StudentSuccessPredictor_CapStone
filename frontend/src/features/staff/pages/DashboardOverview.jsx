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
import { useRoleScopedStudents } from "../../../hooks/useRoleScopedStudents";
import { useEarlyAlerts } from "../hooks/useEarlyAlerts";
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
  Legend
);

const DashboardOverview = () => {
  const { isAdmin, visibleStudents } = useRoleScopedStudents();
  const { alerts, loading: alertsLoading } = useEarlyAlerts();

  const safeStudents = Array.isArray(visibleStudents) ? visibleStudents : [];

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
        backgroundColor: ["#166534", "#d97706", "#ea580c", "#dc2626"],
        borderWidth: 2,
        borderColor: "#ffffff",
        hoverOffset: 4,
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
    ? (
        currentGpaValues.reduce((sum, value) => sum + value, 0) /
        currentGpaValues.length
      ).toFixed(2)
    : "0.00";

  const averagePredictedGpa = predictedGpaValues.length
    ? (
        predictedGpaValues.reduce((sum, value) => sum + value, 0) /
        predictedGpaValues.length
      ).toFixed(2)
    : "—";

  const gpaChartData = {
    labels: ["Current Average", "Predicted Average"],
    datasets: [
      {
        label: "Current Average",
        data: [averageCurrentGpa === "—" ? null : Number(averageCurrentGpa)],
        borderColor: "#800000",
        backgroundColor: "rgba(128, 0, 0, 0.08)",
        pointBackgroundColor: "#800000",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 7,
        tension: 0.3,
        fill: true,
        borderWidth: 3,
      },
      {
        label: "Predicted Average",
        data: [
          averageCurrentGpa === "—" ? null : Number(averageCurrentGpa),
          averagePredictedGpa === "—" ? null : Number(averagePredictedGpa),
        ],
        borderColor: "#b91c1c",
        borderDash: [6, 4],
        pointStyle: "circle",
        pointBorderColor: "#b91c1c",
        pointBackgroundColor: "#ffffff",
        pointRadius: 6,
        tension: 0.3,
        borderWidth: 2.5,
      },
    ],
  };

  const getSeverityBadge = (severity) => {
    const stylesMap = {
      critical: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", label: "Critical" },
      high: { bg: "#fff7ed", color: "#ea580c", border: "#ffedd5", label: "High" },
      medium: { bg: "#fffbeb", color: "#d97706", border: "#fef3c7", label: "Medium" },
      low: { bg: "#f0fdf4", color: "#166534", border: "#dcfce7", label: "Low" },
    };

    const currentStyle = stylesMap[severity?.toLowerCase()] || stylesMap.low;

    return (
      <span
        style={{
          fontSize: "0.8rem",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.03em",
          padding: "0.3rem 0.65rem",
          borderRadius: "6px",
          backgroundColor: currentStyle.bg,
          color: currentStyle.color,
          border: `1px solid ${currentStyle.border}`,
          display: "inline-block",
        }}
      >
        {currentStyle.label}
      </span>
    );
  };

  return (
    <div style={{ padding: "0.5rem" }}>
      {/* Main Page Title Header using CSS module className */}
      <h1 className={styles.pageTitle} style={{ fontSize: "1.75rem", marginBottom: "1.5rem" }}>
        Dashboard
      </h1>

      {/* Top Overview Cards Grid */}
      <div
        className={commonStyles.grid}
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Key Metrics Card */}
        <div
          className={styles.card}
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            padding: "1.5rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontSize: "1.15rem",
              fontWeight: "700",
              color: "#800000",
              marginBottom: "1rem",
              borderBottom: "1px solid #f1f5f9",
              paddingBottom: "0.75rem",
            }}
          >
            Academic Overview Metrics
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1rem",
              marginTop: "1rem",
            }}
          >
            <div
              style={{
                backgroundColor: "#f8fafc",
                padding: "1.15rem 0.85rem",
                borderRadius: "10px",
                border: "1px solid #f1f5f9",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "#64748b" }}>
                {isAdmin ? "Total Students" : "Assigned Students"}
              </div>
              <div
                style={{
                  fontSize: "2.1rem",
                  fontWeight: "800",
                  color: "#0f172a",
                  marginTop: "0.35rem",
                }}
              >
                {safeStudents.length}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#fff7ed",
                padding: "1.15rem 0.85rem",
                borderRadius: "10px",
                border: "1px solid #ffedd5",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "#c2410c" }}>
                At Risk
              </div>
              <div
                style={{
                  fontSize: "2.1rem",
                  fontWeight: "800",
                  color: "#ea580c",
                  marginTop: "0.35rem",
                }}
              >
                {riskCounts.High + riskCounts.Critical}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#f8fafc",
                padding: "1.15rem 0.85rem",
                borderRadius: "10px",
                border: "1px solid #f1f5f9",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "#64748b" }}>
                Avg GPA
              </div>
              <div
                style={{
                  fontSize: "2.1rem",
                  fontWeight: "800",
                  color: "#800000",
                  marginTop: "0.35rem",
                }}
              >
                {averageCurrentGpa}
              </div>
            </div>
          </div>
        </div>

        {/* Risk Distribution Card */}
        <div
          className={styles.card}
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            padding: "1.5rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontSize: "1.15rem",
              fontWeight: "700",
              color: "#800000",
              marginBottom: "1rem",
              borderBottom: "1px solid #f1f5f9",
              paddingBottom: "0.75rem",
            }}
          >
            Risk Distribution
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1.5rem",
              marginTop: "0.5rem",
            }}
          >
            <div
              style={{
                position: "relative",
                height: "170px",
                width: "170px",
                flexShrink: 0,
              }}
            >
              <Doughnut
                data={riskChartData}
                options={{
                  cutout: "70%",
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      titleFont: { size: 13, weight: "600" },
                      bodyFont: { size: 13 },
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

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "0.5rem",
                flex: 1,
              }}
            >
              {riskChartData.labels?.map((label, index) => {
                const value = riskChartData.datasets?.[0]?.data?.[index] ?? 0;
                const color =
                  riskChartData.datasets?.[0]?.backgroundColor?.[index] ??
                  "#cbd5e1";
                const total = safeStudents.length || 1;
                const percentage = ((value / total) * 100).toFixed(0);

                return (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.45rem 0.75rem",
                      borderRadius: "8px",
                      backgroundColor: "#f8fafc",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "4px",
                          backgroundColor: color,
                          display: "inline-block",
                        }}
                      />
                      <span style={{ fontWeight: 600, color: "#334155", fontSize: "0.95rem" }}>
                        {label}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.95rem" }}>
                      <span style={{ fontWeight: "700", color: "#0f172a" }}>
                        {value}
                      </span>
                      <span style={{ color: "#64748b", marginLeft: "6px", fontSize: "0.875rem" }}>
                        ({percentage}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Charts & Early Alerts Grid */}
      <div
        className={commonStyles.grid}
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* GPA Trend Analysis Card */}
        <div
          className={styles.card}
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            padding: "1.5rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontSize: "1.15rem",
              fontWeight: "700",
              color: "#800000",
              marginBottom: "1rem",
              borderBottom: "1px solid #f1f5f9",
              paddingBottom: "0.75rem",
            }}
          >
            GPA Trend & Forecast Analysis
          </div>

          <div style={{ position: "relative", height: "280px" }}>
            <Line
              data={gpaChartData}
              options={{
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      font: { size: 12, weight: "600" },
                      boxWidth: 14,
                      padding: 18,
                      usePointStyle: true,
                    },
                  },
                  tooltip: {
                    backgroundColor: "#1e293b",
                    padding: 12,
                    titleFont: { size: 13, weight: "600" },
                    bodyFont: { size: 13 },
                  },
                },
                scales: {
                  y: {
                    min: 1.0,
                    max: 4.0,
                    grid: { color: "#f1f5f9" },
                    ticks: {
                      font: { size: 12, weight: "500" },
                      color: "#475569",
                      stepSize: 0.5,
                    },
                  },
                  x: {
                    grid: { display: false },
                    ticks: { font: { size: 12, weight: "500" }, color: "#475569" },
                  },
                },
                responsive: true,
                maintainAspectRatio: false,
              }}
            />
          </div>
        </div>

        {/* Recent Alerts Module Card */}
        <div
          className={styles.card}
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            padding: "1.5rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontSize: "1.15rem",
              fontWeight: "700",
              color: "#800000",
              marginBottom: "1rem",
              borderBottom: "1px solid #f1f5f9",
              paddingBottom: "0.75rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Recent Early Alerts</span>
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: "600",
                color: "#475569",
                backgroundColor: "#f1f5f9",
                padding: "0.25rem 0.65rem",
                borderRadius: "14px",
              }}
            >
              {alerts.length} Active
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {alertsLoading && (
              <div
                style={{
                  padding: "2.5rem",
                  textAlign: "center",
                  fontSize: "0.95rem",
                  color: "#64748b",
                }}
              >
                Loading early alerts…
              </div>
            )}

            {!alertsLoading && alerts.length === 0 && (
              <div
                style={{
                  padding: "2.5rem",
                  textAlign: "center",
                  fontSize: "0.95rem",
                  color: "#64748b",
                  backgroundColor: "#f8fafc",
                  borderRadius: "10px",
                  border: "1px dashed #cbd5e1",
                }}
              >
                No active early alerts recorded.
              </div>
            )}

            {!alertsLoading &&
              alerts.slice(0, 4).map((alert, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.85rem 1rem",
                    borderRadius: "10px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #f1f5f9",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", minWidth: 0, flex: 1 }}>
                    {getSeverityBadge(alert.sev)}
                    
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: "600",
                          color: "#0f172a",
                        }}
                      >
                        {alert.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.875rem",
                          color: "#64748b",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          marginTop: "2px",
                        }}
                      >
                        {alert.desc}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "0.825rem",
                      fontWeight: "600",
                      color: "#94a3b8",
                      marginLeft: "1rem",
                      whiteSpace: "nowrap",
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