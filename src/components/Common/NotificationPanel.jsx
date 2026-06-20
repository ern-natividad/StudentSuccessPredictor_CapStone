import React from "react";
import { useDashboard } from "../../hooks/useDashboard";
import styles from "../../styles/Dashboard.module.css";

const NotificationPanel = () => {
  const { notificationsPanelOpen, closeNotificationsPanel, alerts } =
    useDashboard();

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        notificationsPanelOpen &&
        !e.target.closest(".nav-bell") &&
        !e.target.closest(`.${styles.notifPanel}`)
      ) {
        closeNotificationsPanel();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [notificationsPanelOpen, closeNotificationsPanel]);

  const getAlertIcon = (severity) => {
    const icons = {
      critical: "exclamation-triangle",
      high: "bell",
      medium: "thumbtack",
      low: "info-circle",
    };
    return icons[severity] || "info-circle";
  };

  return (
    <div
      className={`${styles.notifPanel} ${notificationsPanelOpen ? styles.open : ""}`}
    >
      <div className={styles.notifHead}>Notifications</div>
      {alerts.map((alert, idx) => (
        <div key={idx} className={styles.notifItem}>
          <div className={styles.niTitle}>
            <i className={`fas fa-${getAlertIcon(alert.sev)}`}></i> {alert.name}
          </div>
          <div className={styles.niTime}>{alert.time}</div>
        </div>
      ))}
    </div>
  );
};

export default NotificationPanel;
