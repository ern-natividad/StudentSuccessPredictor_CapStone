import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "../../hooks/useDashboard";
import TopNav from "../Common/TopNav";
import Sidebar from "../Common/Sidebar";
import NotificationPanel from "../Common/NotificationPanel";
import DashboardOverview from "./DashboardOverview";
import StudentsList from "./StudentsList";
import AlertsList from "./AlertsList";
import ScreeningPage from "./ScreeningPage";
import WhatIfSimulator from "./WhatIfSimulator";
import ReportsPage from "./ReportsPage";
import styles from "../../styles/Dashboard.module.css";

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { currentPage, closeNotificationsPanel } = useDashboard();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!user.isAuthenticated) {
      navigate("/");
    }
  }, [user.isAuthenticated, navigate]);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardOverview />;
      case "students":
        return <StudentsList />;
      case "alerts":
        return <AlertsList />;
      case "screening":
        return <ScreeningPage />;
      case "simulator":
        return <WhatIfSimulator />;
      case "reports":
        return <ReportsPage />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className={styles.dashboardScreen} onClick={closeNotificationsPanel}>
      <TopNav onLogout={handleLogout} />
      <NotificationPanel />
      <div className={styles.dashboardBody}>
        <Sidebar />
        <div className={styles.mainContent}>
          <div className={styles.pageContainer}>{renderPage()}</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
