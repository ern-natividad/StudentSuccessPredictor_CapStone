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
    <div className={styles.pageShell}>
      <div className={styles.pageHeaderCard}>
        <div>
          <h1 className={styles.pageTitle}>Engineering Program Predictor</h1>
          <p className={styles.pageSubtitle}>
            Your forecast is generated from grades recorded by your academic staff.
          </p>
        </div>
        <div className={styles.pageHeaderBadge}>Student Forecast</div>
      </div>

      {loading && <div className={styles.contentCard}>Loading your grade prediction…</div>}
      {!loading && error && <div className={styles.contentCard}>{error}</div>}
      {!loading && !error && emptyMessage && (
        <div className={styles.contentCard}>
          <p className={styles.pageSubtitle} style={{ margin: 0 }}>
            {emptyMessage}
          </p>
        </div>
      )}

      {!loading && !error && prediction && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "14px",
          }}
        >
          <div
            className={styles.resultBanner}
            style={{
              minHeight: 180,
              marginBottom: 0,
              flexDirection: "column",
              alignItems: "stretch",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              <div>
                <div className={styles.resultPct}>{currentGpa.toFixed(2)}</div>
                <div className={styles.resultPctLabel}>CURRENT GWA</div>
              </div>
              <div>
                <div className={styles.resultPct}>{prediction.success_probability}%</div>
                <div className={styles.resultPctLabel}>SUCCESS PROBABILITY</div>
              </div>
            </div>
            <p style={{ fontSize: "13px", lineHeight: 1.5, margin: "1.5rem 0 0" }}>
              Based on {prediction.grade_count} recorded {prediction.grade_count === 1 ? "grade" : "grades"}.
            </p>
          </div>

          <div className={styles.contentCard}>
            <div className={styles.contentCardEyebrow}>Prediction</div>
            <div className={styles.contentCardTitle}>Prediction Details</div>
            <div style={{ display: "grid", gap: "12px", marginTop: 12 }}>
              <div><strong>Risk Level:</strong> {prediction.risk_level}</div>
              <div><strong>Predicted GWA:</strong> {predictedGpa.toFixed(2)}</div>
              <div><strong>Confidence:</strong> {prediction.confidence_score}%</div>
              <div><strong>Grade trend:</strong> {prediction.trend > 0 ? "Declining" : prediction.trend < 0 ? "Improving" : "Stable"}</div>
            </div>
            <p className={styles.contentCardMeta} style={{ marginTop: "1rem" }}>{prediction.message}</p>
          </div>
        </div>
      )}

      <div
        role="button"
        tabIndex={0}
        className={styles.resultBanner}
        style={{
          flexDirection: "column",
          textAlign: "center",
          cursor: "pointer",
          background: "linear-gradient(135deg, #8b0000 0%, #6b0000 100%)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          marginBottom: 0,
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
