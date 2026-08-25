import React, { useEffect, useMemo, useState } from "react";
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
  Filler,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import { useRoleScopedStudents } from "../../../hooks/useRoleScopedStudents";
import { api, isBackendAuthEnabled } from "../../../services/api";
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
  Legend,
  Filler,
);

const YEAR_LEVEL_ORDER = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
];

const average = (values) => {
  if (!values.length) return null;
  return (
    values.reduce((sum, value) => sum + value, 0) / values.length
  );
};

const formatGpa = (value) =>
  value === null || value === undefined || Number.isNaN(value)
    ? "—"
    : Number(value).toFixed(2);

const normalizeYearLevel = (value) => {
  const raw = String(value || "").trim();
  if (!raw || raw.toLowerCase() === "n/a") return "Unspecified";

  const match = YEAR_LEVEL_ORDER.find(
    (year) => year.toLowerCase() === raw.toLowerCase(),
  );
  return match || raw;
};

const sortYearLevels = (years) =>
  [...years].sort((left, right) => {
    const leftIndex = YEAR_LEVEL_ORDER.indexOf(left);
    const rightIndex = YEAR_LEVEL_ORDER.indexOf(right);
    if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  });

const DashboardOverview = () => {
  const { isAdmin, visibleStudents, visibleStudentIds } = useRoleScopedStudents();
  const { alerts, loading: alertsLoading } = useEarlyAlerts();
  const [performanceRows, setPerformanceRows] = useState([]);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadPerformanceMetrics = async () => {
      if (!isBackendAuthEnabled() || visibleStudents.length === 0) {
        if (isMounted) {
          setPerformanceRows([]);
          setMetricsLoading(false);
          setMetricsError("");
        }
        return;
      }

      setMetricsLoading(true);
      setMetricsError("");

      try {
        let rows = [];

        try {
          const forecastResult = await api.getAcademicPerformanceForecasts({
            sync: "false",
          });
          rows = forecastResult.forecasts || [];
        } catch {
          rows = [];
        }

        // Fallback: pull per-student predictions when forecast rows are unavailable.
        if (rows.length === 0) {
          const predictionResults = await Promise.all(
            visibleStudents.map(async (student) => {
              try {
                const result = await api.getStudentPrediction(student.user_id);
                const prediction = result.prediction;
                if (!prediction) return null;

                return {
                  student_id: student.student_id,
                  year_level: student.yearLevel || student.year_level,
                  current_gpa: prediction.current_gpa,
                  predicted_gpa: prediction.predicted_gpa,
                  risk_level: prediction.risk_level || student.risk_level,
                };
              } catch {
                return null;
              }
            }),
          );
          rows = predictionResults.filter(Boolean);
        }

        const scopedRows = isAdmin
          ? rows
          : rows.filter((row) =>
              visibleStudentIds.has(
                String(row.student_id || "").trim().toLowerCase(),
              ),
            );

        if (isMounted) {
          setPerformanceRows(scopedRows);
        }
      } catch (error) {
        if (isMounted) {
          setPerformanceRows([]);
          setMetricsError(
            error.message || "Unable to load GPA trend metrics.",
          );
        }
      } finally {
        if (isMounted) setMetricsLoading(false);
      }
    };

    loadPerformanceMetrics();

    return () => {
      isMounted = false;
    };
  }, [isAdmin, visibleStudents, visibleStudentIds]);

  const safeStudents = Array.isArray(visibleStudents) ? visibleStudents : [];

  const enrichedStudents = useMemo(() => {
    const predictionByStudentId = new Map(
      performanceRows.map((row) => [
        String(row.student_id || "").trim().toLowerCase(),
        row,
      ]),
    );

    return safeStudents.map((student) => {
      const key = String(student.student_id || "").trim().toLowerCase();
      const row = predictionByStudentId.get(key);

      return {
        ...student,
        current_gpa:
          row?.current_gpa ??
          (Number(student.current_gpa) > 0 ? student.current_gpa : null),
        predicted_gpa:
          row?.predicted_gpa ??
          (Number(student.predicted_gpa) > 0 ? student.predicted_gpa : null),
        risk_level: row?.risk_level || student.risk_level || "Low",
        yearLevel: normalizeYearLevel(
          row?.year_level || student.yearLevel || student.year_level,
        ),
      };
    });
  }, [performanceRows, safeStudents]);

  const riskCounts = {
    Low: enrichedStudents.filter((s) => s.risk_level === "Low").length,
    Medium: enrichedStudents.filter((s) => s.risk_level === "Medium").length,
    High: enrichedStudents.filter((s) => s.risk_level === "High").length,
    Critical: enrichedStudents.filter((s) => s.risk_level === "Critical").length,
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

  const currentGpaValues = enrichedStudents
    .map((student) => Number(student.current_gpa))
    .filter((value) => Number.isFinite(value) && value > 0);
  const predictedGpaValues = enrichedStudents
    .map((student) => Number(student.predicted_gpa))
    .filter((value) => Number.isFinite(value) && value > 0);

  const averageCurrentGpa = average(currentGpaValues);
  const averagePredictedGpa = average(predictedGpaValues);

  const gpaTrendByYear = useMemo(() => {
    const grouped = new Map();

    enrichedStudents.forEach((student) => {
      const year = normalizeYearLevel(student.yearLevel);
      if (!grouped.has(year)) {
        grouped.set(year, { current: [], predicted: [] });
      }

      const current = Number(student.current_gpa);
      const predicted = Number(student.predicted_gpa);
      if (Number.isFinite(current) && current > 0) {
        grouped.get(year).current.push(current);
      }
      if (Number.isFinite(predicted) && predicted > 0) {
        grouped.get(year).predicted.push(predicted);
      }
    });

    const years = sortYearLevels([...grouped.keys()]).filter((year) => {
      const bucket = grouped.get(year);
      return bucket.current.length > 0 || bucket.predicted.length > 0;
    });

    return {
      labels: years,
      current: years.map((year) => average(grouped.get(year).current)),
      predicted: years.map((year) => average(grouped.get(year).predicted)),
    };
  }, [enrichedStudents]);

  const hasTrendData =
    gpaTrendByYear.labels.length > 0 &&
    (gpaTrendByYear.current.some((value) => value !== null) ||
      gpaTrendByYear.predicted.some((value) => value !== null));

  const gpaChartData = {
    labels:
      gpaTrendByYear.labels.length > 0
        ? gpaTrendByYear.labels
        : ["Current Average", "Predicted Average"],
    datasets: [
      {
        label: "Average Current GWA",
        data:
          gpaTrendByYear.labels.length > 0
            ? gpaTrendByYear.current
            : [averageCurrentGpa],
        borderColor: "#800000",
        backgroundColor: "rgba(128, 0, 0, 0.1)",
        pointBackgroundColor: "#800000",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 6,
        tension: 0.35,
        fill: true,
        borderWidth: 3,
        spanGaps: true,
      },
      {
        label: "Average Predicted GWA",
        data:
          gpaTrendByYear.labels.length > 0
            ? gpaTrendByYear.predicted
            : [null, averagePredictedGpa],
        borderColor: "#b91c1c",
        borderDash: [6, 4],
        backgroundColor: "transparent",
        pointStyle: "circle",
        pointBorderColor: "#b91c1c",
        pointBackgroundColor: "#ffffff",
        pointRadius: 6,
        tension: 0.35,
        borderWidth: 2.5,
        spanGaps: true,
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
    <div className={styles.pageShell}>
      <div className={styles.pageHeaderCard}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>
            {isAdmin
              ? "Monitor cohort risk, GPA trends, and early alerts across all students."
              : "Monitor risk, GPA trends, and early alerts for students assigned to your sections."}
          </p>
        </div>
      </div>

      {/* Top Overview Cards Grid */}
      <div
        className={commonStyles.grid}
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "12px",
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
                {enrichedStudents.length}
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
                {formatGpa(averageCurrentGpa)}
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
                const total = enrichedStudents.length || 1;
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
          gap: "12px",
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
              marginBottom: "0.35rem",
              borderBottom: "1px solid #f1f5f9",
              paddingBottom: "0.75rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <span>GPA Trend & Forecast Analysis</span>
            <span
              style={{
                fontSize: "0.78rem",
                fontWeight: "600",
                color: "#64748b",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "999px",
                padding: "0.25rem 0.65rem",
                whiteSpace: "nowrap",
              }}
            >
              Current {formatGpa(averageCurrentGpa)} → Predicted{" "}
              {formatGpa(averagePredictedGpa)}
            </span>
          </div>

          <div style={{ position: "relative", height: "280px" }}>
            {metricsLoading ? (
              <div
                style={{
                  height: "100%",
                  display: "grid",
                  placeItems: "center",
                  color: "#64748b",
                  fontSize: "0.95rem",
                }}
              >
                Loading GPA trend from prediction records…
              </div>
            ) : metricsError ? (
              <div
                style={{
                  height: "100%",
                  display: "grid",
                  placeItems: "center",
                  color: "#b91c1c",
                  fontSize: "0.95rem",
                  textAlign: "center",
                  padding: "1rem",
                }}
              >
                {metricsError}
              </div>
            ) : !hasTrendData ? (
              <div
                style={{
                  height: "100%",
                  display: "grid",
                  placeItems: "center",
                  color: "#64748b",
                  fontSize: "0.95rem",
                  textAlign: "center",
                  padding: "1rem",
                  backgroundColor: "#f8fafc",
                  borderRadius: "10px",
                  border: "1px dashed #cbd5e1",
                }}
              >
                No GPA prediction data available yet. Add student grades to
                generate trend and forecast analysis.
              </div>
            ) : (
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
                      callbacks: {
                        label: (context) => {
                          const value = context.parsed.y;
                          if (value === null || value === undefined) {
                            return ` ${context.dataset.label}: —`;
                          }
                          return ` ${context.dataset.label}: ${Number(value).toFixed(2)}`;
                        },
                      },
                    },
                  },
                  scales: {
                    y: {
                      min: 1.0,
                      max: 5.0,
                      reverse: false,
                      title: {
                        display: true,
                        text: "GWA (1.00 best → 5.00)",
                        color: "#64748b",
                        font: { size: 11, weight: "600" },
                      },
                      grid: { color: "#f1f5f9" },
                      ticks: {
                        font: { size: 12, weight: "500" },
                        color: "#475569",
                        stepSize: 0.5,
                      },
                    },
                    x: {
                      title: {
                        display: true,
                        text: "Year Level",
                        color: "#64748b",
                        font: { size: 11, weight: "600" },
                      },
                      grid: { display: false },
                      ticks: { font: { size: 12, weight: "500" }, color: "#475569" },
                    },
                  },
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            )}
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
                  key={alert.id || idx}
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
