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

  const getRiskBadge = (risk) => {
    const stylesMap = {
      low: { bg: "#f0fdf4", color: "#166534", border: "#dcfce7" },
      medium: { bg: "#fffbeb", color: "#d97706", border: "#fef3c7" },
      high: { bg: "#fff7ed", color: "#ea580c", border: "#ffedd5" },
      critical: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
    };

    const currentStyle = stylesMap[risk?.toLowerCase()] || stylesMap.low;

    return (
      <span
        style={{
          fontSize: "0.8rem",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          padding: "0.3rem 0.7rem",
          borderRadius: "6px",
          backgroundColor: currentStyle.bg,
          color: currentStyle.color,
          border: `1px solid ${currentStyle.border}`,
          display: "inline-block",
        }}
      >
        {risk || "Low"}
      </span>
    );
  };

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
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "16px",
          }}
        >
          {/* Main Key Metrics Summary Card */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              padding: "1.25rem 1.5rem",
              boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  color: "#800000",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                Performance Summary
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                {/* Current GWA Box */}
                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    padding: "1rem 1.25rem",
                    borderRadius: "10px",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ fontSize: "0.825rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    Current GWA
                  </div>
                  <div
                    style={{
                      fontSize: "2.25rem",
                      fontWeight: "800",
                      color: "#800000",
                      lineHeight: "1.1",
                      marginTop: "0.35rem",
                    }}
                  >
                    {currentGpa.toFixed(2)}
                  </div>
                </div>

                {/* Success Probability Box */}
                <div
                  style={{
                    backgroundColor: "#f0fdf4",
                    padding: "1rem 1.25rem",
                    borderRadius: "10px",
                    border: "1px solid #dcfce7",
                  }}
                >
                  <div style={{ fontSize: "0.825rem", fontWeight: "700", color: "#166534", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    Success Probability
                  </div>
                  <div
                    style={{
                      fontSize: "2.25rem",
                      fontWeight: "800",
                      color: "#15803d",
                      lineHeight: "1.1",
                      marginTop: "0.35rem",
                    }}
                  >
                    {prediction.success_probability}%
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: "0.85rem",
                color: "#64748b",
                fontWeight: "500",
                marginTop: "1.25rem",
                paddingTop: "0.75rem",
                borderTop: "1px dashed #e2e8f0",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#800000", display: "inline-block" }} />
              Calculated based on {prediction.grade_count} recorded {prediction.grade_count === 1 ? "grade" : "grades"}.
            </div>
          </div>

          {/* Detailed Forecast Metrics Card */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              padding: "1.25rem 1.5rem",
              boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontSize: "1.1rem",
                fontWeight: "700",
                color: "#800000",
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              Prediction Breakdown
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.85rem",
                flex: 1,
              }}
            >
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid #f1f5f9",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "#64748b", marginBottom: "0.25rem" }}>
                  Risk Status
                </div>
                <div>{getRiskBadge(prediction.risk_level)}</div>
              </div>

              <div
                style={{
                  backgroundColor: "#f8fafc",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid #f1f5f9",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "#64748b" }}>
                  Predicted GWA
                </div>
                <div style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0f172a", marginTop: "0.15rem" }}>
                  {predictedGpa.toFixed(2)}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#f8fafc",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid #f1f5f9",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "#64748b" }}>
                  Confidence Score
                </div>
                <div style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0f172a", marginTop: "0.15rem" }}>
                  {prediction.confidence_score}%
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#f8fafc",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid #f1f5f9",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "#64748b" }}>
                  Grade Trend
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a", marginTop: "0.15rem" }}>
                  {prediction.trend > 0 ? "📉 Declining" : prediction.trend < 0 ? "📈 Improving" : "➡️ Stable"}
                </div>
              </div>
            </div>

            {prediction.message && (
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#475569",
                  marginTop: "0.85rem",
                  marginBottom: 0,
                  lineHeight: "1.4",
                }}
              >
                {prediction.message}
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