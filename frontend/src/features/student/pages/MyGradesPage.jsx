import { useEffect, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { api, isBackendAuthEnabled, isEmptyDataError } from "../../../services/api";
import { useToast } from "../../../components/Common/Toast";
import styles from "../../../styles/Dashboard.module.css";
import commonStyles from "../../../styles/Common.module.css";

const NO_GRADES_MESSAGE =
  "No grade records are available yet. Your grades will appear here once academic staff record them.";

const MyGradesPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [gradeRecords, setGradeRecords] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [gradeError, setGradeError] = useState("");
  const [emptyMessage, setEmptyMessage] = useState("");

  useEffect(() => {
    const loadGrades = async () => {
      setLoadingGrades(true);
      setGradeError("");
      setEmptyMessage("");

      if (!isBackendAuthEnabled() || !user?.isAuthenticated) {
        setGradeError("Sign in with backend authentication to view your grades.");
        setLoadingGrades(false);
        return;
      }

      try {
        const result = await api.getMyGrades();
        const grades = result.grades || [];
        setGradeRecords(grades);
        if (grades.length === 0) {
          setEmptyMessage(NO_GRADES_MESSAGE);
        }
      } catch (error) {
        if (isEmptyDataError(error)) {
          setGradeRecords([]);
          setEmptyMessage(NO_GRADES_MESSAGE);
          setGradeError("");
        } else {
          const message = error.message || "Unable to load grades.";
          setGradeError(message);
          toast.error(message);
        }
      } finally {
        setLoadingGrades(false);
      }
    };

    loadGrades();
  }, [user?.isAuthenticated, toast]);

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
          <p className={styles.pageSubtitle}>{emptyMessage || NO_GRADES_MESSAGE}</p>
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
