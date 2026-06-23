import React, { useState } from "react";
import { useDashboard } from "../../hooks/useDashboard";
import styles from "../../styles/Dashboard.module.css";
import commonStyles from "../../styles/Common.module.css";

const ReportsPage = () => {
  const { students } = useDashboard();
  const [reportType, setReportType] = useState("overview");

  const generateReport = () => {
    const low = students.filter((s) => s.risk === "Low").length;
    const medium = students.filter((s) => s.risk === "Medium").length;
    const high = students.filter((s) => s.risk === "High").length;
    const critical = students.filter((s) => s.risk === "Critical").length;
    const avgGPA = (
      students.reduce((sum, s) => sum + s.gpa, 0) / students.length
    ).toFixed(2);

    return { low, medium, high, critical, avgGPA };
  };

  const report = generateReport();

  return (
    <div>
      <h1 className={styles.pageTitle}>Reports</h1>

      <div className={styles.card} style={{ marginBottom: "20px" }}>
        <div className={styles.cardTitle}>Report Type</div>
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { value: "overview", label: "Overview" },
            { value: "detailed", label: "Detailed Analysis" },
            { value: "export", label: "Export Data" },
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => setReportType(type.value)}
              style={{
                padding: "8px 16px",
                background:
                  reportType === type.value ? "#C9A200" : "transparent",
                border: `1px solid ${reportType === type.value ? "#C9A200" : "#ccc"}`,
                color: reportType === type.value ? "#0f0d08" : "#5a5240",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "13px",
              }}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {reportType === "overview" && (
        <>
          <div
            className={commonStyles.grid}
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            }}
          >
            <div className={styles.card}>
              <div className={commonStyles.metric}>
                <div className={commonStyles.metricLabel}>Total Students</div>
                <div className={commonStyles.metricValue}>
                  {students.length}
                </div>
              </div>
              <div className={commonStyles.metric}>
                <div className={commonStyles.metricLabel}>Average GPA</div>
                <div className={commonStyles.metricValue}>{report.avgGPA}</div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>Risk Distribution</div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  fontSize: "13px",
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "#2d7a4f", fontWeight: 600 }}>
                    ● Low Risk
                  </span>
                  <span>
                    {report.low} students (
                    {((report.low / students.length) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "#C9A200", fontWeight: 600 }}>
                    ● Medium Risk
                  </span>
                  <span>
                    {report.medium} students (
                    {((report.medium / students.length) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "#d47000", fontWeight: 600 }}>
                    ● High Risk
                  </span>
                  <span>
                    {report.high} students (
                    {((report.high / students.length) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "#c0392b", fontWeight: 600 }}>
                    ● Critical
                  </span>
                  <span>
                    {report.critical} students (
                    {((report.critical / students.length) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.card} style={{ marginTop: "20px" }}>
            <div className={styles.cardTitle}>Summary</div>
            <ul
              style={{
                fontSize: "13px",
                lineHeight: "1.8",
                color: "#5a5240",
                listStyle: "none",
              }}
            >
              <li>
                ✓ <strong>{report.low}</strong> students are performing at low
                risk
              </li>
              <li>
                ⚠ <strong>{report.medium}</strong> students require monitoring
              </li>
              <li>
                ⚠ <strong>{report.high}</strong> students need intervention
                support
              </li>
              <li>
                🔴 <strong>{report.critical}</strong> students in critical
                condition
              </li>
            </ul>
          </div>
        </>
      )}

      {reportType === "detailed" && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>Detailed Student Analysis</div>
          <table className={commonStyles.table}>
            <thead className={commonStyles.tableHead}>
              <tr>
                <th>Student</th>
                <th>Current GPA</th>
                <th>Predicted GPA</th>
                <th>Confidence</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className={commonStyles.tableRow}>
                  <td>{student.name}</td>
                  <td>{student.gpa.toFixed(2)}</td>
                  <td>{student.pred.toFixed(2)}</td>
                  <td>{student.conf}%</td>
                  <td>
                    <span
                      className={`${commonStyles.riskBadge} ${commonStyles["riskBadge." + student.risk.toLowerCase()]}`}
                    >
                      {student.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportType === "export" && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>Export Options</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            <button
              style={{
                padding: "12px",
                background: "#F5C200",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              📊 Export as PDF
            </button>
            <button
              style={{
                padding: "12px",
                background: "#F5C200",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              📋 Export as CSV
            </button>
            <button
              style={{
                padding: "12px",
                background: "#F5C200",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              📈 Export as Excel
            </button>
          </div>
          <p style={{ fontSize: "12px", color: "#a89870", marginTop: "12px" }}>
            Exported reports will include all student data, predictions, and
            risk assessments.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
