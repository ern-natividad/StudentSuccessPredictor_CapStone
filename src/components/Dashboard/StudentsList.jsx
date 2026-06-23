import React, { useState } from "react";
import { useDashboard } from "../../hooks/useDashboard";
import styles from "../../styles/Dashboard.module.css";
import commonStyles from "../../styles/Common.module.css";

const StudentsList = () => {
  const {
    students,
    updateStudentFilter,
    updateRiskFilter,
    getFilteredStudents,
  } = useDashboard();
  const [searchTerm, setSearchTerm] = useState("");
  const [riskLevel, setRiskLevel] = useState("");

  const handleSearch = (value) => {
    setSearchTerm(value);
    updateStudentFilter(value);
  };

  const handleRiskFilter = (value) => {
    setRiskLevel(value);
    updateRiskFilter(value);
  };

  const filteredStudents = getFilteredStudents();

  return (
    <div>
      <h1 className={styles.pageTitle}>All Students</h1>

      <div className={styles.card} style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: "6px",
              fontSize: "13px",
            }}
          />
          <select
            value={riskLevel}
            onChange={(e) => handleRiskFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: "6px",
              fontSize: "13px",
              minWidth: "140px",
            }}
          >
            <option value="">All Risk Levels</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <table className={commonStyles.table}>
          <thead className={commonStyles.tableHead}>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Year</th>
              <th>Current GPA</th>
              <th>Predicted GPA</th>
              <th>Confidence</th>
              <th>Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id} className={commonStyles.tableRow}>
                <td>{student.id}</td>
                <td>{student.name}</td>
                <td>{student.year}</td>
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

        {filteredStudents.length === 0 && (
          <div className={commonStyles.emptyState}>
            <div className={commonStyles.emptyStateIcon}>👥</div>
            <div className={commonStyles.emptyStateTitle}>
              No students found
            </div>
            <div className={commonStyles.emptyStateDescription}>
              Try adjusting your search or filters
            </div>
          </div>
        )}
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Statistics</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "12px",
          }}
        >
          <div className={commonStyles.statBlock}>
            <div className={commonStyles.statValue}>
              {students.filter((s) => s.risk === "Low").length}
            </div>
            <div className={commonStyles.statLabel}>Low Risk</div>
          </div>
          <div className={commonStyles.statBlock}>
            <div className={commonStyles.statValue}>
              {students.filter((s) => s.risk === "Medium").length}
            </div>
            <div className={commonStyles.statLabel}>Medium Risk</div>
          </div>
          <div className={commonStyles.statBlock}>
            <div className={commonStyles.statValue}>
              {students.filter((s) => s.risk === "High").length}
            </div>
            <div className={commonStyles.statLabel}>High Risk</div>
          </div>
          <div className={commonStyles.statBlock}>
            <div className={commonStyles.statValue}>
              {students.filter((s) => s.risk === "Critical").length}
            </div>
            <div className={commonStyles.statLabel}>Critical</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentsList;
