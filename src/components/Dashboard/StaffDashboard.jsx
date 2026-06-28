import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { DashboardProvider } from "../../contexts/DashboardContext";
import TopNav from "../Common/TopNav";
import NotificationPanel from "../Common/NotificationPanel";
import DashboardOverview from "../Dashboard/DashboardOverview";
import StudentsList from "../Dashboard/StudentsList";
import AlertsList from "../Dashboard/AlertsList";
import ScreeningPage from "../Dashboard/ScreeningPage";
import styles from "../../styles/Dashboard.module.css";

const StaffDashboardContent = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState("dashboard");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  React.useEffect(() => {
    if (!user.isAuthenticated) {
      navigate("/");
    }
  }, [user.isAuthenticated, navigate]);

  const staffPages = [
    { id: "dashboard", label: "Overview", icon: "fas fa-chart-bar" },
    { id: "students", label: "Students", icon: "fas fa-users" },
    { id: "alerts", label: "Early Alerts", icon: "fas fa-exclamation-triangle" },
    { id: "screening", label: "Screening", icon: "fas fa-check-square" },
  ];

  const moduleLinks = [
    { id: "pre-enrollment", label: "Degree Recommendation", path: "/modules/pre-enrollment" },
    { id: "academic-performance", label: "Performance Forecasting", path: "/modules/academic-performance" },
    { id: "what-if-simulator", label: "What-If Simulator", path: "/modules/what-if-simulator" },
    { id: "ai-advising", label: "AI Advising", path: "/modules/ai-advising" },
  ];

  const renderStaffPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardOverview />;
      case "students":
        return <StudentsList />;
      case "alerts":
        return <AlertsList />;
      case "screening":
        return <ScreeningPage />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className={styles.dashboardScreen}>
      <TopNav onLogout={handleLogout} />
      <NotificationPanel />
      <div className={styles.dashboardBody}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarSectionLabel}>Staff Panel</div>
          {staffPages.map((page) => (
            <button
              key={page.id}
              className={`${styles.sidebarItem} ${currentPage === page.id ? styles.active : ""}`}
              onClick={() => setCurrentPage(page.id)}
            >
              <span className={styles.siIcon}>
                <i className={page.icon}></i>
              </span>
              {page.label}
            </button>
          ))}

          <div className={styles.sidebarSectionLabel}>Modules</div>
          {moduleLinks.map((link) => (
            <button
              key={link.id}
              className={styles.sidebarItem}
              onClick={() => navigate(link.path)}
            >
              <span className={styles.siIcon}>📌</span>
              {link.label}
            </button>
          ))}
        </aside>
        <div className={styles.mainContent}>
          <div className={styles.pageContainer}>{renderStaffPage()}</div>
        </div>
      </div>
    </div>
  );
};

const StaffDashboard = () => (
  <DashboardProvider>
    <StaffDashboardContent />
  </DashboardProvider>
);

export default StaffDashboard;
