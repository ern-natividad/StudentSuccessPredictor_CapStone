import { useState } from "react";
import styles from "../../../styles/Dashboard.module.css";
import commonStyles from "../../../styles/Common.module.css";

const ModelUploadArea = () => {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowUpload(!showUpload)}
        style={{
          width: "100%",
          padding: "12px",
          background: "#F5C200",
          border: "none",
          borderRadius: "6px",
          color: "#0f0d08",
          fontWeight: "600",
          cursor: "pointer",
          marginBottom: "12px",
        }}
      >
        {showUpload ? "Cancel" : "Upload New Model"}
      </button>
      {showUpload && (
        <div
          style={{
            border: "2px dashed rgba(245,194,0,0.3)",
            borderRadius: "6px",
            padding: "20px 12px",
            textAlign: "center",
            color: "#5a5240",
            fontSize: "12px",
          }}
        >
          <i
            className="fas fa-cloud-upload-alt"
            style={{ fontSize: "24px", marginBottom: "8px", display: "block" }}
          ></i>
          Drop model file here or click to select
        </div>
      )}
    </>
  );
};

const ModelManagementPage = () => {
  const modelVersion = "1.3.0";

  return (
    <div>
      <h1 className={styles.pageTitle}>Model Management</h1>
      <div
        className={commonStyles.grid}
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        }}
      >
        <div className={styles.card}>
          <div className={styles.cardTitle}>Current Model</div>
          <div className={commonStyles.metric}>
            <div className={commonStyles.metricLabel}>Version</div>
            <div className={commonStyles.metricValue}>{modelVersion}</div>
          </div>
          <div className={commonStyles.metric}>
            <div className={commonStyles.metricLabel}>Accuracy</div>
            <div className={commonStyles.metricValue}>94.2%</div>
          </div>
          <div className={commonStyles.metric}>
            <div className={commonStyles.metricLabel}>Last Trained</div>
            <div style={{ fontSize: "12px", color: "#5a5240" }}>
              Yesterday 14:30
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Model Training</div>
          <p
            style={{
              fontSize: "13px",
              color: "#5a5240",
              marginBottom: "12px",
            }}
          >
            Upload a new prediction model file to update the system. Supported
            formats: <strong>.pkl</strong>, <strong>.joblib</strong>.
          </p>
          <ModelUploadArea />
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Performance History</div>
          <div className={commonStyles.metric}>
            <div className={commonStyles.metricLabel}>v1.3.0 Accuracy</div>
            <div className={commonStyles.metricValue}>94.2%</div>
          </div>
          <div className={commonStyles.metric}>
            <div className={commonStyles.metricLabel}>v1.2.0 Accuracy</div>
            <div className={commonStyles.metricValue}>91.8%</div>
          </div>
          <div className={commonStyles.metric}>
            <div className={commonStyles.metricLabel}>v1.1.0 Accuracy</div>
            <div className={commonStyles.metricValue}>88.5%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelManagementPage;
