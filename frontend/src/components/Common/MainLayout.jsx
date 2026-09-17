import { useEffect, useState, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useIdleTimeout } from "../../hooks/useIdleTimeout";
import TopNav from "./TopNav";
import Sidebar from "./Sidebar";
import MobileNavDrawer from "./MobileNavDrawer";
import NotificationPanel from "./NotificationPanel";
import SessionExpiredModal from "./SessionExpiredModal";
import styles from "../../styles/Dashboard.module.css";

const SESSION_TIMEOUT_MS = 15 * 60 * 1000;

const MainLayout = () => {
  const { user, logout, expireSessionDueToInactivity } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionExpired, setSessionExpired] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const closeMobileNav = useCallback(() => {
    setMobileNavOpen(false);
  }, []);

  const toggleMobileNav = useCallback(() => {
    setMobileNavOpen((open) => !open);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleIdle = useCallback(async () => {
    await expireSessionDueToInactivity();
    setSessionExpired(true);
  }, [expireSessionDueToInactivity]);

  useIdleTimeout(handleIdle, SESSION_TIMEOUT_MS, user.isAuthenticated);

  useEffect(() => {
    if (!user.isAuthenticated) {
      navigate("/");
    }
  }, [user.isAuthenticated, navigate]);

  const isModulePage = location.pathname.startsWith("/modules");

  return (
    <div
      className={`${styles.dashboardScreen} ${isModulePage ? styles.modulePageBg : ""}`}
    >
      <TopNav
        onLogout={handleLogout}
        mobileNavOpen={mobileNavOpen}
        onToggleMobileNav={toggleMobileNav}
      />
      {(user?.role === "admin" || user?.role === "staff") && (
        <NotificationPanel />
      )}
      <SessionExpiredModal
        open={sessionExpired}
        onDismiss={() => {
          setSessionExpired(false);
          navigate("/");
        }}
      />

      <MobileNavDrawer open={mobileNavOpen} onClose={closeMobileNav} />

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
