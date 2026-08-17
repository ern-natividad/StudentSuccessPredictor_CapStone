import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { api, isBackendAuthEnabled, isEmptyDataError } from "../../../services/api";
import { useToast } from "../../../components/Common/Toast";
import {
  SEMESTER_FILTER_OPTIONS,
  SEMESTER_INFO_TEXT,
  enrichGradeRecord,
  getUniqueAcademicYears,
  matchesSemesterFilter,
} from "../../../utils/gradeSemesterUtils";
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
  const [semesterFilter, setSemesterFilter] = useState("");
  const [academicYearFilter, setAcademicYearFilter] = useState("");

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

  const enrichedGrades = useMemo(
    () => gradeRecords.map(enrichGradeRecord),
    [gradeRecords],
  );

  const academicYearOptions = useMemo(
    () => getUniqueAcademicYears(gradeRecords),
    [gradeRecords],
  );

  const filteredGrades = useMemo(
    () =>
      enrichedGrades.filter(
        (record) =>
          matchesSemesterFilter(record.semester, semesterFilter) &&
          (!academicYearFilter || record.academicYear === academicYearFilter),
      ),
    [enrichedGrades, semesterFilter, academicYearFilter],
  );

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
        <div className={styles.contentCard}>
          <div className={styles.contentCardHeader}>
            <div>
              <div className={styles.contentCardEyebrow}>Grade records</div>
              <div className={styles.contentCardTitle}>Academic Grade History</div>
            </div>
            <div className={styles.contentCardHint}>
              {filteredGrades.length} of {enrichedGrades.length} records shown
            </div>
          </div>

          <div
            style={{
              marginTop: 16,
              padding: "12px 14px",
              borderRadius: 10,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              fontSize: 13,
              color: "#475569",
              lineHeight: 1.5,
            }}
          >
            {SEMESTER_INFO_TEXT}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              marginTop: 16,
            }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
                Filter by semester
              </span>
              <select
                value={semesterFilter}
                onChange={(event) => setSemesterFilter(event.target.value)}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                }}
              >
                {SEMESTER_FILTER_OPTIONS.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
                Filter by academic year
              </span>
              <select
                value={academicYearFilter}
                onChange={(event) => setAcademicYearFilter(event.target.value)}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                }}
              >
                <option value="">All academic years</option>
                {academicYearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {filteredGrades.length === 0 ? (
            <p className={styles.pageSubtitle} style={{ marginTop: 16 }}>
              No grade records match the selected filters.
            </p>
          ) : (
            <div className={commonStyles.tableWrapper} style={{ marginTop: 16 }}>
              <table className={commonStyles.table} style={{ tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "28%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "18%" }} />
                </colgroup>
                <thead className={commonStyles.tableHead}>
                  <tr>
                    <th style={{ textAlign: "left" }}>Subject</th>
                    <th style={{ textAlign: "center" }}>Semester</th>
                    <th style={{ textAlign: "center" }}>Academic Year</th>
                    <th style={{ textAlign: "center" }}>Grade</th>
                    <th style={{ textAlign: "left" }}>Remarks</th>
                    <th style={{ textAlign: "center" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGrades.map((record) => (
                    <tr key={record.id} className={commonStyles.tableRow}>
                      <td style={{ textAlign: "left", fontWeight: 600 }}>
                        {record.subject_name}
                      </td>
                      <td style={{ textAlign: "center" }}>{record.semesterCode}</td>
                      <td style={{ textAlign: "center" }}>{record.academicYear}</td>
                      <td
                        style={{
                          textAlign: "center",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {record.grade}
                      </td>
                      <td style={{ textAlign: "left" }}>{record.remarks || "-"}</td>
                      <td style={{ textAlign: "center" }}>
                        {new Date(record.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyGradesPage;
