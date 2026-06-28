import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  DashboardProvider,
  DashboardContext,
} from "../../contexts/DashboardContext";
import TopNav from "../Common/TopNav";
import Sidebar from "../Common/Sidebar";
import NotificationPanel from "../Common/NotificationPanel";
import DashboardOverview from "../Dashboard/DashboardOverview";
import StudentsList from "../Dashboard/StudentsList";
import AlertsList from "../Dashboard/AlertsList";
import { STUDENTS, ALERTS_DATA } from "../../utils/constants";
import styles from "../../styles/Dashboard.module.css";
import commonStyles from "../../styles/Common.module.css";

const AdminDashboardContent = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [modelVersion, setModelVersion] = useState("1.3.0");
  const [showUpload, setShowUpload] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  React.useEffect(() => {
    if (!user.isAuthenticated) {
      navigate("/");
    }
  }, [user.isAuthenticated, navigate]);

  const adminPages = [
    { id: "dashboard", label: "Overview", icon: "fas fa-chart-bar" },
    { id: "students", label: "Students", icon: "fas fa-users" },
    { id: "alerts", label: "Alerts", icon: "fas fa-exclamation-triangle" },
    { id: "models", label: "Model Management", icon: "fas fa-cogs" },
    { id: "audit", label: "Audit Logs", icon: "fas fa-history" },
  ];

  const moduleLinks = [
    { id: "pre-enrollment", label: "Degree Recommendation", path: "/modules/pre-enrollment" },
    { id: "academic-performance", label: "Performance Forecasting", path: "/modules/academic-performance" },
    { id: "what-if-simulator", label: "What-If Simulator", path: "/modules/what-if-simulator" },
    { id: "ai-advising", label: "AI Advising", path: "/modules/ai-advising" },
  ];

  const renderAdminPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardOverview />;
      case "students":
        return <StudentsList />;
      case "alerts":
        return <AlertsList />;
      case "models":
        return (
          <div>
            <h1 className={styles.pageTitle}>Model Management</h1>
            <div
              className={commonStyles.grid}
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              }}
            >
              <div className={styles.card}>
                <div className={styles.cardTitle}>Current Model</div>
                <div className={commonStyles.metric}>
                  <div className={commonStyles.metricLabel}>Version</div>
                  <div className={commonStyles.metricValue}>{modelVersion}</div>
                </div>
                <div className={commonStyles.metric}>
                  <div className={commonStyles.metricLabel}>Accuracy</div>
                  <div className={commonStyles.metricValue}>94.2%</div>
                </div>
                <div className={commonStyles.metric}>
                  <div className={commonStyles.metricLabel}>Last Trained</div>
                  <div style={{ fontSize: "12px", color: "#5a5240" }}>
                    Yesterday 14:30
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardTitle}>Model Training</div>
                <button
                  onClick={() => setShowUpload(!showUpload)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "#F5C200",
                    border: "none",
                    borderRadius: "6px",
                    color: "#0f0d08",
                    fontWeight: "600",
                    cursor: "pointer",
                    marginBottom: "12px",
                  }}
                >
                  {showUpload ? "Cancel" : "Upload New Model"}
                </button>
                {showUpload && (
                  <div
                    style={{
                      border: "2px dashed rgba(245,194,0,0.3)",
                      borderRadius: "6px",
                      padding: "12px",
                      textAlign: "center",
                      color: "#5a5240",
                      fontSize: "12px",
                    }}
                  >
                    Drop model file here or click to select
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case "audit":
        return (
          <div>
            <h1 className={styles.pageTitle}>Audit Logs</h1>
            <div className={styles.card}>
              <table className={commonStyles.table}>
                <thead className={commonStyles.tableHead}>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={commonStyles.tableRow}>
                    <td>2024-01-15 14:30</td>
                    <td>Admin User</td>
                    <td>Model Update</td>
                    <td>Uploaded new model v1.3.0</td>
                  </tr>
                  <tr className={commonStyles.tableRow}>
                    <td>2024-01-15 10:15</td>
                    <td>Staff User</td>
                    <td>Student Alert</td>
                    <td>Acknowledged alert for Juan Dela Cruz</td>
                  </tr>
                  <tr className={commonStyles.tableRow}>
                    <td>2024-01-14 16:45</td>
                    <td>Admin User</td>
                    <td>Report Generated</td>
                    <td>Weekly risk assessment report</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
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
          <div className={styles.sidebarSectionLabel}>Admin Panel</div>
          {adminPages.map((page) => (
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
          <div className={styles.pageContainer}>{renderAdminPage()}</div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => (
  <DashboardProvider>
    <AdminDashboardContent />
  </DashboardProvider>
);

export default AdminDashboard;
