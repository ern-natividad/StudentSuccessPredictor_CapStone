import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { api, isBackendAuthEnabled, isEmptyDataError } from "../../../services/api";
import { useToast } from "../../../components/Common/Toast";
import {
  enrichGradeRecord,
  getUniqueAcademicYears,
} from "../../../utils/gradeSemesterUtils";
import styles from "../../../styles/Dashboard.module.css";

const NO_GRADES_MESSAGE =
  "No grade records are available yet. Your grades will appear here once academic staff record them.";

const SEMESTER_ORDER = ["1", "2", "S"];

const SEMESTER_LABELS = {
  "1": "First Semester",
  "2": "Second Semester",
  S: "Summer",
};

const parseNumericGrade = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const averageNumericGrades = (records) => {
  const numericOnly = records
    .map((record) => {
      if (String(record.grade ?? "").trim().toUpperCase() === "INC") return null;
      return parseNumericGrade(record.grade);
    })
    .filter((value) => value !== null);

  if (numericOnly.length === 0) return null;
  return numericOnly.reduce((sum, value) => sum + value, 0) / numericOnly.length;
};

const isPassingRecord = (record) => {
  const rawGrade = String(record.grade ?? "").trim().toUpperCase();
  if (rawGrade === "INC" || rawGrade === "") return false;

  const remark = String(record.remarks || "").toLowerCase();
  if (remark.includes("fail") || remark.includes("drop") || remark === "inc") {
    return false;
  }
  const numeric = parseNumericGrade(record.grade);
  if (numeric === null) return remark.includes("pass");
  return numeric <= 3;
};

const isFailingGrade = (grade, remarks = "") => {
  const rawGrade = String(grade ?? "").trim().toUpperCase();
  const remark = String(remarks).toLowerCase();
  if (rawGrade === "INC" || remark.includes("fail") || remark.includes("drop")) {
    return true;
  }
  const numeric = parseNumericGrade(grade);
  return numeric !== null && numeric > 3;
};

const formatGradeDisplay = (grade) => {
  if (grade === null || grade === undefined || grade === "") return "";
  const numeric = parseNumericGrade(grade);
  if (numeric === null) return String(grade).trim();
  return numeric.toFixed(2);
};

const normalizeSubjectPart = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

/**
 * Prefer DB columns: subject_code + subject_name.
 * Only fall back to parsing subject_name when code was never stored.
 */
const resolveSubject = (record) => {
  const code = normalizeSubjectPart(record.subject_code || record.code || "");
  const description = normalizeSubjectPart(
    record.subject_name ||
      record.subject_description ||
      record.description ||
      "",
  );

  if (code || description) {
    return {
      code: code || "—",
      description: description || "—",
    };
  }

  return { code: "—", description: "—" };
};

const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const MyGradesPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [gradeRecords, setGradeRecords] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [gradeError, setGradeError] = useState("");
  const [emptyMessage, setEmptyMessage] = useState("");
  const [selectedYear, setSelectedYear] = useState(null);

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

  const academicYears = useMemo(
    () => getUniqueAcademicYears(gradeRecords),
    [gradeRecords],
  );

  const gradesByYear = useMemo(() => {
    const groups = {};
    enrichedGrades.forEach((record) => {
      const year = record.academicYear || "Unknown";
      if (!groups[year]) groups[year] = [];
      groups[year].push(record);
    });
    return groups;
  }, [enrichedGrades]);

  const yearCards = useMemo(
    () =>
      academicYears.map((year) => {
        const records = gradesByYear[year] || [];
        const gwa = averageNumericGrades(records);
        return {
          year,
          courseCount: records.length,
          gwa: gwa === null ? "—" : gwa.toFixed(2),
          passed: records.filter(isPassingRecord).length,
          failed: records.filter((record) =>
            isFailingGrade(record.grade, record.remarks),
          ).length,
        };
      }),
    [academicYears, gradesByYear],
  );

  const selectedYearRecords = useMemo(() => {
    if (!selectedYear) return [];
    return gradesByYear[selectedYear] || [];
  }, [gradesByYear, selectedYear]);

  const semesterSections = useMemo(() => {
    const buckets = { "1": [], "2": [], S: [] };
    selectedYearRecords.forEach((record) => {
      const code = record.semesterCode === "—" ? "1" : record.semesterCode;
      if (!buckets[code]) buckets[code] = [];
      buckets[code].push(record);
    });

    return SEMESTER_ORDER.filter((code) => (buckets[code] || []).length > 0).map(
      (code) => ({
        code,
        label: SEMESTER_LABELS[code] || code,
        records: buckets[code],
      }),
    );
  }, [selectedYearRecords]);

  const selectedYearSummary = useMemo(() => {
    const gwa = averageNumericGrades(selectedYearRecords);
    return {
      gwa: gwa === null ? "—" : gwa.toFixed(2),
      courses: selectedYearRecords.length,
      passed: selectedYearRecords.filter(isPassingRecord).length,
    };
  }, [selectedYearRecords]);

  const overallSummary = useMemo(() => {
    const gwa = averageNumericGrades(enrichedGrades);
    return {
      gwa: gwa === null ? "—" : gwa.toFixed(2),
      courses: enrichedGrades.length,
      years: academicYears.length,
    };
  }, [enrichedGrades, academicYears]);

  const studentName =
    user?.full_name || user?.fullName || user?.name || "Student";

  const handleExportYear = () => {
    const records = selectedYear ? selectedYearRecords : enrichedGrades;
    if (records.length === 0) {
      toast.error("No grade records available to export.");
      return;
    }

    const headers = ["Subject Code", "Description", "Semester", "Academic Year", "Grade", "Remarks"];
    const rows = records.map((record) => {
      const { code, description } = resolveSubject(record);
      return [
        code,
        description,
        SEMESTER_LABELS[record.semesterCode] || record.semesterCode,
        record.academicYear,
        formatGradeDisplay(record.grade),
        record.remarks || "",
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = selectedYear
      ? `my-grades-SY-${selectedYear}.csv`
      : "my-grades.csv";
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
            {selectedYear
              ? `You are viewing grades for School Year ${selectedYear}.`
              : `Welcome, ${studentName}. Pick a school year below to open your grades.`}
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
      ) : !selectedYear ? (
        <>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{overallSummary.gwa}</div>
              <div className={styles.summaryLabel}>Overall GWA</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{overallSummary.courses}</div>
              <div className={styles.summaryLabel}>Total Courses</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{overallSummary.years}</div>
              <div className={styles.summaryLabel}>School Years</div>
            </div>
          </div>

          <div className={styles.contentCard}>
            <div className={styles.contentCardHeader}>
              <div>
                <div className={styles.contentCardEyebrow}>Academic years</div>
                <div className={styles.contentCardTitle}>Select a School Year</div>
                <p className={styles.syHelpText}>
                  Start here. Click one school year card below to open your
                  semester grades for that year.
                </p>
              </div>
            </div>

            <div className={styles.syCardGrid}>
              {yearCards.map((card) => (
                <button
                  key={card.year}
                  type="button"
                  className={styles.syYearCard}
                  onClick={() => setSelectedYear(card.year)}
                >
                  <div className={styles.syYearLabel}>School Year</div>
                  <div className={styles.syYearValue}>SY {card.year}</div>
                  <div className={styles.syYearMeta}>
                    <span>{card.courseCount} course{card.courseCount === 1 ? "" : "s"}</span>
                    <span>GWA {card.gwa}</span>
                  </div>
                  <div className={styles.syYearCta}>
                    Click to view grades
                    <i className="fas fa-arrow-right" aria-hidden="true" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{selectedYearSummary.gwa}</div>
              <div className={styles.summaryLabel}>GWA this year</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{selectedYearSummary.courses}</div>
              <div className={styles.summaryLabel}>Courses this year</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{selectedYearSummary.passed}</div>
              <div className={styles.summaryLabel}>Passed subjects</div>
            </div>
          </div>

          <div className={`${styles.contentCard} ${styles.syGradeReportCard}`}>
            <div className={styles.syBackRow}>
              <button
                type="button"
                className={styles.syBackButton}
                onClick={() => setSelectedYear(null)}
              >
                <i className="fas fa-arrow-left" aria-hidden="true" />
                Back to All School Years
              </button>
            </div>

            <div className={styles.contentCardHeader}>
              <div>
                <div className={styles.contentCardEyebrow}>Grade report</div>
                <div className={styles.contentCardTitle}>SY {selectedYear}</div>
                <p className={styles.syHelpText}>
                  Your subjects are grouped by semester. Grades in red need
                  attention (failed or incomplete).
                </p>
              </div>
              <button
                type="button"
                className={styles.syExportButton}
                onClick={handleExportYear}
                title="Download this school year as CSV"
                aria-label="Download this school year as CSV"
              >
                <i className="fas fa-file-export" aria-hidden="true" />
                Export grades
              </button>
            </div>

            <div className={styles.syTermStack}>
              {semesterSections.map((section) => (
                <div key={section.code} className={styles.syTermBlock}>
                  <div className={styles.syTermHeading}>
                    SY {selectedYear} ({section.label})
                  </div>
                  <div className={styles.syTermTableWrap}>
                    <table className={styles.syTermTable}>
                      <thead>
                        <tr>
                          <th>Subject Code</th>
                          <th>Description</th>
                          <th>Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.records.map((record, index) => {
                          const { code, description } = resolveSubject(record);
                          const failing = isFailingGrade(
                            record.grade,
                            record.remarks,
                          );
                          const gradeText = formatGradeDisplay(record.grade);

                          return (
                            <tr
                              key={record.id || `${section.code}-${index}`}
                              className={
                                index % 2 === 1 ? styles.syTermRowAlt : undefined
                              }
                            >
                              <td className={styles.syCodeCell}>{code}</td>
                              <td className={styles.syDescCell}>{description}</td>
                              <td
                                className={`${styles.syGradeCell} ${
                                  failing ? styles.syGradeFail : ""
                                }`}
                              >
                                {gradeText || "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {semesterSections.length === 0 && (
                <div className={styles.gradesEmptyState}>
                  <p className={styles.gradesEmptyTitle}>No grades for this year</p>
                  <p className={styles.gradesEmptyText}>
                    There are no posted grade records under SY {selectedYear}.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MyGradesPage;
