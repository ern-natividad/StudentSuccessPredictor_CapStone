import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { api, isBackendAuthEnabled, isEmptyDataError } from "../../../services/api";
import { useToast } from "../../../components/Common/Toast";
import {
  SEMESTER_FILTER_OPTIONS,
  enrichGradeRecord,
  getUniqueAcademicYears,
  matchesSemesterFilter,
} from "../../../utils/gradeSemesterUtils";
import styles from "../../../styles/Dashboard.module.css";
import commonStyles from "../../../styles/Common.module.css";

const NO_GRADES_MESSAGE =
  "No grade records are available yet. Your grades will appear here once academic staff record them.";

const SEMESTER_LABELS = {
  "1": "1st Semester",
  "2": "2nd Semester",
  S: "Summer",
};

const parseNumericGrade = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const averageNumericGrades = (records) => {
  const values = records
    .map((record) => parseNumericGrade(record.grade))
    .filter((value) => value !== null);
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const isPassingRecord = (record) => {
  const remark = String(record.remarks || "").toLowerCase();
  if (remark.includes("fail") || remark.includes("drop") || remark === "inc") {
    return false;
  }
  const numeric = parseNumericGrade(record.grade);
  if (numeric === null) return remark.includes("pass");
  return numeric <= 3;
};

const getGradeTone = (grade, remarks = "") => {
  const remark = String(remarks).toLowerCase();
  if (
    remark.includes("fail") ||
    remark.includes("drop") ||
    remark.includes("incomplete") ||
    remark === "inc"
  ) {
    return "fail";
  }
  const numeric = parseNumericGrade(grade);
  if (numeric === null) return "neutral";
  if (numeric <= 1.75) return "excellent";
  if (numeric <= 2.5) return "good";
  if (numeric <= 3) return "pass";
  return "fail";
};

const formatSemesterLabel = (code) => SEMESTER_LABELS[code] || code || "—";

const formatRecordedDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const gradeToneClass = {
  excellent: styles.gradeValueExcellent,
  good: styles.gradeValueGood,
  pass: styles.gradeValuePass,
  fail: styles.gradeValueFail,
  neutral: styles.gradeValueNeutral,
};

const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

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

  const summary = useMemo(() => {
    const gwa = averageNumericGrades(filteredGrades);
    const passed = filteredGrades.filter(isPassingRecord).length;
    return {
      gwa: gwa === null ? "—" : gwa.toFixed(2),
      courses: filteredGrades.length,
      passed,
      attention: Math.max(filteredGrades.length - passed, 0),
    };
  }, [filteredGrades]);

  const studentName =
    user?.full_name || user?.fullName || user?.name || "Student";

  const handleExport = () => {
    if (filteredGrades.length === 0) {
      toast.error("No grade records available to export.");
      return;
    }

    const headers = [
      "Subject",
      "Semester",
      "Academic Year",
      "Grade",
      "Remarks",
      "Date Posted",
    ];

    const rows = filteredGrades.map((record) => [
      record.subject_name,
      formatSemesterLabel(record.semesterCode),
      record.academicYear,
      record.grade,
      record.remarks || "",
      formatRecordedDate(record.created_at),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "my-grades.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("Grade records exported as CSV.");
  };

  return (
    <div className={styles.pageShell}>
      <div className={styles.pageHeaderCard}>
        <div>
          <h1 className={styles.pageTitle}>My Grades</h1>
          <p className={styles.pageSubtitle}>
            Official academic record for {studentName}. Review your GWA and
            course marks by semester.
          </p>
        </div>
        <div className={styles.pageHeaderBadge}>Student Portal</div>
      </div>

      {loadingGrades ? (
        <div className={styles.contentCard}>
          <div className={styles.gradesEmptyState}>
            <div className={styles.gradesEmptyIcon}>
              <i className="fas fa-spinner fa-spin" aria-hidden="true" />
            </div>
            <p className={styles.gradesEmptyTitle}>Loading grades</p>
            <p className={styles.gradesEmptyText}>
              Fetching your latest academic records…
            </p>
          </div>
        </div>
      ) : gradeError ? (
        <div className={styles.contentCard}>
          <div className={styles.gradesEmptyState}>
            <div className={styles.gradesEmptyIcon}>
              <i className="fas fa-exclamation-circle" aria-hidden="true" />
            </div>
            <p className={styles.gradesEmptyTitle}>Unable to load grades</p>
            <p className={styles.gradesEmptyText}>{gradeError}</p>
          </div>
        </div>
      ) : gradeRecords.length === 0 ? (
        <div className={styles.contentCard}>
          <div className={styles.gradesEmptyState}>
            <div className={styles.gradesEmptyIcon}>
              <i className="fas fa-book-open" aria-hidden="true" />
            </div>
            <p className={styles.gradesEmptyTitle}>No grades posted yet</p>
            <p className={styles.gradesEmptyText}>
              {emptyMessage || NO_GRADES_MESSAGE}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{summary.gwa}</div>
              <div className={styles.summaryLabel}>Average GWA</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{summary.courses}</div>
              <div className={styles.summaryLabel}>Courses</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{summary.passed}</div>
              <div className={styles.summaryLabel}>Passed</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{summary.attention}</div>
              <div className={styles.summaryLabel}>Needs attention</div>
            </div>
          </div>

          <div className={styles.contentCard}>
            <div className={styles.contentCardHeader}>
              <div>
                <div className={styles.contentCardEyebrow}>Academic record</div>
                <div className={styles.contentCardTitle}>Grade History</div>
              </div>
              <div className={styles.contentCardHint}>
                {filteredGrades.length} of {enrichedGrades.length} courses
              </div>
            </div>

            <div className={styles.listToolbar} style={{ marginTop: 16 }}>
              <div className={styles.listToolbarFilters}>
                <select
                  className={styles.gradesFilterSelect}
                  value={semesterFilter}
                  onChange={(event) => setSemesterFilter(event.target.value)}
                  aria-label="Filter by semester"
                >
                  {SEMESTER_FILTER_OPTIONS.map((option) => (
                    <option key={option.value || "all"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  className={styles.gradesFilterSelect}
                  value={academicYearFilter}
                  onChange={(event) => setAcademicYearFilter(event.target.value)}
                  aria-label="Filter by academic year"
                  style={{ minWidth: 160 }}
                >
                  <option value="">All academic years</option>
                  {academicYearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className={styles.toolbarIconButton}
                onClick={handleExport}
                title="Export to CSV"
                aria-label="Export to CSV"
                disabled={filteredGrades.length === 0}
              >
                <i className="fas fa-file-export" aria-hidden="true" />
              </button>
            </div>

            {filteredGrades.length === 0 ? (
              <div className={styles.gradesEmptyState}>
                <div className={styles.gradesEmptyIcon}>
                  <i className="fas fa-filter" aria-hidden="true" />
                </div>
                <p className={styles.gradesEmptyTitle}>No matching courses</p>
                <p className={styles.gradesEmptyText}>
                  No grade records match the selected filters. Try another
                  semester or academic year.
                </p>
              </div>
            ) : (
              <div className={styles.gradesTableShell}>
                <div className={commonStyles.tableWrapper}>
                  <table className={`${commonStyles.table} ${styles.gradesTable}`}>
                    <colgroup>
                      <col style={{ width: "32%" }} />
                      <col style={{ width: "16%" }} />
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "12%" }} />
                    </colgroup>
                    <thead className={commonStyles.tableHead}>
                      <tr>
                        <th style={{ textAlign: "left" }}>Course</th>
                        <th style={{ textAlign: "left" }}>Semester</th>
                        <th style={{ textAlign: "center" }}>Academic Year</th>
                        <th style={{ textAlign: "center" }}>Grade</th>
                        <th style={{ textAlign: "left" }}>Remarks</th>
                        <th style={{ textAlign: "center" }}>Posted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGrades.map((record) => {
                        const tone = getGradeTone(record.grade, record.remarks);
                        return (
                          <tr key={record.id} className={commonStyles.tableRow}>
                            <td style={{ textAlign: "left" }}>
                              <span className={styles.gradesSubjectName}>
                                {record.subject_name}
                              </span>
                            </td>
                            <td style={{ textAlign: "left" }}>
                              <span className={styles.gradesMutedText}>
                                {formatSemesterLabel(record.semesterCode)}
                              </span>
                            </td>
                            <td
                              style={{ textAlign: "center" }}
                              className={styles.gradesMutedText}
                            >
                              {record.academicYear}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <span
                                className={`${styles.gradeValueBadge} ${gradeToneClass[tone]}`}
                              >
                                {record.grade}
                              </span>
                            </td>
                            <td style={{ textAlign: "left" }}>
                              {record.remarks ? (
                                <span className={styles.gradeRemarkBadge}>
                                  {record.remarks}
                                </span>
                              ) : (
                                <span className={styles.gradesMutedText}>—</span>
                              )}
                            </td>
                            <td
                              style={{ textAlign: "center" }}
                              className={styles.gradesMutedText}
                            >
                              {formatRecordedDate(record.created_at)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MyGradesPage;
