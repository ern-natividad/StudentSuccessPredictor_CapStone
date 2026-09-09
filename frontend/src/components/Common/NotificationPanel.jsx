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
    adminNotifications = [],
    unreadAlertCount,
    alertsLoading,
    markNotificationsAsViewed,
    refreshAdminNotifications,
  } = useDashboard();

  React.useEffect(() => {
    if (!notificationsPanelOpen) return undefined;

    let cancelled = false;

    const syncAndMarkViewed = async () => {
      if (user?.role === "admin" && typeof refreshAdminNotifications === "function") {
        await refreshAdminNotifications();
      }
      if (!cancelled) {
        markNotificationsAsViewed();
      }
    };

    void syncAndMarkViewed();

    return () => {
      cancelled = true;
    };
  }, [
    notificationsPanelOpen,
    markNotificationsAsViewed,
    refreshAdminNotifications,
    user?.role,
  ]);

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

  const formatTime = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleViewAll = () => {
    markNotificationsAsViewed();
    closeNotificationsPanel();
    if (user?.role === "student") return;
    const basePath = getDashboardPath(user?.role);
    navigate(`${basePath}?tab=alerts`);
  };

  const handleAdminNotificationClick = () => {
    markNotificationsAsViewed();
    closeNotificationsPanel();
    navigate(`${getDashboardPath("admin")}?tab=alerts`);
  };

  const canViewAll = user?.role === "admin" || user?.role === "staff";
  const isAdmin = user?.role === "admin";
  const escalationItems = isAdmin ? adminNotifications.slice(0, 6) : [];
  const riskItems = alerts.slice(0, isAdmin ? 4 : 8);
  const hasItems = escalationItems.length > 0 || riskItems.length > 0;

  return (
    <div
      className={`${styles.notifPanel} ${notificationsPanelOpen ? styles.open : ""}`}
      onClick={(event) => event.stopPropagation()}
    >
      <div className={styles.notifHead}>
        <span>Notifications</span>
        {unreadAlertCount > 0 ? (
          <span className={styles.notifCountBadge}>{unreadAlertCount}</span>
        ) : null}
      </div>

      {alertsLoading ? (
        <div className={styles.notifEmpty}>Loading early alerts…</div>
      ) : !hasItems ? (
        <div className={styles.notifEmpty}>
          <i className="fas fa-bell-slash" aria-hidden="true" />
          <p>No new early alerts right now.</p>
        </div>
      ) : (
        <>
          {escalationItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.notifItem}
              onClick={handleAdminNotificationClick}
              style={{
                width: "100%",
                textAlign: "left",
                border: "none",
                background: item.is_read ? "transparent" : "rgba(139,0,0,0.04)",
                cursor: "pointer",
              }}
            >
              <div className={`${styles.notifSeverity} ${styles.notifSeverityhigh || ""}`}>
                <i className="fas fa-user-shield" aria-hidden="true" />
              </div>
              <div className={styles.notifContent}>
                <div className={styles.niTitle}>{item.title}</div>
                <div className={styles.niDesc}>{item.body}</div>
                <div className={styles.niTime}>{formatTime(item.created_at)}</div>
              </div>
            </button>
          ))}

          {riskItems.map((alert) => (
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
          ))}
        </>
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
