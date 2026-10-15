import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import ModuleShell from "../../../components/Common/ModuleShell";
import { useToast } from "../../../components/Common/Toast";
import { downloadStyledExcel } from "../../../utils/exportStyledExcel";
import { downloadRecommendationPdf } from "../../../utils/downloadRecommendationPdf";
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

const initialForm = {
  applicantId: "",
  fullName: "",
  sex: "",
  age: "",
  strand: "",
  gwa: "",
  cetMath: "",
  cetScience: "",
  cetEnglish: "",
  cetReading: "",
  cetAbstract: "",
  eat: "",
  screening: "",
  attendanceRate: "",
  studyHours: "",
  libraryVisits: "",
  socioeconomicCategory: "",
};

const PreEnrollmentModule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();
  const exportMenuRef = useRef(null);
  const [formData, setFormData] = useState(initialForm);
  const [recommendation, setRecommendation] = useState(null);
  const [recommendationHistory, setRecommendationHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(
    user?.role === "admin" && isBackendAuthEnabled(),
  );
  const [historyError, setHistoryError] = useState("");
  const [isRecommending, setIsRecommending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const historyMessage =
    user?.role === "admin" && !isBackendAuthEnabled()
      ? "Recommendation history requires backend authentication."
      : historyError;

  // Public landing entry only (`/pre-enrollment` from Home CTA).
  // Authenticated staff/admin use `/modules/pre-enrollment` and should not see this.
  const showLandingBack =
    location.pathname === "/pre-enrollment" ||
    Boolean(location.state?.fromLanding);

  const filteredHistory = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return recommendationHistory
      .map((record) => ({
        id: record.id,
        applicantId: record.applicant_id,
        name: record.full_name,
        program: record.recommended_program || "No eligible program",
        confidence: record.composite_score,
        status: record.status,
      }))
      .filter(
        (record) =>
          !query ||
          record.applicantId?.toLowerCase().includes(query) ||
          record.name?.toLowerCase().includes(query),
      );
  }, [recommendationHistory, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target)
      ) {
        setExportMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (user?.role !== "admin") return;
    if (!isBackendAuthEnabled()) return;
    let cancelled = false;
    api
      .getProgramRecommendationHistory()
      .then((response) => {
        if (!cancelled) {
          setRecommendationHistory(response.records || []);
          setHistoryError("");
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setHistoryError(error.message || "Unable to load recommendation history.");
          toast.error("Unable to load recommendation history.");
        }
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.role, toast]);

  useEffect(() => {
    let cancelled = false;
    api
      .getNextProgramApplicantId()
      .then(({ applicantId }) => {
        if (!cancelled) {
          setFormData((current) =>
            current.applicantId ? current : { ...current, applicantId },
          );
        }
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(error.message || "Unable to generate an applicant ID.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [toast]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleResetForm = async () => {
    setRecommendation(null);
    setFormData(initialForm);
    try {
      const { applicantId } = await api.getNextProgramApplicantId();
      setFormData({ ...initialForm, applicantId });
    } catch (error) {
      toast.error(error.message || "Unable to generate an applicant ID.");
    }
  };

  const handleRecommend = async () => {
    if (isRecommending) return;
    setIsRecommending(true);

    try {
      const result = await api.recommendProgram({
        applicantId: formData.applicantId,
        fullName: formData.fullName,
        strand: formData.strand,
        gwa: formData.gwa,
        cetScores: {
          math: formData.cetMath,
          science: formData.cetScience,
          english: formData.cetEnglish,
          reading: formData.cetReading,
          abstract: formData.cetAbstract,
        },
        eatScore: formData.eat,
        screeningScore: formData.screening,
        nonAcademic: {
          socioeconomicCategory: formData.socioeconomicCategory,
        },
      });
      setRecommendation(result);
      setFormData((current) => ({
        ...current,
        applicantId: result.applicantId,
      }));
      toast.success("Recommendation saved to history.");
      try {
        const { applicantId } = await api.getNextProgramApplicantId();
        setFormData((current) => ({ ...current, applicantId }));
      } catch (error) {
        toast.error(
          `Recommendation saved, but a new applicant ID could not be generated: ${error.message}`,
        );
      }

      if (user?.role === "admin") {
        try {
          const response = await api.getProgramRecommendationHistory();
          setRecommendationHistory(response.records || []);
          setHistoryError("");
        } catch (error) {
          setHistoryError(error.message || "Unable to refresh recommendation history.");
          toast.error("Recommendation was saved, but history could not be refreshed.");
        }
      }
    } catch (error) {
      toast.error(error.message || "Unable to generate degree recommendations.");
    } finally {
      setIsRecommending(false);
    }
  };

  const getExportRows = () => filteredHistory;

  const handleExportExcel = async () => {
    setExportMenuOpen(false);
    const rows = getExportRows();

    if (rows.length === 0) {
      toast.error("No records available to export.");
      return;
    }

    try {
      await downloadStyledExcel({
        fileName: "pre-enrollment-recommendations.xlsx",
        sheetName: "Recommendations",
        title: "Pre-Enrollment Degree Recommendations",
        subtitle: "WMSU HAWKS · Student Success Predictor",
        meta: [
          {
            label: "Search",
            value: searchTerm.trim() || "None",
          },
          { label: "Records", value: String(rows.length) },
        ],
        columns: [
          { header: "Applicant ID", width: 16 },
          { header: "Name", width: 26 },
          { header: "Program", width: 22 },
          { header: "Composite Score", width: 16, align: "center" },
          { header: "Status", width: 14, align: "center" },
        ],
        rows: rows.map((item) => [
          item.applicantId,
          item.name,
          item.program,
          item.confidence === null ? "N/A" : `${item.confidence}%`,
          item.status,
        ]),
      });
      toast.success("Recommendation history exported as Excel.");
    } catch (exportError) {
      console.error(exportError);
      toast.error("Unable to export recommendation history.");
    }
  };

  const handleExportPDF = () => {
    setExportMenuOpen(false);

    try {
      downloadRecommendationPdf(getExportRows());
      toast.success("Recommendation history downloaded as PDF.");
    } catch (exportError) {
      toast.error(exportError.message || "Unable to download recommendation history.");
    }
  };

  const toggleExportMenu = () => {
    setExportMenuOpen((current) => !current);
  };

  return (
    <ModuleShell
      title="Pre-Enrollment Degree Recommendation Module"
      description="Assist admission personnel in recommending the most suitable engineering degree program for incoming applicants based on their academic profile, CET components, and non-academic activities."
      activeKey="pre-enrollment"
      menuItems={moduleLinks}
      onBack={showLandingBack ? () => navigate("/") : undefined}
    >
      <div className={styles.sectionGrid} style={{ gap: "12px" }}>
        {/* Left Column: Input Form */}
        <div className={styles.moduleCard} style={{ padding: "1.25rem" }}>
          <div
            className={styles.moduleTitleSmall}
            style={{ marginBottom: "0.75rem" }}
          >
            Applicant Profile & CET Scores
          </div>

          <div className={styles.formGrid} style={{ gap: "0.75rem" }}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Applicant ID</label>
              <input
                className={styles.formInput}
                name="applicantId"
                value={formData.applicantId}
                readOnly
                placeholder="Generating applicant ID..."
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Name</label>
              <input
                className={styles.formInput}
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter name"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Senior High Strand</label>
              <select
                className={styles.formSelect}
                name="strand"
                value={formData.strand}
                onChange={handleChange}
              >
                <option value="">Select strand</option>
                <option value="STEM">STEM</option>
                <option value="ABM">ABM</option>
                <option value="HUMSS">HUMSS</option>
                <option value="GAS">GAS</option>
              </select>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>SHS Overall GWA</label>
              <input
                className={styles.formInput}
                name="gwa"
                value={formData.gwa}
                onChange={handleChange}
                placeholder="e.g. 92.5"
              />
            </div>

            {/* CET Subtest Components */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                CET - Quantitative (Mathematics)
              </label>
              <input
                type="number"
                className={styles.formInput}
                name="cetMath"
                value={formData.cetMath}
                onChange={handleChange}
                placeholder="0 - 100"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>CET - Science</label>
              <input
                type="number"
                className={styles.formInput}
                name="cetScience"
                value={formData.cetScience}
                onChange={handleChange}
                placeholder="0 - 100"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>CET - English</label>
              <input
                type="number"
                className={styles.formInput}
                name="cetEnglish"
                value={formData.cetEnglish}
                onChange={handleChange}
                placeholder="0 - 100"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>CET - Reading Comp.</label>
              <input
                type="number"
                className={styles.formInput}
                name="cetReading"
                value={formData.cetReading}
                onChange={handleChange}
                placeholder="0 - 100"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                CET - Abstract Reasoning
              </label>
              <input
                type="number"
                className={styles.formInput}
                name="cetAbstract"
                value={formData.cetAbstract}
                onChange={handleChange}
                placeholder="0 - 100"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>EAT Score</label>
              <input
                className={styles.formInput}
                name="eat"
                value={formData.eat}
                onChange={handleChange}
                placeholder="Engineering Aptitude"
              />
            </div>
            <div className={styles.formField} style={{ gridColumn: "span 2" }}>
              <label className={styles.formLabel}>
                Interview Screening Score
              </label>
              <input
                className={styles.formInput}
                name="screening"
                value={formData.screening}
                onChange={handleChange}
                placeholder="Screening score"
              />
            </div>
          </div>

          {/* Non-Academic Profile Section */}
          <div
            style={{
              marginTop: "1rem",
              paddingTop: "0.75rem",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <div
              className={styles.moduleTitleSmall}
              style={{ marginBottom: "0.75rem" }}
            >
              Non-Academic Profile
            </div>
            <div className={styles.formGrid} style={{ gap: "0.75rem" }}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Attendance Rate (%)</label>
                <input
                  type="number"
                  className={styles.formInput}
                  name="attendanceRate"
                  value={formData.attendanceRate}
                  onChange={handleChange}
                  placeholder="0 - 100"
                  min="0"
                  max="100"
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>
                  Study Hours per Week (hr/s)
                </label>
                <input
                  type="number"
                  className={styles.formInput}
                  name="studyHours"
                  value={formData.studyHours}
                  onChange={handleChange}
                  placeholder="e.g. 15"
                  min="0"
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>
                  Library Usage Frequency (number visits)
                </label>
                <input
                  type="number"
                  className={styles.formInput}
                  name="libraryVisits"
                  value={formData.libraryVisits}
                  onChange={handleChange}
                  placeholder="e.g. 5"
                  min="0"
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>
                  Socioeconomic Category
                </label>
                <select
                  className={styles.formSelect}
                  name="socioeconomicCategory"
                  value={formData.socioeconomicCategory}
                  onChange={handleChange}
                >
                  <option value="">Select category</option>
                  <option value="Low Income (Under Php 24,164)">
                    Low Income (Under Php 24,164)
                  </option>
                  <option value="Lower Middle Income (Php 24,164 - Php 48,328)">
                    Lower Middle Income (Php 24,164 - Php 48,328)
                  </option>
                  <option value="Middle Income (Php 48,328 - Php 84,574)">
                    Middle Income (Php 48,328 - Php 84,574)
                  </option>
                  <option value="Upper Middle Income (Php 84,574 - Php 144,984)">
                    Upper Middle Income (Php 84,574 - Php 144,984)
                  </option>
                  <option value="Upper Income (Php 144,984 and above)">
                    Upper Income (Php 144,984 and above)
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div
            className={styles.buttonGroup}
            style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem" }}
          >
            <button
              className={styles.primaryButton}
              onClick={handleRecommend}
              disabled={isRecommending}
              style={{
                flex: 2,
                backgroundColor: "#800000",
                color: "#ffffff",
                padding: "0.6rem 1rem",
                borderRadius: "6px",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
              }}
            >
              {isRecommending
                ? "Saving Recommendation..."
                : "Recommend Degree Programs"}
            </button>
            <button
              className={styles.secondaryButton}
              onClick={handleResetForm}
              style={{
                flex: 1,
                backgroundColor: "#f1f5f9",
                color: "#475569",
                padding: "0.6rem 1rem",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Reset Form
            </button>
          </div>
        </div>

        {/* Right Column: Recommendation Summary */}
        <div className={styles.moduleCard} style={{ padding: "1.25rem" }}>
          <div
            className={styles.moduleTitleSmall}
            style={{ marginBottom: "0.75rem" }}
          >
            Recommendation Summary
          </div>

          {recommendation ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div>
                <p className={styles.moduleSubtitle}>
                  Overall CET-OAPR: <strong>{recommendation.overallCET}%</strong>
                </p>
                {recommendation.programs.length > 0 ? (
                  <>
                    <p className={styles.moduleSubtitle}>
                      Recommended program: <strong>{recommendation.recommendedProgram}</strong>
                    </p>
                    <div className={styles.metricGrid}>
                      {recommendation.programs.map((program) => (
                        <div
                          key={program.programId}
                          className={styles.metricCard}
                          style={{
                            padding: "0.85rem",
                            borderRadius: "8px",
                            background: "#fafafa",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <div
                            className={styles.metricLabel}
                            style={{ fontWeight: "600", fontSize: "13px" }}
                          >
                            {program.name}
                          </div>
                          <div
                            className={styles.metricValue}
                            style={{
                              color: "#800000",
                              fontSize: "22px",
                              fontWeight: "700",
                              marginTop: "4px",
                            }}
                          >
                            {program.compositeScore}%
                          </div>
                          <div
                            className={styles.metricSubtext}
                            style={{ fontSize: "11px", color: "#64748b" }}
                          >
                            Composite score · CET-OAPR minimum {program.minimumCetOapr}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className={styles.moduleSubtitle}>
                    Overall CET-OAPR does not meet the minimum threshold for any listed
                    engineering program.
                  </p>
                )}
              </div>

              <div
                className={styles.moduleCardSmall}
                style={{
                  background: "#f8fafc",
                  padding: "0.85rem",
                  borderRadius: "6px",
                }}
              >
                <div
                  className={styles.moduleTitleSmall}
                  style={{ fontSize: "12px", color: "#475569" }}
                >
                  Assessment Rationale
                </div>
                <p
                  className={styles.moduleSubtitle}
                  style={{ margin: "4px 0 0", fontSize: "13px" }}
                >
                  {recommendation.explanation}
                </p>
              </div>

              <div
                className={styles.infoBlock}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div
                  className={styles.infoRow}
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span
                    className={styles.infoLabel}
                    style={{
                      fontWeight: "600",
                      fontSize: "13px",
                      color: "#64748b",
                    }}
                  >
                    Academic Strengths:
                  </span>
                  <span
                    className={styles.infoValue}
                    style={{ fontSize: "13px", color: "#1e293b" }}
                  >
                    {recommendation.strengths.join(", ")}
                  </span>
                </div>
                <div
                  className={styles.infoRow}
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span
                    className={styles.infoLabel}
                    style={{
                      fontWeight: "600",
                      fontSize: "13px",
                      color: "#64748b",
                    }}
                  >
                    Non-Academic Profile:
                  </span>
                  <span
                    className={styles.infoValue}
                    style={{ fontSize: "13px", color: "#1e293b" }}
                  >
                    Attendance: {formData.attendanceRate ? `${formData.attendanceRate}%` : "N/A"} · 
                    Study: {formData.studyHours ? `${formData.studyHours} hrs/wk` : "N/A"} · 
                    Library: {formData.libraryVisits ? `${formData.libraryVisits} visits` : "N/A"}
                  </span>
                </div>
                <div
                  className={styles.infoRow}
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span
                    className={styles.infoLabel}
                    style={{
                      fontWeight: "600",
                      fontSize: "13px",
                      color: "#64748b",
                    }}
                  >
                    Areas for Growth:
                  </span>
                  <span
                    className={styles.infoValue}
                    style={{ fontSize: "13px", color: "#1e293b" }}
                  >
                    {recommendation.improvementAreas.join(", ")}
                  </span>
                </div>
                <div
                  className={styles.infoRow}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    marginTop: "4px",
                  }}
                >
                  <span
                    className={styles.infoLabel}
                    style={{
                      fontWeight: "600",
                      fontSize: "13px",
                      color: "#64748b",
                    }}
                  >
                    Admission Remarks:
                  </span>
                  <span
                    className={styles.infoValue}
                    style={{ fontSize: "13px", color: "#334155" }}
                  >
                    {recommendation.remarks}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div
              className={styles.placeholderChart}
              style={{
                padding: "3rem 1.5rem",
                textAlign: "center",
                color: "#94a3b8",
                border: "2px dashed #e2e8f0",
                borderRadius: "8px",
              }}
            >
              <div>
                Submit applicant details to calculate engineering program
                recommendations.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Recommendation History Table */}
      {user && user.role === "admin" ? (
        <div
          className={styles.moduleCard}
          style={{ marginTop: "1.25rem", padding: "1.25rem" }}
        >
          <div
            className={styles.moduleTitleSmall}
            style={{ marginBottom: "0.75rem" }}
          >
            Recommendation Records
          </div>

          <div className={styles.historyToolbar}>
            <input
              type="search"
              className={`${styles.formInput} ${styles.historySearchInput}`}
              placeholder="Search history by applicant ID or name..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <div className={styles.exportMenuWrapper} ref={exportMenuRef}>
              <button
                type="button"
                className={styles.performanceIconButton}
                onClick={toggleExportMenu}
                title="Export options"
                aria-label="Export options"
                aria-expanded={exportMenuOpen}
                aria-haspopup="menu"
              >
                <i className="fas fa-file-export" aria-hidden="true" />
              </button>

              {exportMenuOpen ? (
                <div className={styles.exportMenu} role="menu">
                  <button
                    type="button"
                    className={styles.exportMenuItem}
                    role="menuitem"
                    onClick={handleExportExcel}
                  >
                    <i className="fas fa-file-excel" aria-hidden="true" />
                    Export Excel
                  </button>
                  <button
                    type="button"
                    className={styles.exportMenuItem}
                    role="menuitem"
                    onClick={handleExportPDF}
                  >
                    <i className="fas fa-file-pdf" aria-hidden="true" />
                    Download PDF
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.tableWrapper}>
            {historyLoading ? (
              <div className={styles.placeholderChart}>
                Loading recommendation history...
              </div>
            ) : historyMessage && recommendationHistory.length === 0 ? (
              <div className={styles.placeholderChart}>{historyMessage}</div>
            ) : filteredHistory.length === 0 ? (
              <div
                className={styles.placeholderChart}
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "#64748b",
                }}
              >
                <div>
                  No recommendation history records match this search.
                </div>
              </div>
            ) : (
              <table
                className={styles.moduleTable}
                style={{ width: "100%", borderCollapse: "collapse" }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#f8fafc",
                      textAlign: "left",
                      fontSize: "13px",
                    }}
                  >
                    <th style={{ padding: "0.6rem 0.8rem" }}>Applicant ID</th>
                    <th style={{ padding: "0.6rem 0.8rem" }}>Name</th>
                    <th style={{ padding: "0.6rem 0.8rem" }}>Program</th>
                    <th style={{ padding: "0.6rem 0.8rem" }}>Composite Score</th>
                    <th style={{ padding: "0.6rem 0.8rem" }}>Status</th>
                  </tr>
                </thead>
                <tbody className={styles.tableStriped}>
                  {filteredHistory.map((item) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        fontSize: "13px",
                      }}
                    >
                      <td style={{ padding: "0.6rem 0.8rem" }}>
                        {item.applicantId}
                      </td>
                      <td style={{ padding: "0.6rem 0.8rem" }}>{item.name}</td>
                      <td style={{ padding: "0.6rem 0.8rem" }}>
                        {item.program}
                      </td>
                      <td style={{ padding: "0.6rem 0.8rem" }}>
                        {item.confidence === null
                          ? "N/A"
                          : `${item.confidence}%`}
                      </td>
                      <td style={{ padding: "0.6rem 0.8rem" }}>
                        {item.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : null}
    </ModuleShell>
  );
};

export default PreEnrollmentModule;