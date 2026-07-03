import React from "react";
import { useDashboard } from "../../../hooks/useDashboard";
import styles from "../../../styles/Dashboard.module.css";
import commonStyles from "../../../styles/Common.module.css";

const AlertsList = () => {
  const { alerts } = useDashboard();

  const getAlertIcon = (severity) => {
    const icons = {
      critical: "fas fa-exclamation-triangle",
      high: "fas fa-bell",
      medium: "fas fa-thumbtack",
      low: "fas fa-info-circle",
    };
    return icons[severity] || "fas fa-info-circle";
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>Early Alerts</h1>

      <div className={styles.card}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {alerts.map((alert, idx) => (
            <div key={idx} className={styles.alertItem}>
              <div className={`${styles.alertIcon} ${styles[alert.sev]}`}>
                <i className={getAlertIcon(alert.sev)}></i>
              </div>
              <div style={{ flex: 1 }}>
                <div className={styles.alertName}>{alert.name}</div>
                <div className={styles.alertDesc}>{alert.desc}</div>
                <div className={styles.alertTime}>{alert.time}</div>
              </div>
              <div className={styles.alertMeta}>
                <span
                  className={`${commonStyles.riskBadge} ${commonStyles["riskBadge." + alert.sev]}`}
                >
                  {alert.sev}
                </span>
                <br />
                <button className={commonStyles.btnSmallOutline}>
                  Acknowledge
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.card} style={{ marginTop: "20px" }}>
        <div className={styles.cardTitle}>Alert Summary</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "12px",
          }}
        >
          <div className={commonStyles.statBlock}>
            <div className={commonStyles.statValue}>
              {alerts.filter((a) => a.sev === "critical").length}
            </div>
            <div className={commonStyles.statLabel}>Critical</div>
          </div>
          <div className={commonStyles.statBlock}>
            <div className={commonStyles.statValue}>
              {alerts.filter((a) => a.sev === "high").length}
            </div>
            <div className={commonStyles.statLabel}>High</div>
          </div>
          <div className={commonStyles.statBlock}>
            <div className={commonStyles.statValue}>
              {alerts.filter((a) => a.sev === "medium").length}
            </div>
            <div className={commonStyles.statLabel}>Medium</div>
          </div>
          <div className={commonStyles.statBlock}>
            <div className={commonStyles.statValue}>
              {alerts.filter((a) => a.sev === "low").length}
            </div>
            <div className={commonStyles.statLabel}>Low</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsList;
