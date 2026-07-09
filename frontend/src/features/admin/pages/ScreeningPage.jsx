import React, { useMemo, useState } from "react";
import styles from "../../../styles/Dashboard.module.css";
import commonStyles from "../../../styles/Common.module.css";

const initialForm = {
  fullName: "",
  studentId: "",
  program: "Computer Engineering",
  schoolYear: "2025-2026",
  appraisalDate: "",
  strand: "",
  gpa: "",
  mathGrade: "",
  scienceGrade: "",
  englishGrade: "",
  ictBackground: "",
  interest: 3,
  problemSolving: 3,
  reasoning: 3,
  numerical: 3,
  instructions: 3,
  discipline: 3,
  studyHabits: 3,
  timeManagement: 3,
  communication: 3,
  attitude: 3,
  interview: 3,
  confidence: 3,
  motivation: 3,
  readiness: 3,
  recommendation: "Recommended with monitoring",
  supportNeeded: "",
  remarks: "",
  evaluator: "",
};

const ratingOptions = [1, 2, 3, 4, 5];

const ScreeningPage = () => {
  const [formData, setFormData] = useState(initialForm);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRatingChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: Number(value) }));
  };

  const overallScore = useMemo(() => {
    const values = [
      formData.interest,
      formData.problemSolving,
      formData.reasoning,
      formData.numerical,
      formData.instructions,
      formData.discipline,
      formData.studyHabits,
      formData.timeManagement,
      formData.communication,
      formData.attitude,
      formData.interview,
      formData.confidence,
      formData.motivation,
      formData.readiness,
    ];

    const average =
      values.reduce((sum, value) => sum + value, 0) / values.length;
    return average.toFixed(1);
  }, [formData]);

  const recommendation = useMemo(() => {
    const score = Number(overallScore);
    if (score >= 4.2) return "Strong candidate for engineering enrollment";
    if (score >= 3.2) return "Recommended with monitoring and academic support";
    return "Needs additional support and follow-up evaluation";
  }, [overallScore]);

  const renderRatingField = (label, field, description) => (
    <div key={field} style={{ display: "grid", gap: "8px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>
            {label}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b" }}>
            {description}
          </div>
        </div>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#8b0000" }}>
          {formData[field]}/5
        </div>
      </div>
      <input
        type="range"
        min="1"
        max="5"
        value={formData[field]}
        onChange={(e) => handleRatingChange(field, e.target.value)}
        className={commonStyles.sliderInput}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "11px",
          color: "#94a3b8",
        }}
      >
        <span>1 Poor</span>
        <span>5 Excellent</span>
      </div>
    </div>
  );

  return (
    <div>
      <h1 className={styles.pageTitle}>Student Appraisal</h1>
      <p
        style={{
          marginTop: "-8px",
          marginBottom: "20px",
          fontSize: "14px",
          color: "#64748b",
        }}
      >
        Use this appraisal form to evaluate a new engineering enrollee during
        screening.
      </p>

      <div className={styles.card} style={{ marginBottom: "20px" }}>
        <div className={styles.cardTitle}>Appraisal Summary</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
          }}
        >
          <div
            style={{
              background: "#fff7f7",
              border: "1px solid #f5d0d0",
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#b91c1c",
                fontWeight: 700,
              }}
            >
              Overall Score
            </div>
            <div
              style={{ fontSize: "32px", fontWeight: 800, color: "#8b0000" }}
            >
              {overallScore}/5
            </div>
          </div>
          <div
            style={{
              background: "#fff7f7",
              border: "1px solid #f5d0d0",
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#b91c1c",
                fontWeight: 700,
              }}
            >
              Recommendation
            </div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#0f172a",
                marginTop: "4px",
              }}
            >
              {recommendation}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.card} style={{ marginBottom: "20px" }}>
        <div className={styles.cardTitle}>Student Information</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
          }}
        >
          <div style={{ display: "grid", gap: "6px" }}>
            <label
              style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}
            >
              Full Name
            </label>
            <input
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              style={inputStyle}
              placeholder="Enter full name"
            />
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            <label
              style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}
            >
              Student ID
            </label>
            <input
              value={formData.studentId}
              onChange={(e) => handleChange("studentId", e.target.value)}
              style={inputStyle}
              placeholder="Enter student ID"
            />
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            <label
              style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}
            >
              Program
            </label>
            <select
              value={formData.program}
              onChange={(e) => handleChange("program", e.target.value)}
              style={inputStyle}
            >
              <option>Computer Engineering</option>
              <option>Electrical Engineering</option>
              <option>Mechanical Engineering</option>
              <option>Civil Engineering</option>
            </select>
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            <label
              style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}
            >
              School Year
            </label>
            <input
              value={formData.schoolYear}
              onChange={(e) => handleChange("schoolYear", e.target.value)}
              style={inputStyle}
              placeholder="e.g. 2025-2026"
            />
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            <label
              style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}
            >
              Date of Appraisal
            </label>
            <input
              type="date"
              value={formData.appraisalDate}
              onChange={(e) => handleChange("appraisalDate", e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      <div className={styles.card} style={{ marginBottom: "20px" }}>
        <div className={styles.cardTitle}>Academic Background</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
          }}
        >
          <div style={{ display: "grid", gap: "6px" }}>
            <label
              style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}
            >
              Senior High School Strand
            </label>
            <input
              value={formData.strand}
              onChange={(e) => handleChange("strand", e.target.value)}
              style={inputStyle}
              placeholder="e.g. STEM"
            />
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            <label
              style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}
            >
              General Average / GPA
            </label>
            <input
              value={formData.gpa}
              onChange={(e) => handleChange("gpa", e.target.value)}
              style={inputStyle}
              placeholder="e.g. 92"
            />
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            <label
              style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}
            >
              Math Grade
            </label>
            <input
              value={formData.mathGrade}
              onChange={(e) => handleChange("mathGrade", e.target.value)}
              style={inputStyle}
              placeholder="e.g. 90"
            />
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            <label
              style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}
            >
              Science Grade
            </label>
            <input
              value={formData.scienceGrade}
              onChange={(e) => handleChange("scienceGrade", e.target.value)}
              style={inputStyle}
              placeholder="e.g. 91"
            />
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            <label
              style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}
            >
              English Grade
            </label>
            <input
              value={formData.englishGrade}
              onChange={(e) => handleChange("englishGrade", e.target.value)}
              style={inputStyle}
              placeholder="e.g. 88"
            />
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            <label
              style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}
            >
              Computer / ICT Background
            </label>
            <input
              value={formData.ictBackground}
              onChange={(e) => handleChange("ictBackground", e.target.value)}
              style={inputStyle}
              placeholder="Brief note"
            />
          </div>
        </div>
      </div>

      <div className={styles.card} style={{ marginBottom: "20px" }}>
        <div className={styles.cardTitle}>Engineering Readiness Assessment</div>
        <div style={{ display: "grid", gap: "16px" }}>
          {renderRatingField(
            "Interest in Engineering",
            "interest",
            "Shows curiosity and motivation for engineering studies",
          )}
          {renderRatingField(
            "Problem-Solving Ability",
            "problemSolving",
            "Can think through technical problems logically",
          )}
          {renderRatingField(
            "Logical Reasoning",
            "reasoning",
            "Understands patterns, sequences, and cause-effect",
          )}
          {renderRatingField(
            "Numerical Ability",
            "numerical",
            "Handles numbers and basic calculations confidently",
          )}
          {renderRatingField(
            "Ability to Follow Instructions",
            "instructions",
            "Follows tasks and procedures with focus",
          )}
        </div>
      </div>

      <div className={styles.card} style={{ marginBottom: "20px" }}>
        <div className={styles.cardTitle}>
          Behavioral and Personal Assessment
        </div>
        <div style={{ display: "grid", gap: "16px" }}>
          {renderRatingField(
            "Discipline",
            "discipline",
            "Shows responsibility and consistency",
          )}
          {renderRatingField(
            "Study Habits",
            "studyHabits",
            "Organizes learning and prepares well",
          )}
          {renderRatingField(
            "Time Management",
            "timeManagement",
            "Manages workload and deadlines",
          )}
          {renderRatingField(
            "Communication Skills",
            "communication",
            "Expresses ideas clearly",
          )}
          {renderRatingField(
            "Attitude Toward Learning",
            "attitude",
            "Shows willingness to improve and learn",
          )}
        </div>
      </div>

      <div className={styles.card} style={{ marginBottom: "20px" }}>
        <div className={styles.cardTitle}>Screening / Interview Assessment</div>
        <div style={{ display: "grid", gap: "16px" }}>
          {renderRatingField(
            "Interview Performance",
            "interview",
            "Confidence and clarity during evaluation",
          )}
          {renderRatingField(
            "Confidence Level",
            "confidence",
            "Shows self-assurance in communication",
          )}
          {renderRatingField(
            "Motivation to Pursue Engineering",
            "motivation",
            "Demonstrates clear purpose and drive",
          )}
          {renderRatingField(
            "Observed Readiness",
            "readiness",
            "Overall readiness for the engineering program",
          )}
        </div>
      </div>

      <div className={styles.card} style={{ marginBottom: "20px" }}>
        <div className={styles.cardTitle}>Recommendation and Remarks</div>
        <div style={{ display: "grid", gap: "14px" }}>
          <div style={{ display: "grid", gap: "6px" }}>
            <label
              style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}
            >
              Overall Recommendation
            </label>
            <input
              value={formData.recommendation}
              onChange={(e) => handleChange("recommendation", e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            <label
              style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}
            >
              Support Needed
            </label>
            <input
              value={formData.supportNeeded}
              onChange={(e) => handleChange("supportNeeded", e.target.value)}
              style={inputStyle}
              placeholder="e.g. Tutoring, mentoring, orientation"
            />
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            <label
              style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}
            >
              Evaluator Remarks
            </label>
            <textarea
              value={formData.remarks}
              onChange={(e) => handleChange("remarks", e.target.value)}
              style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
              placeholder="Add evaluator remarks here"
            />
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            <label
              style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}
            >
              Evaluator Name
            </label>
            <input
              value={formData.evaluator}
              onChange={(e) => handleChange("evaluator", e.target.value)}
              style={inputStyle}
              placeholder="Enter evaluator name"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  fontSize: "13px",
  outline: "none",
  background: "#fff",
};

export default ScreeningPage;
