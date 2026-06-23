import React, { useEffect, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "../../hooks/useDashboard";
import TopNav from "../Common/TopNav";
import Sidebar from "../Common/Sidebar";
import NotificationPanel from "../Common/NotificationPanel";
import StudentPrediction from "./StudentPrediction";
import WhatIfSimulator from "./WhatIfSimulator";
import styles from "../../styles/Dashboard.module.css";

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { currentPage, closeNotificationsPanel, showPage } = useDashboard();

  const studentPages = useMemo(
    () => [
      { id: "prediction", icon: "fas fa-chart-line", label: "Prediction Result" },
      { id: "simulator", icon: "🔬", label: "What-If Simulator" },
    ],
    [],
  );

  const userPages = useMemo(() => {
    if (user.role === "student") {
      return studentPages;
    }
    return [
      { id: "dashboard", icon: "fas fa-chart-bar", label: "Dashboard" },
      { id: "students", icon: "fas fa-users", label: "All Students" },
      { id: "simulator", icon: "🔬", label: "What-If Simulator" },
      {
        id: "alerts",
        icon: "fas fa-exclamation-triangle",
        label: "Early Alerts",
        badge: 5,
      },
      { id: "screening", icon: "fas fa-check-square", label: "Screening" },
      { id: "reports", icon: "fas fa-file-alt", label: "Reports" },
    ];
  }, [studentPages, user.role]);

  useEffect(() => {
    if (user.role === "student") {
      const validPage = userPages.some((page) => page.id === currentPage);
      if (!validPage) {
        showPage("prediction");
      }
    }
  }, [currentPage, showPage, user.role, userPages]);

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

  const renderPage = () => {
    if (user.role === "student") {
      switch (currentPage) {
        case "prediction":
          return <StudentPrediction />;
        case "simulator":
          return <WhatIfSimulator />;
        default:
          return <StudentPrediction />;
      }
    }

    // The admin/staff dashboard page content is handled in their own routes.
    return <StudentPrediction />;
  };

  return (
    <div className={styles.dashboardScreen} onClick={closeNotificationsPanel}>
      <TopNav onLogout={handleLogout} />
      <NotificationPanel />
      <div className={styles.dashboardBody}>
        <Sidebar pages={userPages} />
        <div className={styles.mainContent}>
          <div className={styles.pageContainer}>{renderPage()}</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
