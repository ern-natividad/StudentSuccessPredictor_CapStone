import React from "react";
import { useDashboard } from "../../hooks/useDashboard";
import styles from "../../styles/Dashboard.module.css";

const Sidebar = ({ pages: customPages }) => {
  const { currentPage, showPage } = useDashboard();

  const defaultPages = [
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

  const pages = customPages || defaultPages;
  const primaryPages = pages.slice(0, 2);
  const secondaryPages = pages.slice(2);

  const renderPageButton = (page) => (
    <button
      key={page.id}
      className={`${styles.sidebarItem} ${currentPage === page.id ? styles.active : ""}`}
      onClick={() => showPage(page.id)}
    >
      <span className={styles.siIcon}>
        {page.icon.includes("fas") ? <i className={page.icon}></i> : page.icon}
      </span>
      {page.label}
      {page.badge && <span className={styles.siBadge}>{page.badge}</span>}
    </button>
  );

  return (
    <aside className={styles.sidebar}>
      {primaryPages.length > 0 && (
        <>
          <div className={styles.sidebarSectionLabel}>Overview</div>
          {primaryPages.map(renderPageButton)}
        </>
      )}

      {secondaryPages.length > 0 && (
        <>
          <div className={styles.sidebarDivider}></div>
          <div className={styles.sidebarSectionLabel}>Academic</div>
          {secondaryPages.map(renderPageButton)}
        </>
      )}
    </aside>
  );
};

export default Sidebar;
