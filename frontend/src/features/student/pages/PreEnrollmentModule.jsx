import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import ModuleShell from "../../../components/Common/ModuleShell";
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

const sampleHistory = [
  {
    id: "APP-2026-011",
    name: "Angela Reyes",
    program: "Civil Engineering",
    confidence: 91,
    status: "Recommended",
  },
  {
    id: "APP-2026-015",
    name: "Mark Johnson",
    program: "Industrial Engineering",
    confidence: 83,
    status: "Selected",
  },
  {
    id: "APP-2026-019",
    name: "Sarah Lim",
    program: "Electrical Engineering",
    confidence: 89,
    status: "Reviewed",
  },
];

const initialForm = {
  applicantId: "APP-2026-021",
  fullName: "",
};

const PreEnrollmentModule = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    applicantId: initialForm.applicantId,
    fullName: "",
    sex: "Female",
    age: "18",
    strand: "STEM",
    gwa: "1.12",
    cet: "82",
    eat: "78",
    screening: "85",
  });
  const [recommendation, setRecommendation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredHistory = useMemo(() => {
    const query = searchTerm.toLowerCase();
    if (!query) return sampleHistory;
    return sampleHistory.filter(
      (item) =>
        item.id.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query) ||
        item.program.toLowerCase().includes(query),
    );
  }, [searchTerm]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleRecommend = () => {
    const normalizedApplicant = normalizeApplicantPayload(formData);

    console.log("Normalized applicant payload:", normalizedApplicant);

    setRecommendation({
      applicant: normalizedApplicant,
      programs: [
        { name: "Civil Engineering", confidence: 92 },
        { name: "Electrical Engineering", confidence: 88 },
        { name: "Computer Engineering", confidence: 84 },
      ],
      explanation:
        "The applicant demonstrates strong STEM performance, solid standardized test results, and a background in STEM strands. Ideal programs focus on analytical reasoning with quantitative coursework.",
      strengths: ["Math foundation", "Scientific literacy", "Problem-solving"],
      improvementAreas: ["Engineering interview depth", "Research exposure"],
      remarks:
        "Recommend early advising for program fit and scholarship opportunities.",
      confidence: 91,
    });
  };

  return (
    <ModuleShell
      title="Pre-Enrollment Degree Recommendation Module"
      description="Assist admission personnel in recommending the most suitable engineering degree program for incoming applicants based on their academic profile."
      activeKey="pre-enrollment"
      menuItems={moduleLinks}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <button className={styles.secondaryButton} onClick={() => navigate(-1)}>
          Back
        </button>
      </div>

      <div className={styles.sectionGrid}>
        <div className={styles.moduleCard}>
          <div className={styles.moduleTitleSmall}>Applicant Information</div>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Applicant ID</label>
              <input
                className={styles.formInput}
                name="applicantId"
                value={formData.applicantId}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Full Name</label>
              <input
                className={styles.formInput}
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter applicant name"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Sex</label>
              <select
                className={styles.formSelect}
                name="sex"
                value={formData.sex}
                onChange={handleChange}
              >
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Age</label>
              <input
                type="number"
                className={styles.formInput}
                name="age"
                value={formData.age}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                Senior High School Strand
              </label>
              <select
                className={styles.formSelect}
                name="strand"
                value={formData.strand}
                onChange={handleChange}
              >
                <option>STEM</option>
                <option>ABM</option>
                <option>HUMSS</option>
                <option>GAS</option>
              </select>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Senior High School GWA</label>
              <input
                className={styles.formInput}
                name="gwa"
                value={formData.gwa}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>WMSU-CET Score</label>
              <input
                className={styles.formInput}
                name="cet"
                value={formData.cet}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                Engineering Aptitude Test (EAT) Score
              </label>
              <input
                className={styles.formInput}
                name="eat"
                value={formData.eat}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                Interview Screening Score
              </label>
              <input
                className={styles.formInput}
                name="screening"
                value={formData.screening}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className={styles.buttonGroup}>
            <button className={styles.primaryButton} onClick={handleRecommend}>
              Recommend Degree Programs
            </button>
            <button
              className={styles.secondaryButton}
              onClick={() =>
                setFormData({
                  ...formData,
                  fullName: "",
                  sex: "Female",
                  age: "18",
                  strand: "STEM",
                  gwa: "1.12",
                  cet: "82",
                  eat: "78",
                  screening: "85",
                })
              }
            >
              Reset Form
            </button>
          </div>
        </div>

        <div className={styles.moduleCard}>
          <div className={styles.moduleTitleSmall}>Recommendation Summary</div>
          {recommendation ? (
            <>
              <div className={styles.metricGrid}>
                {recommendation.programs.map((program) => (
                  <div key={program.name} className={styles.metricCard}>
                    <div className={styles.metricLabel}>{program.name}</div>
                    <div className={styles.metricValue}>
                      {program.confidence}%
                    </div>
                    <div className={styles.metricSubtext}>Match confidence</div>
                  </div>
                ))}
              </div>
              <div className={styles.moduleCardSmall}>
                <div className={styles.moduleTitleSmall}>
                  Why this recommendation?
                </div>
                <p className={styles.moduleSubtitle}>
                  {recommendation.explanation}
                </p>
              </div>
              <div className={styles.infoBlock}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Academic Strengths</span>
                  <span className={styles.infoValue}>
                    {recommendation.strengths.join(", ")}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>
                    Areas for Improvement
                  </span>
                  <span className={styles.infoValue}>
                    {recommendation.improvementAreas.join(", ")}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Admission Remarks</span>
                  <span className={styles.infoValue}>
                    {recommendation.remarks}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.placeholderChart}>
              <div>
                Submit applicant details to reveal top engineering program
                recommendations.
              </div>
            </div>
          )}
        </div>
      </div>

      {user && user.role === "admin" ? (
        <div className={styles.moduleCard}>
          <div className={styles.moduleTitleSmall}>Recommendation History</div>
          <div className={styles.buttonGroup}>
            <input
              type="search"
              className={styles.formInput}
              placeholder="Search previous recommendations"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <button className={styles.secondaryButton}>
              Export Report (PDF)
            </button>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.moduleTable}>
              <thead>
                <tr>
                  <th>Applicant ID</th>
                  <th>Name</th>
                  <th>Program</th>
                  <th>Confidence</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className={styles.tableStriped}>
                {filteredHistory.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.program}</td>
                    <td>{item.confidence}%</td>
                    <td>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </ModuleShell>
  );
};

export default PreEnrollmentModule;
