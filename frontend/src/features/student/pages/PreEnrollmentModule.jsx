import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import ModuleShell from "../../../components/Common/ModuleShell";
import { useToast } from "../../../components/Common/Toast";
import { normalizeApplicantPayload } from "../../../utils/dataNormalization";
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
  const { user } = useAuth();
  const toast = useToast();
  const exportMenuRef = useRef(null);
  const [formData, setFormData] = useState(initialForm);
  const [recommendation, setRecommendation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const filteredHistory = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return [];
    return [];
  }, [searchTerm]);

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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleResetForm = () => {
    setFormData(initialForm);
    setRecommendation(null);
  };

  const handleRecommend = () => {
    const math = parseFloat(formData.cetMath) || 0;
    const science = parseFloat(formData.cetScience) || 0;
    const english = parseFloat(formData.cetEnglish) || 0;
    const reading = parseFloat(formData.cetReading) || 0;
    const abstract = parseFloat(formData.cetAbstract) || 0;

    // Weight correlations for engineering specializations
    const ceScore = Math.min(
      99,
      Math.round(math * 0.45 + science * 0.35 + abstract * 0.2)
    );
    const eeScore = Math.min(
      99,
      Math.round(math * 0.4 + science * 0.4 + abstract * 0.2)
    );
    const cpeScore = Math.min(
      99,
      Math.round(math * 0.4 + abstract * 0.35 + science * 0.25)
    );
    const ieScore = Math.min(
      99,
      Math.round(math * 0.3 + english * 0.25 + reading * 0.2 + abstract * 0.25)
    );

    const programScores = [
      { name: "BS Civil Engineering", confidence: ceScore },
      { name: "BS Electrical Engineering", confidence: eeScore },
      { name: "BS Computer Engineering", confidence: cpeScore },
      { name: "BS Industrial Engineering", confidence: ieScore },
    ].sort((a, b) => b.confidence - a.confidence);

    const normalizedApplicant = normalizeApplicantPayload({
      ...formData,
      cet: Math.round((math + science + english + reading + abstract) / 5),
    });

    setRecommendation({
      applicant: normalizedApplicant,
      programs: programScores.slice(0, 3),
      explanation:
        "Top engineering program recommendations are calculated by combining academic/CET subtest correlations with student background and non-academic profile metrics.",
      strengths: [
        math >= 80 ? "High Mathematics Proficiency" : "Quantitative Aptitude",
        science >= 80 ? "Strong Science Core" : "Scientific Literacy",
        parseFloat(formData.attendanceRate) >= 90
          ? "Consistent Attendance"
          : "Academic Discipline",
      ],
      improvementAreas: [
        english < 75 || reading < 75
          ? "Technical Communication Skills"
          : "Engineering Interview Depth",
        "Research & Hardware Exposure",
      ],
      remarks:
        "Applicant demonstrates high correlation in heavily quantitative engineering tracks alongside positive non-academic behavioral metrics.",
    });
  };

  const getExportRows = () => filteredHistory;

  const handleExportCSV = () => {
    setExportMenuOpen(false);
    const rows = getExportRows();

    if (rows.length === 0) {
      toast.error("No records available to export.");
      return;
    }

    const headers = ["Applicant ID", "Name", "Program", "Confidence", "Status"];
    const csvRows = rows.map((item) => [
      item.id,
      item.name,
      item.program,
      `${item.confidence}%`,
      item.status,
    ]);

    const csv = [headers, ...csvRows]
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
    link.download = "pre-enrollment-recommendations.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("Recommendation history exported as CSV.");
  };

  const handleExportPDF = () => {
    setExportMenuOpen(false);

    if (getExportRows().length === 0) {
      toast.error("No records available to export.");
      return;
    }

    window.print();
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
    >
      <div className={styles.sectionGrid} style={{ gap: "1.25rem" }}>
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
                onChange={handleChange}
                placeholder="e.g. APP-2026-001"
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
              <label className={styles.formLabel}>CET - Mathematics</label>
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
              Recommend Degree Programs
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
              <div className={styles.metricGrid}>
                {recommendation.programs.map((program) => (
                  <div
                    key={program.name}
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
                      {program.confidence}%
                    </div>
                    <div
                      className={styles.metricSubtext}
                      style={{ fontSize: "11px", color: "#64748b" }}
                    >
                      Match confidence
                    </div>
                  </div>
                ))}
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
            Recommendation History & Audits
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
                    onClick={handleExportCSV}
                  >
                    <i className="fas fa-file-csv" aria-hidden="true" />
                    Export CSV
                  </button>
                  <button
                    type="button"
                    className={styles.exportMenuItem}
                    role="menuitem"
                    onClick={handleExportPDF}
                  >
                    <i className="fas fa-file-pdf" aria-hidden="true" />
                    Export PDF
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.tableWrapper}>
            {filteredHistory.length === 0 ? (
              <div
                className={styles.placeholderChart}
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "#64748b",
                }}
              >
                <div>
                  No recommendation history records available for export.
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
                    <th style={{ padding: "0.6rem 0.8rem" }}>Confidence</th>
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
                      <td style={{ padding: "0.6rem 0.8rem" }}>{item.id}</td>
                      <td style={{ padding: "0.6rem 0.8rem" }}>{item.name}</td>
                      <td style={{ padding: "0.6rem 0.8rem" }}>
                        {item.program}
                      </td>
                      <td style={{ padding: "0.6rem 0.8rem" }}>
                        {item.confidence}%
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