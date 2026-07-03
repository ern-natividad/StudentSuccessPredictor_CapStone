import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useDashboard } from "../../hooks/useDashboard";
import TopNav from "./TopNav";
import Sidebar from "./Sidebar";
import NotificationPanel from "./NotificationPanel";
import styles from "../../styles/Dashboard.module.css";

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { closeNotificationsPanel } = useDashboard();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

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
