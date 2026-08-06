import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { api } from "../../../services/api";
import { useDashboard } from "../../../hooks/useDashboard";
import styles from "../../../styles/Dashboard.module.css";
import commonStyles from "../../../styles/Common.module.css";

const MyGradesPage = () => {
  const { user } = useAuth();
  const [gradeRecords, setGradeRecords] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [gradeError, setGradeError] = useState("");

  useEffect(() => {
    const loadGrades = async () => {
      setLoadingGrades(true);
      setGradeError("");
      try {
        const result = await api.getMyGrades();
        setGradeRecords(result.grades || []);
      } catch (error) {
        setGradeError(error.message || "Unable to load grades.");
      } finally {
        setLoadingGrades(false);
      }
    };

    if (user?.isAuthenticated) {
      loadGrades();
    }
  }, [user]);

  const gradesBySemester = gradeRecords.reduce((grouped, record) => {
    const semester = record.semester || "Unknown";
    if (!grouped[semester]) grouped[semester] = [];
    grouped[semester].push(record);
    return grouped;
  }, {});

  return (
    <div className={styles.pageShell}>
      <div className={styles.pageHeaderCard}>
        <div>
          <h1 className={styles.pageTitle}>My Grades</h1>
          <p className={styles.pageSubtitle}>
            Track your academic progress and review your grade history across
            each semester.
          </p>
        </div>
        <div className={styles.pageHeaderBadge}>Student Record</div>
      </div>

      {loadingGrades ? (
        <div className={styles.contentCard}>Loading grade records…</div>
      ) : gradeError ? (
        <div className={styles.contentCard}>{gradeError}</div>
      ) : gradeRecords.length === 0 ? (
        <div className={styles.contentCard}>
          <p className={styles.pageSubtitle}>No grade records are available yet.</p>
        </div>
      ) : (
        Object.keys(gradesBySemester).map((semester) => (
          <div key={semester} className={styles.contentCard}>
            <div className={styles.contentCardHeader}>
              <div>
                <div className={styles.contentCardEyebrow}>Semester</div>
                <div className={styles.contentCardTitle}>{semester}</div>
              </div>
              <div className={styles.contentCardHint}>
                {gradesBySemester[semester].length} subjects tracked
              </div>
            </div>

            <div className={commonStyles.tableWrapper} style={{ marginTop: 16 }}>
              <table className={commonStyles.table}>
                <thead className={commonStyles.tableHead}>
                  <tr>
                    <th>Subject</th>
                    <th>Grade</th>
                    <th>Remarks</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {gradesBySemester[semester].map((record) => (
                    <tr key={record.id} className={commonStyles.tableRow}>
                      <td>{record.subject_name}</td>
                      <td>{record.grade}</td>
                      <td>{record.remarks || "-"}</td>
                      <td>
                        {new Date(record.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default MyGradesPage;
