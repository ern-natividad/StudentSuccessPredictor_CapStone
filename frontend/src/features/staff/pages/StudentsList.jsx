import React, { useEffect, useMemo, useState } from "react";
import { useDashboard } from "../../../hooks/useDashboard";
import { api, isBackendAuthEnabled } from "../../../services/api";
import styles from "../../../styles/Dashboard.module.css";
import commonStyles from "../../../styles/Common.module.css";

const formatMetric = (value, suffix = "") => {
  if (value === null || value === undefined || value === "") return "—";
  return `${Number(value).toFixed(2)}${suffix}`;
};

const StudentsList = () => {
  const {
    students,
    updateStudentFilter,
    updateRiskFilter,
    directoryLoading,
    directoryError,
  } = useDashboard();
  const [searchTerm, setSearchTerm] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [predictionsByUserId, setPredictionsByUserId] = useState({});
  const [predictionsLoading, setPredictionsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadPredictions = async () => {
      if (!isBackendAuthEnabled() || students.length === 0) {
        if (isMounted) {
          setPredictionsByUserId({});
          setPredictionsLoading(false);
        }
        return;
      }

      setPredictionsLoading(true);

      try {
        const results = await Promise.all(
          students.map(async (student) => {
            try {
              const result = await api.getStudentPrediction(student.user_id);
              return [student.user_id, result.prediction || null];
            } catch {
              return [student.user_id, null];
            }
          }),
        );

        if (isMounted) {
          setPredictionsByUserId(Object.fromEntries(results));
        }
      } finally {
        if (isMounted) {
          setPredictionsLoading(false);
        }
      }
    };

    loadPredictions();

    return () => {
      isMounted = false;
    };
  }, [students]);

  const enrichedStudents = useMemo(
    () =>
      students.map((student) => {
        const prediction = predictionsByUserId[student.user_id] || null;

        return {
          ...student,
          current_gpa: prediction?.current_gpa ?? null,
          predicted_gpa: prediction?.predicted_gpa ?? null,
          confidence_score: prediction?.confidence_score ?? null,
          risk_level: prediction?.risk_level || student.risk_level || "Low",
        };
      }),
    [students, predictionsByUserId],
  );

  const handleSearch = (value) => {
    setSearchTerm(value);
    updateStudentFilter(value);
  };

  const handleRiskFilter = (value) => {
    setRiskLevel(value);
    updateRiskFilter(value);
  };

  const filteredStudents = useMemo(() => {
    let filtered = enrichedStudents;

    if (riskLevel) {
      filtered = filtered.filter((student) => student.risk_level === riskLevel);
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          student.full_name.toLowerCase().includes(query) ||
          String(student.student_id || "").toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [enrichedStudents, riskLevel, searchTerm]);

  return (
    <div>
      <h1 className={styles.pageTitle}>All Students</h1>

      {directoryError && <div className={styles.card}>{directoryError}</div>}

      <div className={styles.card} style={{ marginBottom: "20px" }}>
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
              {enrichedStudents.filter((s) => s.risk_level === "Low").length}
            </div>
            <div className={commonStyles.statLabel}>Low Risk</div>
          </div>
          <div className={commonStyles.statBlock}>
            <div className={commonStyles.statValue}>
              {enrichedStudents.filter((s) => s.risk_level === "Medium").length}
            </div>
            <div className={commonStyles.statLabel}>Medium Risk</div>
          </div>
          <div className={commonStyles.statBlock}>
            <div className={commonStyles.statValue}>
              {enrichedStudents.filter((s) => s.risk_level === "High").length}
            </div>
            <div className={commonStyles.statLabel}>High Risk</div>
          </div>
          <div className={commonStyles.statBlock}>
            <div className={commonStyles.statValue}>
              {enrichedStudents.filter((s) => s.risk_level === "Critical").length}
            </div>
            <div className={commonStyles.statLabel}>Critical</div>
          </div>
        </div>
      </div>

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

        {/* Scrollable container for smaller screens */}
        <div style={{ overflowX: "auto" }}>
          <table
            className={commonStyles.table}
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead className={commonStyles.tableHead}>
              <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", width: "12%" }}>ID</th>
                <th style={{ padding: "12px 16px", textAlign: "left", width: "26%" }}>Name</th>
                <th style={{ padding: "12px 16px", textAlign: "center", width: "10%" }}>Year</th>
                <th style={{ padding: "12px 16px", textAlign: "center", width: "13%" }}>Current GPA</th>
                <th style={{ padding: "12px 16px", textAlign: "center", width: "13%" }}>Predicted GPA</th>
                <th style={{ padding: "12px 16px", textAlign: "center", width: "12%" }}>Confidence</th>
                <th style={{ padding: "12px 16px", textAlign: "center", width: "14%" }}>Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const riskKey = (student.risk_level || "low").toLowerCase();
                return (
                  <tr
                    key={student.student_id}
                    className={commonStyles.tableRow}
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                  >
                    <td style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600" }}>
                      {student.student_id}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "left", fontWeight: "500" }}>
                      {student.full_name}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      {student.yearLevel || "N/A"}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                      {formatMetric(student.current_gpa)}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                      {formatMetric(student.predicted_gpa)}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                      {student.confidence_score == null
                        ? "—"
                        : `${Number(student.confidence_score)}%`}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <span
                        className={`${commonStyles.riskBadge} ${
                          commonStyles[`riskBadge${riskKey.charAt(0).toUpperCase() + riskKey.slice(1)}`] || ""
                        }`}
                        style={{ display: "inline-block", textAlign: "center" }}
                      >
                        {student.risk_level || "Low"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {directoryLoading && <div className={commonStyles.emptyState}>Loading students…</div>}
        {!directoryLoading && predictionsLoading && (
          <div className={commonStyles.emptyState}>Loading grade predictions…</div>
        )}
        {!directoryLoading && !predictionsLoading && filteredStudents.length === 0 && (
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
    </div>
  );
};

export default StudentsList;