// REPLACES: src/components/Common/MainLayout.jsx
//
// Adds inactivity-based session timeout (15 min) that logs the user out and
// shows the existing-styled SessionExpiredModal. Layout markup/classes are
// otherwise unchanged.
import { useEffect, useState, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useDashboard } from "../../hooks/useDashboard";
import { useIdleTimeout } from "../../hooks/useIdleTimeout";
import TopNav from "./TopNav";
import Sidebar from "./Sidebar";
import NotificationPanel from "./NotificationPanel";
import SessionExpiredModal from "./SessionExpiredModal";
import styles from "../../styles/Dashboard.module.css";

const SESSION_TIMEOUT_MS = 15 * 60 * 1000;

const MainLayout = () => {
  const { user, logout, expireSessionDueToInactivity } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { closeNotificationsPanel } = useDashboard();
  const [sessionExpired, setSessionExpired] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleIdle = useCallback(async () => {
    await expireSessionDueToInactivity();
    setSessionExpired(true);
  }, [expireSessionDueToInactivity]);

  useIdleTimeout(handleIdle, SESSION_TIMEOUT_MS, user.isAuthenticated);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user.isAuthenticated) {
      navigate("/");
    }
  }, [user.isAuthenticated, navigate]);

  // Determine if it is a module page to toggle styles
  const isModulePage = location.pathname.startsWith("/modules");

  return (
    <div
      className={`${styles.dashboardScreen} ${isModulePage ? styles.modulePageBg : ""}`}
      onClick={closeNotificationsPanel}
    >
      <TopNav onLogout={handleLogout} />
      <NotificationPanel />
      <SessionExpiredModal
        open={sessionExpired}
        onDismiss={() => {
          setSessionExpired(false);
          navigate("/");
        }}
      />
      <div className={styles.dashboardBody}>
        <Sidebar />
        <div className={styles.mainContent}>
          <div className={styles.pageContainer}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
