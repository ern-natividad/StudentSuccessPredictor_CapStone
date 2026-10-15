import { useEffect, useState } from "react";
import { api } from "../../../services/api";
import styles from "../../../styles/Dashboard.module.css";

const ModelManagementPage = () => {
  const [modelInfo, setModelInfo] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.getPredictionModelInfo()
      .then((data) => {
        if (isMounted) setModelInfo(data);
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError.message || "Unable to load model evaluation.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <h1 className={styles.pageTitle}>Model Management</h1>
      {loading && <div className={styles.card}>Loading model evaluation…</div>}
      {!loading && error && <div className={styles.card}>{error}</div>}
      {!loading && !error && modelInfo && (
        <>
          <div className={styles.card}>
            <div className={styles.cardTitle}>HawkPredict Next-Term GWA Models</div>
            <p>
              Version: <strong>{modelInfo.model_version}</strong>
              {" · "}Recommended model: <strong>{modelInfo.selected_model}</strong>
            </p>
            <p>
              Evaluated on {modelInfo.evaluation_summary?.test_sample_count ?? "—"} held-out examples
              from {modelInfo.evaluation_summary?.test_student_count ?? "—"} students.
              Error is measured as MAE (mean absolute error); lower is better.
            </p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "0.65rem", borderBottom: "1px solid #e2e8f0" }}>Model</th>
                    <th style={{ padding: "0.65rem", borderBottom: "1px solid #e2e8f0" }}>MAE</th>
                    <th style={{ padding: "0.65rem", borderBottom: "1px solid #e2e8f0" }}>RMSE</th>
                    <th style={{ padding: "0.65rem", borderBottom: "1px solid #e2e8f0" }}>R²</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(modelInfo.metrics || {}).map(([name, metrics]) => (
                    <tr key={name}>
                      <td style={{ padding: "0.65rem", borderBottom: "1px solid #f1f5f9" }}>
                        {name}{name === modelInfo.selected_model ? " (recommended)" : ""}
                      </td>
                      <td style={{ padding: "0.65rem", borderBottom: "1px solid #f1f5f9" }}>{metrics.mae}</td>
                      <td style={{ padding: "0.65rem", borderBottom: "1px solid #f1f5f9" }}>{metrics.rmse}</td>
                      <td style={{ padding: "0.65rem", borderBottom: "1px solid #f1f5f9" }}>{metrics.r2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {modelInfo.prototype_only && (
              <p style={{ marginBottom: 0, color: "#92400e", background: "#fffbeb", padding: "0.75rem", borderRadius: "6px" }}>
                {modelInfo.note}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ModelManagementPage;
