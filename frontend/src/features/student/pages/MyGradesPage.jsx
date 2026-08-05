import React, { useMemo } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useDashboard } from "../../../hooks/useDashboard";
import styles from "../../../styles/Dashboard.module.css";
import commonStyles from "../../../styles/Common.module.css";

const MyGradesPage = () => {
  const { user } = useAuth();
  const { students } = useDashboard();

  const currentStudent = useMemo(() => {
    return (
      students.find((student) =>
        user.name
          .toLowerCase()
          .startsWith(student.full_name.toLowerCase().split(" ")[0]),
      ) || students[0]
    );
  }, [students, user]);

  const gradeRecords = currentStudent?.grade_records || [];

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

      {gradeRecords.length === 0 ? (
        <div className={styles.contentCard}>
          <p className={styles.pageSubtitle}>No grade records are available yet.</p>
        </div>
      ) : (
        <div className={styles.contentCard} style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #8b0000 0%, #b91c1c 100%)",
              color: "#fff",
              padding: "14px 18px",
              fontWeight: 700,
              fontSize: "15px",
            }}
          >
            Grade Records
          </div>

          <div style={{ padding: "16px 18px 18px" }}>
            <div className={commonStyles.tableWrapper}>
              <table className={commonStyles.table}>
                <thead className={commonStyles.tableHead}>
                  <tr>
                    <th style={{ width: "15%" }}>Subject Code</th>
                    <th style={{ width: "60%" }}>Description</th>
                    <th style={{ width: "25%" }}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {gradeRecords.map((record, idx) => (
                    <tr key={record.id || idx} className={commonStyles.tableRow}>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "13px",
                            color: "#8b0000",
                          }}
                        >
                          {record.subject_code || record.code || "—"}
                        </span>
                      </td>
                      <td style={{ fontSize: "13px", color: "#334155" }}>
                        {record.subject_description || record.description || "—"}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: "13px" }}>
                          {record.grade ?? "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyGradesPage;
