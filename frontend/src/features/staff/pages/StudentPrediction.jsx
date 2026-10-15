import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { api, isBackendAuthEnabled, isEmptyDataError } from "../../../services/api";
import styles from "../../../styles/Dashboard.module.css";

const NO_PREDICTION_MESSAGE =
  "No prediction yet. Your forecast will appear once academic staff record your grades.";

const SECTION_HEADING_STYLE = {
  fontSize: "1.25rem",
  fontWeight: 700,
  lineHeight: 1.3,
  letterSpacing: "-0.01em",
  color: "#800000",
  borderBottom: "1px solid #f1f5f9",
  paddingBottom: "0.5rem",
  marginBottom: "1rem",
};

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

  return (
    <div className={styles.pageShell} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header Card */}
      <div className={styles.pageHeaderCard}>
        <div>
          <h1 className={styles.pageTitle} style={{ fontSize: "1.6rem", fontWeight: "700" }}>
            Student Prediction Result
          </h1>
          <p className={styles.pageSubtitle} style={{ fontSize: "0.9rem" }}>
            Your forecast is generated from grades recorded by your academic staff.
          </p>
        </div>
        <div className={styles.pageHeaderBadge} style={{ fontSize: "0.825rem", fontWeight: "600" }}>
          Student Forecast
        </div>
      </div>

      {loading && <div className={styles.contentCard} style={{ fontSize: "0.95rem" }}>Loading your grade prediction…</div>}
      {!loading && error && <div className={styles.contentCard} style={{ fontSize: "0.95rem" }}>{error}</div>}
      {!loading && !error && emptyMessage && (
        <div className={styles.contentCard}>
          <p className={styles.pageSubtitle} style={{ margin: 0, fontSize: "0.95rem" }}>
            {emptyMessage}
          </p>
        </div>
      )}

      {!loading && !error && prediction && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              padding: "1.25rem 1.5rem",
              boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
              gridColumn: "1 / -1",
            }}
          >
            <div style={SECTION_HEADING_STYLE}>Next-Term GWA Forecast</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "12px",
                marginBottom: "1rem",
              }}
            >
              <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "1rem" }}>
                <div style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 700 }}>
                  Current cumulative GWA
                </div>
                <div style={{ color: "#800000", fontSize: "1.8rem", fontWeight: 800 }}>
                  {Number(prediction.current_gwa ?? prediction.current_gpa).toFixed(2)}
                </div>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "1rem" }}>
                <div style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 700 }}>
                  Forecast for {prediction.target_semester
                    ? `${prediction.target_semester} semester, ${prediction.target_school_year}`
                    : "next term"}
                </div>
                <div style={{ color: "#800000", fontSize: "1.8rem", fontWeight: 800 }}>
                  {Number(prediction.predicted_gwa).toFixed(2)}
                </div>
                <div style={{ color: "#475569", fontSize: "0.85rem" }}>
                  Selected model: {prediction.selected_model || "Grade-trend estimate"}
                </div>
              </div>
            </div>

            {prediction.model_predictions && (
              <div>
                <div style={{ fontWeight: 700, marginBottom: "0.6rem", color: "#334155" }}>
                  Results from all three models
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "10px",
                  }}
                >
                  {Object.entries(prediction.model_predictions).map(([modelName, value]) => (
                    <div
                      key={modelName}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "0.85rem 1rem",
                        background: modelName === prediction.selected_model ? "#fff7ed" : "#ffffff",
                      }}
                    >
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>
                        {modelName}{modelName === prediction.selected_model ? " (selected)" : ""}
                      </div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#800000" }}>
                        {Number(value).toFixed(2)}
                      </div>
                      {prediction.evaluation_metrics?.[modelName]?.mae != null && (
                        <div style={{ color: "#64748b", fontSize: "0.75rem" }}>
                          Validation MAE: {Number(prediction.evaluation_metrics[modelName].mae).toFixed(4)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {prediction.message && (
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#475569",
                  marginTop: "0.85rem",
                  marginBottom: 0,
                  lineHeight: "1.4",
                  padding: "0.75rem",
                  background: "#fffbeb",
                  borderRadius: "8px",
                }}
              >
                {prediction.message}
              </p>
            )}
            {!prediction.message && (
              <p style={{ color: "#64748b", fontSize: "0.82rem", marginBottom: 0 }}>
                {prediction.prototype_only
                  ? "Prototype forecast based on recorded grades and published curriculum units. It is an estimate, not a guarantee."
                  : `Calculated from ${prediction.grade_count} recorded numeric grades.`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Action Banner */}
      <div
        role="button"
        tabIndex={0}
        style={{
          borderRadius: "12px",
          padding: "1.25rem 1.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          background: "linear-gradient(135deg, #800000 0%, #580000 100%)",
          color: "#ffffff",
          boxShadow: "0 4px 12px rgba(128, 0, 0, 0.15)",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
        onClick={() => navigate("/modules/ai-advising")}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") navigate("/modules/ai-advising");
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(128, 0, 0, 0.22)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(128, 0, 0, 0.15)";
        }}
      >
        <div>
          <div style={{ fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.85, marginBottom: "0.2rem" }}>
            Need Academic Guidance?
          </div>
          <div style={{ fontSize: "1.15rem", fontWeight: "700" }}>
            Access AI Academic Advising
          </div>
          <div style={{ fontSize: "0.875rem", opacity: 0.9, marginTop: "0.2rem" }}>
            Get personalized recommendations to improve your academic performance.
          </div>
        </div>
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            padding: "0.55rem 1.1rem",
            borderRadius: "8px",
            fontSize: "0.875rem",
            fontWeight: "600",
            whiteSpace: "nowrap",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          Open Advisor →
        </div>
      </div>
    </div>
  );
};

export default StudentPrediction;