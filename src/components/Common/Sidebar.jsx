import React from "react";
import { useDashboard } from "../../hooks/useDashboard";
import styles from "../../styles/Dashboard.module.css";

const Sidebar = () => {
  const { currentPage, showPage } = useDashboard();

  const pages = [
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

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarSectionLabel}>Overview</div>
      {pages.slice(0, 2).map((page) => (
        <button
          key={page.id}
          className={`${styles.sidebarItem} ${currentPage === page.id ? styles.active : ""}`}
          onClick={() => showPage(page.id)}
        >
          <span className={styles.siIcon}>
            {page.icon.includes("fas") ? (
              <i className={page.icon}></i>
            ) : (
              page.icon
            )}
          </span>
          {page.label}
          {page.badge && <span className={styles.siBadge}>{page.badge}</span>}
        </button>
      ))}

      <div className={styles.sidebarDivider}></div>
      <div className={styles.sidebarSectionLabel}>Academic</div>
      {pages.slice(2).map((page) => (
        <button
          key={page.id}
          className={`${styles.sidebarItem} ${currentPage === page.id ? styles.active : ""}`}
          onClick={() => showPage(page.id)}
        >
          <span className={styles.siIcon}>
            {page.icon.includes("fas") ? (
              <i className={page.icon}></i>
            ) : (
              page.icon
            )}
          </span>
          {page.label}
          {page.badge && <span className={styles.siBadge}>{page.badge}</span>}
        </button>
      ))}
    </aside>
  );
};

export default Sidebar;
