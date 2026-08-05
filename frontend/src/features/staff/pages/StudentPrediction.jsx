import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { useDashboard } from "../../../hooks/useDashboard";
import styles from "../../../styles/Dashboard.module.css";

const StudentPrediction = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { students } = useDashboard();
  const currentStudent = students.find((student) =>
    user.name
      .toLowerCase()
      .startsWith(student.full_name.toLowerCase().split(" ")[0]),
  );

  const studentData = currentStudent || students[0] || null;
  const effectiveCurrentGpa = Number(studentData?.current_gpa ?? 0);
  const effectivePredictedGpa = Number(studentData?.predicted_gpa ?? 0);
  const hasLiveStudentMetrics = Boolean(
    studentData && (studentData.current_gpa || studentData.predicted_gpa),
  );
  const successPercent = Math.min(
    99,
    Math.max(65, Math.round(effectivePredictedGpa * 24 || 0)),
  );

  return (
    <div className={styles.studentPredictionPage}>
      <div className={styles.pageHeaderSection}>
        <h1 className={styles.pageTitle}>Engineering Program predictor</h1>
        <p className={styles.pageDesc}>
          Based on your academic profile and current performance indicators,
          here is your personalized student dashboard summary.
        </p>
      </div>

      {hasLiveStudentMetrics ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
            marginBottom: "2rem",
          }}
        >
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
                    {effectiveCurrentGpa.toFixed(2)}
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
                Student record loaded from the live dashboard dataset.
              </div>
              <div style={{ fontSize: "13px", opacity: 0.9, lineHeight: "1.5" }}>
                Current prediction values are derived from the authenticated
                student record in the dashboard context.
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>Prediction Details</div>
            <div style={{ display: "grid", gap: "12px" }}>
              <div>
                <strong>Risk Level:</strong> {studentData?.risk_level || "N/A"}
              </div>
              <div>
                <strong>Current GPA:</strong> {effectiveCurrentGpa.toFixed(2)}
              </div>
              <div>
                <strong>Predicted GPA:</strong> {effectivePredictedGpa.toFixed(2)}
              </div>
              <div>
                <strong>Confidence:</strong>{" "}
                {Number(studentData?.confidence_score ?? 0)}%
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.card} style={{ marginBottom: "2rem" }}>
          <div className={styles.cardTitle}>Prediction Details</div>
          <div style={{ padding: "1rem 0" }}>
            No live student prediction metrics are available yet.
          </div>
        </div>
      )}

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
        <div
          style={{
            fontSize: "14px",
            fontWeight: "600",
            marginBottom: "0.5rem",
            opacity: 0.9,
          }}
        >
          <i className="fas fa-lightbulb" style={{ marginRight: "8px" }}></i>
          Need Academic Guidance?
        </div>
        <div
          style={{
            fontSize: "16px",
            fontWeight: "700",
            marginBottom: "0.5rem",
          }}
        >
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
