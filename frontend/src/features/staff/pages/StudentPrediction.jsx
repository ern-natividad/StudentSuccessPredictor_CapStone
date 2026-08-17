import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { api, isBackendAuthEnabled, isEmptyDataError } from "../../../services/api";
import styles from "../../../styles/Dashboard.module.css";

const NO_PREDICTION_MESSAGE =
  "No prediction yet. Your forecast will appear once academic staff record your grades.";

const StudentPrediction = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prediction, setPrediction] = useState(null);
  const [emptyMessage, setEmptyMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadPrediction = async () => {
      if (!isBackendAuthEnabled() || !user?.isAuthenticated) {
        if (isMounted) {
          setError("Sign in with backend authentication to view your grade prediction.");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError("");
        setEmptyMessage("");
        const result = await api.getMyPrediction();
        if (!isMounted) return;

        if (result.prediction) {
          setPrediction(result.prediction);
          setEmptyMessage("");
        } else {
          setPrediction(null);
          setEmptyMessage(result.message || NO_PREDICTION_MESSAGE);
        }
      } catch (requestError) {
        if (!isMounted) return;

        if (isEmptyDataError(requestError)) {
          setPrediction(null);
          setEmptyMessage(NO_PREDICTION_MESSAGE);
          setError("");
        } else {
          setError(requestError.message || "Unable to load your grade prediction.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPrediction();
    return () => {
      isMounted = false;
    };
  }, [user?.isAuthenticated]);

  const currentGpa = Number(prediction?.current_gpa ?? 0);
  const predictedGpa = Number(prediction?.predicted_gpa ?? 0);

  return (
    <div className={styles.studentPredictionPage}>
      <div className={styles.pageHeaderSection}>
        <h1 className={styles.pageTitle}>Engineering Program Predictor</h1>
        <p className={styles.pageDesc}>
          Your forecast is generated from grades recorded by your academic staff.
        </p>
      </div>

      {loading && <div className={styles.card}>Loading your grade prediction…</div>}
      {!loading && error && <div className={styles.card}>{error}</div>}
      {!loading && !error && emptyMessage && (
        <div className={styles.card}>
          <p className={styles.pageDesc} style={{ margin: 0 }}>
            {emptyMessage}
          </p>
        </div>
      )}

      {!loading && !error && prediction && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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
              minHeight: "200px",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              <div>
                <div style={{ fontSize: "48px", fontWeight: 700 }}>{currentGpa.toFixed(2)}</div>
                <div style={{ fontSize: "12px", fontWeight: 600, opacity: 0.9 }}>CURRENT GWA</div>
              </div>
              <div>
                <div style={{ fontSize: "48px", fontWeight: 700 }}>
                  {prediction.success_probability}%
                </div>
                <div style={{ fontSize: "12px", fontWeight: 600, opacity: 0.9 }}>
                  SUCCESS PROBABILITY
                </div>
              </div>
            </div>
            <p style={{ fontSize: "13px", lineHeight: 1.5, margin: "1.5rem 0 0" }}>
              Based on {prediction.grade_count} recorded {prediction.grade_count === 1 ? "grade" : "grades"}.
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>Prediction Details</div>
            <div style={{ display: "grid", gap: "12px" }}>
              <div><strong>Risk Level:</strong> {prediction.risk_level}</div>
              <div><strong>Predicted GWA:</strong> {predictedGpa.toFixed(2)}</div>
              <div><strong>Confidence:</strong> {prediction.confidence_score}%</div>
              <div><strong>Grade trend:</strong> {prediction.trend > 0 ? "Declining" : prediction.trend < 0 ? "Improving" : "Stable"}</div>
            </div>
            <p style={{ fontSize: "13px", lineHeight: 1.5, marginTop: "1rem" }}>{prediction.message}</p>
          </div>
        </div>
      )}

      <div
        role="button"
        tabIndex={0}
        style={{
          background: "linear-gradient(135deg, #8b0000 0%, #6b0000 100%)",
          borderRadius: "16px",
          padding: "2rem",
          color: "#fff",
          textAlign: "center",
          marginTop: "2rem",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        }}
        onClick={() => navigate("/modules/ai-advising")}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") navigate("/modules/ai-advising");
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "0.5rem", opacity: 0.9 }}>
          Need Academic Guidance?
        </div>
        <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "0.5rem" }}>
          Access AI Academic Advising
        </div>
        <div style={{ fontSize: "13px", opacity: 0.9 }}>
          Get personalized recommendations to improve your academic performance.
        </div>
      </div>
    </div>
  );
};

export default StudentPrediction;
