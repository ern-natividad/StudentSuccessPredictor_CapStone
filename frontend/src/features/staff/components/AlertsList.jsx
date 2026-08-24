import React, { useState, useEffect } from "react";
import { useDashboard } from "../../../hooks/useDashboard";
import { useRoleScopedStudents } from "../../../hooks/useRoleScopedStudents";
import { useToast } from "../../../components/Common/Toast";
import { useEarlyAlerts } from "../hooks/useEarlyAlerts";
import styles from "../../../styles/Dashboard.module.css";
import commonStyles from "../../../styles/Common.module.css";

const AlertsList = () => {
  const { directoryLoading: contextLoading, directoryError: contextError } =
    useDashboard();
  const { isAdmin } = useRoleScopedStudents();
  const toast = useToast();

  const { alerts, loading, error } = useEarlyAlerts();
  const [acknowledgedIds, setAcknowledgedIds] = useState(new Set());

  useEffect(() => {
    if (error) toast.error(error);
  }, [error, toast]);

  const handleAcknowledge = (id) => {
    setAcknowledgedIds((prev) => new Set(prev).add(id));
    toast.success("Alert acknowledged.");
  };

  const getAlertIcon = (severity) => {
    const icons = {
      critical: "fas fa-exclamation-triangle",
      high: "fas fa-bell",
      medium: "fas fa-thumbtack",
      low: "fas fa-info-circle",
    };
    return icons[severity] || "fas fa-info-circle";
  };

  const activeAlerts = alerts.filter((a) => !acknowledgedIds.has(a.id));
  const isLoading = loading || contextLoading;
  const displayError = error || contextError;

  return (
    <div>
      <h1 className={styles.pageTitle}>
        {isAdmin ? "Early Alerts" : "Early Alerts — Assigned Students"}
      </h1>

      {displayError && <div className={styles.card}>{displayError}</div>}

      <div className={styles.card} style={{ marginBottom: "20px" }}>
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
              {activeAlerts.filter((a) => a.sev === "low").length}
            </div>
            <div className={commonStyles.statLabel}>Low</div>
          </div>
          <div className={commonStyles.statBlock}>
            <div className={commonStyles.statValue}>
              {activeAlerts.filter((a) => a.sev === "medium").length}
            </div>
            <div className={commonStyles.statLabel}>Medium</div>
          </div>
          <div className={commonStyles.statBlock}>
            <div className={commonStyles.statValue}>
              {activeAlerts.filter((a) => a.sev === "high").length}
            </div>
            <div className={commonStyles.statLabel}>High</div>
          </div>
          <div className={commonStyles.statBlock}>
            <div className={commonStyles.statValue}>
              {activeAlerts.filter((a) => a.sev === "critical").length}
            </div>
            <div className={commonStyles.statLabel}>Critical</div>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {activeAlerts.map((alert) => (
            <div key={alert.id} className={styles.alertItem}>
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
                  className={`${commonStyles.riskBadge} ${
                    commonStyles["riskBadge." + alert.sev]
                  }`}
                >
                  {alert.sev}
                </span>
                <br />
                <button
                  className={commonStyles.btnSmallOutline}
                  onClick={() => handleAcknowledge(alert.id)}
                >
                  Acknowledge
                </button>
              </div>
            </div>
          ))}

          {!isLoading && activeAlerts.length === 0 && (
            <div className={commonStyles.emptyState}>
              {isAdmin
                ? "No account alerts found."
                : "No alerts found for your assigned students."}
            </div>
          )}

          {isLoading && (
            <div className={commonStyles.emptyState}>Loading alerts…</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsList;