import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useDashboard } from "../../hooks/useDashboard";
import { getDashboardPath } from "../../utils/authUtils";
import styles from "../../styles/Dashboard.module.css";

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { unreadAlertCount } = useDashboard();
  const basePath = getDashboardPath(user?.role);

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved === "true";
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebarCollapsed", String(next));
      window.dispatchEvent(new Event("sidebar-toggle"));
      return next;
    });
  };

  const getSidebarConfig = () => {
    if (user.role === "student") {
      return {
        sectionLabel: "Student Panel",
        items: [
          { id: "prediction", icon: "fas fa-chart-line", label: "Prediction Result" },
          { id: "grades", icon: "fas fa-book", label: "My Grades" },
          { id: "settings", icon: "fas fa-user-cog", label: "Account Settings" },
        ],
        modules: [
          {
            id: "ai-advising",
            label: "AI Advising",
            icon: "fas fa-lightbulb",
            path: "/modules/ai-advising",
          },
        ],
      };
    }

    if (user.role === "staff") {
      return {
        sectionLabel: "Staff Panel",
        items: [
          { id: "dashboard", icon: "fas fa-chart-bar", label: "Overview" },
          { id: "students", icon: "fas fa-users", label: "Students" },
          {
            id: "student-management",
            icon: "fas fa-user-edit",
            label: "Student Management",
          },
          {
            id: "alerts",
            icon: "fas fa-exclamation-triangle",
            label: "Early Alerts",
            badge: unreadAlertCount,
          },
          { id: "screening", icon: "fas fa-check-square", label: "Screening" },
          { id: "settings", icon: "fas fa-user-cog", label: "Account Settings" },
        ],
        modules: [
          {
            id: "pre-enrollment",
            label: "Degree Recommendation",
            icon: "fas fa-graduation-cap",
            path: "/modules/pre-enrollment",
          },
          {
            id: "curriculum",
            label: "Curriculum",
            icon: "fas fa-book",
            path: "/modules/curriculum",
          },
          {
            id: "academic-performance",
            label: "Performance Forecasting",
            icon: "fas fa-chart-line",
            path: "/modules/academic-performance",
          },
          {
            id: "ai-advising",
            label: "AI Advising",
            icon: "fas fa-lightbulb",
            path: "/modules/ai-advising",
          },
        ],
      };
    }

    return {
      sectionLabel: "Admin Panel",
      items: [
        { id: "dashboard", icon: "fas fa-chart-bar", label: "Overview" },
        { id: "students", icon: "fas fa-users", label: "Students" },
        {
          id: "student-management",
          icon: "fas fa-user-edit",
          label: "Student Management",
        },
        {
          id: "adviser-manager",
          icon: "fas fa-user-tie",
          label: "Manage Adviser",
        },
        {
          id: "alerts",
          icon: "fas fa-exclamation-triangle",
          label: "Alerts",
          badge: unreadAlertCount,
        },
        { id: "announcements", icon: "fas fa-bullhorn", label: "News & Ads" },
        { id: "audit", icon: "fas fa-history", label: "Audit Logs" },
        { id: "settings", icon: "fas fa-user-cog", label: "Account Settings" },
      ],
      modules: [
        {
          id: "pre-enrollment",
          label: "Degree Recommendation",
          icon: "fas fa-graduation-cap",
          path: "/modules/pre-enrollment",
        },
        {
          id: "curriculum-manager",
          label: "Curriculum Manager",
          icon: "fas fa-book",
          path: "/modules/curriculum-manager",
        },
        {
          id: "academic-performance",
          label: "Performance Forecasting",
          icon: "fas fa-chart-line",
          path: "/modules/academic-performance",
        },
        {
          id: "ai-advising",
          label: "AI Advising",
          icon: "fas fa-lightbulb",
          path: "/modules/ai-advising",
        },
      ],
    };
  };

  const config = getSidebarConfig();
  const isModulePage = location.pathname.startsWith("/modules");
  const defaultTab =
    user.role === "student" ? "prediction" : "dashboard";
  const currentTab =
    new URLSearchParams(location.search).get("tab") || defaultTab;

  return (
    <aside
      id="app-sidebar"
      className={`${styles.sidebar} ${styles.desktopSidebar} ${
        isCollapsed ? styles.collapsed : ""
      }`}
    >
      <div className={styles.sidebarToolbar}>
        <button
          type="button"
          className={styles.sidebarCollapseButton}
          onClick={toggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <i
            className={`fas ${isCollapsed ? "fa-angles-right" : "fa-angles-left"}`}
            aria-hidden="true"
          />
        </button>
      </div>
      <div className={styles.sidebarSectionLabel}>{config.sectionLabel}</div>
      {config.items.map((item) => {
        const isActive = !isModulePage && currentTab === item.id;
        return (
          <NavLink
            key={item.id}
            to={`${basePath}?tab=${item.id}`}
            className={`${styles.sidebarItem} ${isActive ? styles.active : ""}`}
            title={isCollapsed ? item.label : ""}
          >
            <span className={styles.siIcon}>
              <i className={item.icon} aria-hidden="true" />
            </span>
            <span className={styles.sidebarText}>{item.label}</span>
            {item.badge ? (
              <span className={styles.siBadge}>{item.badge}</span>
            ) : null}
          </NavLink>
        );
      })}

      {config.modules.length > 0 ? (
        <>
          <div className={styles.sidebarDivider} />
          <div className={styles.sidebarSectionLabel}>Modules</div>
          {config.modules.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={`${styles.sidebarItem} ${isActive ? styles.active : ""}`}
                title={isCollapsed ? item.label : ""}
              >
                <span className={styles.siIcon}>
                  <i className={item.icon} aria-hidden="true" />
                </span>
                <span className={styles.sidebarText}>{item.label}</span>
              </NavLink>
            );
          })}
        </>
      ) : null}
    </aside>
  );
};

export default Sidebar;
