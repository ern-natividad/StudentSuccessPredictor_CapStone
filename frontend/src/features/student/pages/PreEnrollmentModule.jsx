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

const initialForm = {
  applicantId: "",
  fullName: "",
};

const PreEnrollmentModule = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    applicantId: initialForm.applicantId,
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
    extracurriculars: "",
    leadershipRole: "",
    socioeconomicCategory: "",
    specialSkills: "",
  });
  const [recommendation, setRecommendation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredHistory = useMemo(() => {
    const query = searchTerm.toLowerCase();
    if (!query) return [];
    return [];
  }, [searchTerm]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleResetForm = () => {
    setFormData({
      ...initialForm,
      applicantId: formData.applicantId,
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
      extracurriculars: "",
      leadershipRole: "",
      socioeconomicCategory: "",
      specialSkills: "",
    });
    setRecommendation(null);
  };

  const handleRecommend = () => {
    const math = parseFloat(formData.cetMath) || 0;
    const science = parseFloat(formData.cetScience) || 0;
    const english = parseFloat(formData.cetEnglish) || 0;
    const reading = parseFloat(formData.cetReading) || 0;
    const abstract = parseFloat(formData.cetAbstract) || 0;

    // Weight correlations for engineering specializations
    const ceScore = Math.round(math * 0.45 + science * 0.35 + abstract * 0.2);
    const eeScore = Math.round(math * 0.40 + science * 0.40 + abstract * 0.2);
    const cpeScore = Math.round(math * 0.40 + abstract * 0.35 + science * 0.25);
    const ieScore = Math.round(math * 0.30 + english * 0.25 + reading * 0.20 + abstract * 0.25);

    const normalizedApplicant = normalizeApplicantPayload({
      ...formData,
      cet: Math.round((math + science + english + reading + abstract) / 5),
    });

    console.log("Normalized applicant payload:", normalizedApplicant);

    setRecommendation({
      applicant: normalizedApplicant,
      programs: programScores.slice(0, 3),
      explanation:
        "Top engineering program recommendations are calculated by combining academic/CET subtest correlations with student background and non-academic profile metrics.",
      strengths: [
        math >= 80 ? "High Mathematics Proficiency" : "Quantitative Aptitude",
        science >= 80 ? "Strong Science Core" : "Scientific Literacy",
        formData.leadershipRole !== "None" ? "Demonstrated Leadership" : "Teamwork Ability",
      ],
      improvementAreas: [
        english < 75 || reading < 75 ? "Technical Communication Skills" : "Engineering Interview Depth",
        "Research & Hardware Exposure",
      ],
      remarks:
        "Applicant demonstrates high correlation in heavily quantitative engineering tracks alongside active involvement in non-academic activities.",
      confidence: programScores[0].confidence,
    });
  };

  return (
    <ModuleShell
      title="Pre-Enrollment Degree Recommendation Module"
      description="Assist admission personnel in recommending the most suitable engineering degree program for incoming applicants based on their academic profile, CET components, and non-academic activities."
      activeKey="pre-enrollment"
      menuItems={moduleLinks}
    >
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
              <label className={styles.formLabel}>Name</label>
              <input
                className={styles.formInput}
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter applicant name"
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
                <option value="">Select strand</option>
                <option value="STEM">STEM</option>
                <option value="ABM">ABM</option>
                <option value="HUMSS">HUMSS</option>
                <option value="GAS">GAS</option>
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

            {/* Correlated CET Component Fields */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>CET - Mathematics</label>
              <input
                type="number"
                className={styles.formInput}
                name="cetMath"
                value={formData.cetMath}
                onChange={handleChange}
                placeholder="e.g. 85"
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
                placeholder="e.g. 88"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>CET - English Proficiency</label>
              <input
                type="number"
                className={styles.formInput}
                name="cetEnglish"
                value={formData.cetEnglish}
                onChange={handleChange}
                placeholder="e.g. 80"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>CET - Reading Comprehension</label>
              <input
                type="number"
                className={styles.formInput}
                name="cetReading"
                value={formData.cetReading}
                onChange={handleChange}
                placeholder="e.g. 82"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>CET - Abstract Reasoning</label>
              <input
                type="number"
                className={styles.formInput}
                name="cetAbstract"
                value={formData.cetAbstract}
                onChange={handleChange}
                placeholder="e.g. 90"
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
            <div className={styles.formField} style={{ gridColumn: "span 2" }}>
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

          {/* Non-Academic Data Section */}
          <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0" }}>
            <div className={styles.moduleTitleSmall}>Non-Academic Profile</div>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Extracurricular Involvement</label>
                <select
                  className={styles.formSelect}
                  name="extracurriculars"
                  value={formData.extracurriculars}
                  onChange={handleChange}
                >
                  <option value="">Select extracurricular involvement</option>
                  <option value="Robotics Club">Robotics Club</option>
                  <option value="Science & Math Club">Science & Math Club</option>
                  <option value="Student Council">Student Council</option>
                  <option value="Athletics / Sports">Athletics / Sports</option>
                  <option value="Arts & Performing Arts">Arts & Performing Arts</option>
                  <option value="None">None</option>
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Leadership Experience</label>
                <select
                  className={styles.formSelect}
                  name="leadershipRole"
                  value={formData.leadershipRole}
                  onChange={handleChange}
                >
                  <option value="">Select leadership experience</option>
                  <option value="President / Student Head">President / Student Head</option>
                  <option value="Officer">Officer</option>
                  <option value="Committee Member">Committee Member</option>
                  <option value="None">None</option>
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Socioeconomic Category</label>
                <select
                  className={styles.formSelect}
                  name="socioeconomicCategory"
                  value={formData.socioeconomicCategory}
                  onChange={handleChange}
                >
                  <option value="">Select socioeconomic category</option>
                  <option value="Low Income">Low Income</option>
                  <option value="Lower Middle Income">Lower Middle Income</option>
                  <option value="Middle Income">Middle Income</option>
                  <option value="Upper Middle Income">Upper Middle Income</option>
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Special Skills / Certifications</label>
                <input
                  className={styles.formInput}
                  name="specialSkills"
                  value={formData.specialSkills}
                  onChange={handleChange}
                  placeholder="e.g. Basic Python, CAD, Electronics"
                />
              </div>
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <button className={styles.primaryButton} onClick={handleRecommend}>
              Recommend Degree Programs
            </button>
            <button
              className={styles.secondaryButton}
              onClick={handleResetForm}
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

              {/* Display Non-Academic Insights in Summary */}
              <div className={styles.infoBlock}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Academic Strengths</span>
                  <span className={styles.infoValue}>
                    {recommendation.strengths.join(", ")}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Non-Academic Profile</span>
                  <span className={styles.infoValue}>
                    {formData.extracurriculars} ({formData.leadershipRole})
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
            {filteredHistory.length === 0 ? (
              <div className={styles.placeholderChart}>
                <div>No recommendation history is available yet.</div>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      ) : null}
    </ModuleShell>
  );
};

export default PreEnrollmentModule;