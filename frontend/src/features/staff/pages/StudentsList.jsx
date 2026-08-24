import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useDashboard } from "../../../hooks/useDashboard";
import { useToast } from "../../../components/Common/Toast";
import { api, isBackendAuthEnabled } from "../../../services/api";
import styles from "../../../styles/Dashboard.module.css";
import commonStyles from "../../../styles/Common.module.css";

const formatMetric = (value, suffix = "") => {
  if (value === null || value === undefined || value === "") return "—";
  return `${Number(value).toFixed(2)}${suffix}`;
};

const StudentsList = () => {
  const { user } = useAuth();
  const toast = useToast();
  const {
    students,
    staffMembers,
    getStudentsForStaff,
    updateStudentFilter,
    updateRiskFilter,
    directoryLoading,
    directoryError,
  } = useDashboard();
  const [searchTerm, setSearchTerm] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [predictionsByUserId, setPredictionsByUserId] = useState({});
  const [predictionsLoading, setPredictionsLoading] = useState(false);

  const isAdmin = user?.role === "admin";

  const loggedInStaff = useMemo(() => {
    if (!user || user.role !== "staff") return null;

    return (
      staffMembers.find(
        (staff) =>
          staff.id === user.id ||
          staff.email?.toLowerCase() === (user.email || "").toLowerCase(),
      ) || null
    );
  }, [staffMembers, user]);

  // Admin: all students. Staff: only students assigned to their sections.
  const visibleStudents = useMemo(() => {
    if (isAdmin) return students;
    if (!loggedInStaff) return [];
    return getStudentsForStaff(loggedInStaff.id);
  }, [getStudentsForStaff, isAdmin, loggedInStaff, students]);

  useEffect(() => {
    let isMounted = true;

    const loadPredictions = async () => {
      if (!isBackendAuthEnabled() || visibleStudents.length === 0) {
        if (isMounted) {
          setPredictionsByUserId({});
          setPredictionsLoading(false);
        }
        return;
      }

      setPredictionsLoading(true);

      try {
        const results = await Promise.all(
          visibleStudents.map(async (student) => {
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
  }, [visibleStudents]);

  const enrichedStudents = useMemo(
    () =>
      visibleStudents.map((student) => {
        const prediction = predictionsByUserId[student.user_id] || null;

        return {
          ...student,
          current_gpa: prediction?.current_gpa ?? null,
          predicted_gpa: prediction?.predicted_gpa ?? null,
          confidence_score: prediction?.confidence_score ?? null,
          risk_level: prediction?.risk_level || student.risk_level || "Low",
        };
      }),
    [visibleStudents, predictionsByUserId],
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

  const handleExport = () => {
    if (filteredStudents.length === 0) {
      toast.error("No students available to export.");
      return;
    }

    const headers = [
      "Student ID",
      "Name",
      "Year Level",
      "Current GPA",
      "Predicted GPA",
      "Confidence",
      "Risk Level",
    ];

    const rows = filteredStudents.map((student) => [
      student.student_id,
      student.full_name,
      student.yearLevel || "N/A",
      student.current_gpa == null ? "" : Number(student.current_gpa).toFixed(2),
      student.predicted_gpa == null
        ? ""
        : Number(student.predicted_gpa).toFixed(2),
      student.confidence_score == null ? "" : `${Number(student.confidence_score)}%`,
      student.risk_level || "Low",
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = isAdmin
      ? "all-students.csv"
      : "assigned-students.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("Student list exported as CSV.");
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>
        {isAdmin ? "All Students" : "Assigned Students"}
      </h1>

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
        <div className={styles.listToolbar}>
          <div className={styles.listToolbarFilters}>
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

          <button
            type="button"
            className={styles.toolbarIconButton}
            onClick={handleExport}
            title="Export to CSV"
            aria-label="Export to CSV"
            disabled={filteredStudents.length === 0}
          >
            <i className="fas fa-file-export" aria-hidden="true" />
          </button>
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
              {isAdmin
                ? "Try adjusting your search or filters"
                : "No students are assigned to your sections yet, or try adjusting your filters"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentsList;
