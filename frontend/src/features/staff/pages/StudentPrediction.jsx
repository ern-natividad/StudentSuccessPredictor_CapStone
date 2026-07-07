import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { useDashboard } from "../../../hooks/useDashboard";
import styles from "../../../styles/Dashboard.module.css";
import commonStyles from "../../../styles/Common.module.css";

const StudentPrediction = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { students, showPage } = useDashboard();
  const currentStudent = students.find((student) =>
    user.name
      .toLowerCase()
      .startsWith(student.full_name.toLowerCase().split(" ")[0]),
  );

  const studentData = currentStudent || students[0];
  const successPercent = Math.min(
    99,
    Math.max(65, Math.round(studentData.predicted_gpa * 24)),
  );
  const bestProgram =
    studentData.predicted_gpa >= 3.7
      ? "Computer Engineering"
      : studentData.current_gpa >= 3.2
        ? "Electronics Engineering"
        : "Civil Engineering";

  const programCards = [
    {
      name: "Computer Engineering",
      percent: successPercent,
      badge: "Best fit",
      active: true,
    },
    {
      name: "Electronics Engineering",
      percent: Math.max(74, successPercent - 6),
      badge: "Good match",
    },
    {
      name: "Civil Engineering",
      percent: Math.max(68, successPercent - 12),
      badge: "Good match",
    },
    {
      name: "Mechanical Engineering",
      percent: Math.max(61, successPercent - 18),
      badge: "Fair match",
    },
  ];

  // Semester prediction data
  const semesterPredictions = [
    {
      year: "S.Y. 2025 - 2026",
      semester: "1st Semester",
      gwa: 3.72,
      predictedNextGrade: 3.7,
      confidence: 92,
      graduationGrade: 2.0,
    },
    {
      year: "S.Y. 2025 - 2026",
      semester: "2nd Semester",
      gwa: 3.72,
      predictedNextGrade: 3.95,
      confidence: 92,
      graduationGrade: 2.0,
    },
    {
      year: "S.Y. 2026 - 2027",
      semester: "1st Semester",
      gwa: 3.72,
      predictedNextGrade: 3.8,
      confidence: 87,
      graduationGrade: 2.0,
    },
    {
      year: "S.Y. 2026 - 2027",
      semester: "2nd Semester",
      gwa: 3.72,
      predictedNextGrade: 3.9,
      confidence: 84,
      graduationGrade: 2.0,
    },
  ];

  return (
    <div className={styles.studentPredictionPage}>
      <div className={styles.pageHeaderSection}>
        <h1 className={styles.pageTitle}>Engineering program predictor</h1>
        <p className={styles.pageDesc}>
          Based on your academic profile and current performance indicators,
          here is your personalized student dashboard summary.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
          marginBottom: "2rem",
        }}
      >
        {/* Left side - Prediction Summary */}
        <div
          style={{
            background: "#8b0000",
            borderRadius: "16px",
            padding: "2rem",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "200px",
          }}
        >
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "2rem",
                marginBottom: "1.5rem",
              }}
            >
              <div>
                <div style={{ fontSize: "48px", fontWeight: "700" }}>
                  {studentData.current_gpa.toFixed(2)}
                </div>
                <div
                  style={{ fontSize: "12px", fontWeight: "600", opacity: 0.9 }}
                >
                  GRADUATION GRADE
                </div>
              </div>
              <div>
                <div style={{ fontSize: "48px", fontWeight: "700" }}>
                  {successPercent}%
                </div>
                <div
                  style={{ fontSize: "12px", fontWeight: "600", opacity: 0.9 }}
                >
                  SUCCESS PROBABILITY
                </div>
              </div>
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              Best fit: {bestProgram}
            </div>
            <div style={{ fontSize: "13px", opacity: 0.9, lineHeight: "1.5" }}>
              Strong match based on your GPA trend, confidence score, and
              academic performance.
            </div>
          </div>
        </div>

        {/* Right side - All Program Predictions */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>All program predictions</div>
          <div className={styles.programGrid}>
            {programCards.map((program) => (
              <div
                key={program.name}
                className={`${styles.programCard} ${program.active ? styles.programCardActive : ""}`}
              >
                <div className={styles.programPercent}>{program.percent}%</div>
                <div className={styles.programName}>{program.name}</div>
                <div className={styles.programBarBg}>
                  <div
                    className={styles.programBar}
                    style={{ width: `${program.percent}%` }}
                  />
                </div>
                <div className={styles.programBadge}>{program.badge}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* School year predicted score */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ color: "#8b0000", fontWeight: "600", margin: 0 }}>
            School year predicted score
          </h3>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {semesterPredictions.map((prediction, idx) => (
            <div
              key={idx}
              style={{
                background: "#5a5a5a",
                borderRadius: "12px",
                padding: "1.5rem",
                color: "#fff",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  opacity: 0.9,
                }}
              >
                {prediction.year}
              </div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: "700",
                  marginBottom: "1rem",
                }}
              >
                {prediction.semester}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  fontSize: "13px",
                }}
              >
                <div>
                  <span style={{ opacity: 0.8 }}>GWA:</span>{" "}
                  <span style={{ fontWeight: "600" }}>{prediction.gwa}</span>
                </div>
                <div>
                  <span style={{ opacity: 0.8 }}>Predicted Next Grade:</span>{" "}
                  <span style={{ fontWeight: "600" }}>
                    {prediction.predictedNextGrade}
                  </span>
                </div>
                <div>
                  <span style={{ opacity: 0.8 }}>Confidence:</span>{" "}
                  <span style={{ fontWeight: "600" }}>
                    {prediction.confidence}%
                  </span>
                </div>
                <div>
                  <span style={{ opacity: 0.8 }}>Graduation Grade:</span>{" "}
                  <span style={{ fontWeight: "600" }}>
                    {prediction.graduationGrade}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Advising Card */}
      <div
        style={{
          background: "linear-gradient(135deg, #8b0000 0%, #6b0000 100%)",
          borderRadius: "16px",
          padding: "2rem",
          color: "#fff",
          textAlign: "center",
          marginTop: "2rem",
          cursor: "pointer",
          transition: "transform 0.2s, box-shadow 0.2s",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        }}
        onClick={() => navigate("/modules/ai-advising")}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.25)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "0.5rem", opacity: 0.9 }}>
          <i className="fas fa-lightbulb" style={{ marginRight: "8px" }}></i>
          Need Academic Guidance?
        </div>
        <div style={{ fontSize: "16px", fontWeight: "700", marginBottom: "0.5rem" }}>
          Access AI Academic Advising
        </div>
        <div style={{ fontSize: "13px", opacity: 0.9 }}>
          Get personalized recommendations to improve your academic performance
        </div>
      </div>
    </div>
  );
};

export default StudentPrediction;
