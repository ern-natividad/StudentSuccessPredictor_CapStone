import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useDashboard } from "../../hooks/useDashboard";
import { getDashboardPath } from "../../utils/authUtils";
import styles from "../../styles/Dashboard.module.css";

const NotificationPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    notificationsPanelOpen,
    closeNotificationsPanel,
    alerts,
    alertsLoading,
  } = useDashboard();

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        notificationsPanelOpen &&
        !e.target.closest('[data-nav-bell="true"]') &&
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

  const handleViewAll = () => {
    closeNotificationsPanel();
    if (user?.role === "student") return;
    const basePath = getDashboardPath(user?.role);
    navigate(`${basePath}?tab=alerts`);
  };

  const canViewAll = user?.role === "admin" || user?.role === "staff";

  return (
    <div
      className={`${styles.notifPanel} ${notificationsPanelOpen ? styles.open : ""}`}
      onClick={(event) => event.stopPropagation()}
    >
      <div className={styles.notifHead}>
        <span>Notifications</span>
        {alerts.length > 0 ? (
          <span className={styles.notifCountBadge}>{alerts.length}</span>
        ) : null}
      </div>

      {alertsLoading ? (
        <div className={styles.notifEmpty}>Loading early alerts…</div>
      ) : alerts.length === 0 ? (
        <div className={styles.notifEmpty}>
          <i className="fas fa-bell-slash" aria-hidden="true" />
          <p>No new early alerts right now.</p>
        </div>
      ) : (
        alerts.slice(0, 8).map((alert) => (
          <div key={alert.id} className={styles.notifItem}>
            <div className={`${styles.notifSeverity} ${styles[`notifSeverity${alert.sev}`] || ""}`}>
              <i className={`fas fa-${getAlertIcon(alert.sev)}`} aria-hidden="true" />
            </div>
            <div className={styles.notifContent}>
              <div className={styles.niTitle}>{alert.name}</div>
              <div className={styles.niDesc}>{alert.desc}</div>
              <div className={styles.niTime}>{alert.time}</div>
            </div>
          </div>
        ))
      )}

      {canViewAll ? (
        <button type="button" className={styles.notifFooterAction} onClick={handleViewAll}>
          View all early alerts
        </button>
      ) : null}
    </div>
  );
};

export default NotificationPanel;
