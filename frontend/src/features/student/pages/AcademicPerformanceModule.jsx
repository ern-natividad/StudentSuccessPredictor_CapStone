import { useEffect, useMemo, useRef, useState } from "react";
import ModuleShell from "../../../components/Common/ModuleShell";
import { useToast } from "../../../components/Common/Toast";
import { api, isBackendAuthEnabled } from "../../../services/api";
import styles from "../../../styles/Modules.module.css";

const moduleLinks = [
  {
    key: "pre-enrollment",
    label: "Degree Recommendation",
    path: "/modules/pre-enrollment",
  },
  {
    key: "academic-performance",
    label: "Performance Forecasting",
    path: "/modules/academic-performance",
  },
  {
    key: "ai-advising",
    label: "AI Advising",
    path: "/modules/ai-advising",
  },
];

const ACADEMIC_YEARS = ["2026-2027", "2025-2026", "2024-2025", "2023-2024"];
const RISK_OPTIONS = ["All", "Low", "Medium", "High", "Critical"];

const AcademicPerformanceModule = () => {
  const toast = useToast();
  const [filters, setFilters] = useState({
    program: "All",
    yearLevel: "All",
    risk: "All",
    academicYear: ACADEMIC_YEARS[0],
  });
  const [search, setSearch] = useState("");
  const [forecasts, setForecasts] = useState([]);
  const [summary, setSummary] = useState({
    totalStudents: 0,
    mae: 0,
    moderateRisk: 0,
    highRisk: 0,
  });
  const [programOptions, setProgramOptions] = useState(["All"]);
  const [yearLevelOptions, setYearLevelOptions] = useState(["All"]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const hasSyncedRef = useRef(false);

  const loadForecasts = async ({ sync = true, showLoader = true } = {}) => {
    if (!isBackendAuthEnabled()) {
      setError("Sign in with backend authentication to view academic performance forecasts.");
      setForecasts([]);
      setLoading(false);
      return;
    }

    if (showLoader) setLoading(true);
    else setRefreshing(true);
    setError("");

    try {
      const result = await api.getAcademicPerformanceForecasts({
        academicYear: filters.academicYear,
        riskLevel: filters.risk === "All" ? "" : filters.risk,
        program: filters.program === "All" ? "" : filters.program,
        search,
        sync: sync ? "true" : "false",
      });

      const rows = result.forecasts || [];
      setForecasts(rows);
      setSummary(
        result.summary || {
          totalStudents: rows.length,
          mae: 0,
          moderateRisk: 0,
          highRisk: 0,
        },
      );

      setProgramOptions([
        "All",
        ...new Set(rows.map((row) => row.program).filter(Boolean)),
      ]);
      setYearLevelOptions([
        "All",
        ...new Set(rows.map((row) => row.year_level).filter(Boolean)),
      ]);
    } catch (requestError) {
      setError(requestError.message || "Unable to load academic performance forecasts.");
      setForecasts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const shouldSync = !hasSyncedRef.current;
    if (shouldSync) hasSyncedRef.current = true;
    loadForecasts({ sync: shouldSync });
  }, [filters.academicYear, filters.risk, filters.program]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadForecasts({ sync: false, showLoader: false });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const filteredStudents = useMemo(() => {
    if (filters.yearLevel === "All") return forecasts;

    return forecasts.filter((student) => student.year_level === filters.yearLevel);
  }, [filters.yearLevel, forecasts]);

  const riskClass = (risk) => {
    switch (risk) {
      case "Low":
        return styles.statusLow;
      case "Medium":
        return styles.statusMedium;
      case "High":
        return styles.statusHigh;
      default:
        return styles.statusCritical;
    }
  };

  const handleRefresh = async () => {
    await loadForecasts({ sync: true, showLoader: false });
    toast.success("Academic performance forecasts refreshed.");
  };

  const handleExport = () => {
    if (filteredStudents.length === 0) {
      toast.error("No records available to export.");
      return;
    }

    const headers = [
      "Student ID",
      "Name",
      "Program",
      "Year Level",
      "Actual GWA",
      "Predicted GWA",
      "Abs. Error",
      "Error Rate (%)",
      "Risk Level",
      "Recommendation",
    ];

    const rows = filteredStudents.map((student) => [
      student.student_id,
      student.full_name,
      student.program,
      student.year_level,
      Number(student.current_gpa).toFixed(2),
      Number(student.predicted_gpa).toFixed(2),
      Number(student.abs_error || 0).toFixed(2),
      Number(student.percent_error || 0).toFixed(1),
      student.risk_level,
      student.recommendation,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `academic-performance-${filters.academicYear}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <ModuleShell
      title="Academic Performance Forecasting and Early Warning Module"
      description="Predict student academic performance, monitor model accuracy, and identify learners requiring intervention."
      activeKey="academic-performance"
      menuItems={moduleLinks}
    >
      <div className={styles.metricGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Total Students</div>
          <div className={styles.metricValue}>{summary.totalStudents}</div>
          <div className={styles.metricSubtext}>Active student cohort</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Prediction MAE</div>
          <div className={styles.metricValue}>{Number(summary.mae || 0).toFixed(2)}</div>
          <div className={styles.metricSubtext}>Mean Absolute Error (GWA)</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Predicted Moderate Risk</div>
          <div className={styles.metricValue}>{summary.moderateRisk}</div>
          <div className={styles.metricSubtext}>Monitor progress closely</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Predicted High Risk</div>
          <div className={styles.metricValue}>{summary.highRisk}</div>
          <div className={styles.metricSubtext}>Intervention required</div>
        </div>
      </div>

      <div className={styles.moduleCard}>
        <div className={styles.moduleTitleSmall}>
          Student Prediction & Error Analysis
        </div>
        <div className={styles.performanceToolbar}>
          <div className={styles.performanceFilters}>
            <input
              type="search"
              className={styles.formInput}
              placeholder="Search student, ID, or program"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className={styles.formSelect}
              value={filters.program}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, program: event.target.value }))
              }
            >
              {programOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              className={styles.formSelect}
              value={filters.yearLevel}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, yearLevel: event.target.value }))
              }
            >
              {yearLevelOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "All" ? "All Year Levels" : option}
                </option>
              ))}
            </select>
            <select
              className={styles.formSelect}
              value={filters.risk}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, risk: event.target.value }))
              }
            >
              {RISK_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <select
              className={styles.formSelect}
              value={filters.academicYear}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  academicYear: event.target.value,
                }))
              }
            >
              {ACADEMIC_YEARS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.performanceActions}>
            <button
              type="button"
              className={styles.performanceIconButton}
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh data"
              aria-label="Refresh data"
            >
              <i
                className={`fas fa-arrows-rotate${refreshing ? " fa-spin" : ""}`}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              className={styles.performanceIconButton}
              onClick={handleExport}
              title="Export to CSV"
              aria-label="Export to CSV"
            >
              <i className="fas fa-file-export" aria-hidden="true" />
            </button>
          </div>
        </div>

        {error && <div className={styles.placeholderChart}>{error}</div>}

        <div className={styles.performanceTableWrapper}>
          {loading ? (
            <div className={styles.placeholderChart}>Loading performance forecasts…</div>
          ) : filteredStudents.length === 0 ? (
            <div className={styles.placeholderChart}>
              <div>No student prediction records are available yet.</div>
            </div>
          ) : (
            <table className={styles.performanceTable}>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Program</th>
                  <th>Year Level</th>
                  <th>Actual GWA</th>
                  <th>Predicted GWA</th>
                  <th>Abs. Error</th>
                  <th>Error Rate</th>
                  <th>Risk Level</th>
                  <th>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={`${student.student_id}-${student.prediction_id || student.academic_year}`}>
                    <td>{student.student_id}</td>
                    <td className={styles.studentNameCell}>{student.full_name}</td>
                    <td>{student.program}</td>
                    <td className={styles.numericCell}>{student.year_level}</td>
                    <td className={styles.numericCell}>
                      {Number(student.current_gpa).toFixed(2)}
                    </td>
                    <td className={styles.numericCell}>
                      {Number(student.predicted_gpa).toFixed(2)}
                    </td>
                    <td className={styles.numericCell}>
                      {Number(student.abs_error || 0).toFixed(2)}
                    </td>
                    <td className={styles.numericCell}>
                      {Number(student.percent_error || 0).toFixed(1)}%
                    </td>
                    <td className={styles.numericCell}>
                      <span
                        className={`${styles.statusChip} ${riskClass(
                          student.risk_level,
                        )}`}
                      >
                        {student.risk_level}
                      </span>
                    </td>
                    <td className={styles.recommendationCell}>
                      {student.recommendation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ModuleShell>
  );
};

export default AcademicPerformanceModule;
