import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useDashboard } from "../../hooks/useDashboard";
import { getDashboardPath } from "../../utils/authUtils";
import styles from "../../styles/Dashboard.module.css";

const Sidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentPage, showPage, alerts } = useDashboard();

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

  const isModulePage = location.pathname.startsWith("/modules");

  // Resolve items based on role
  const getSidebarConfig = () => {
    if (user.role === "student") {
      return {
        sectionLabel: "Student Panel",
        items: [
          {
            id: "prediction",
            icon: "fas fa-chart-line",
            label: "Prediction Result",
          },
          {
            id: "grades",
            icon: "fas fa-book",
            label: "My Grades",
          },
          {
            id: "settings",
            icon: "fas fa-user-cog",
            label: "Account Settings",
          },
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
            badge: alerts.length,
          },
          { id: "screening", icon: "fas fa-check-square", label: "Screening" },
          {
            id: "settings",
            icon: "fas fa-user-cog",
            label: "Account Settings",
          },
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

    // admin
    return {
      sectionLabel: "Admin Panel",
      items: [
        { id: "dashboard", icon: "fas fa-chart-bar", label: "Overview" },
        { id: "students", icon: "fas fa-users", label: "Students" },
        {
          id: "adviser-manager",
          icon: "fas fa-user-tie",
          label: "Manage Adviser",
        },
        {
          id: "alerts",
          icon: "fas fa-exclamation-triangle",
          label: "Alerts",
          badge: alerts.length,
        },
        
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

  const handleTabClick = (pageId) => {
    const basePath = getDashboardPath(user.role);
    if (location.pathname !== basePath) {
      navigate(`${basePath}?tab=${pageId}`);
    } else {
      showPage(pageId);
    }
  };

  const handleModuleClick = (path) => {
    navigate(path);
  };

  const renderItemButton = (item) => {
    const isActive = !isModulePage && currentPage === item.id;
    return (
      <button
        key={item.id}
        className={`${styles.sidebarItem} ${isActive ? styles.active : ""}`}
        onClick={() => handleTabClick(item.id)}
        title={isCollapsed ? item.label : ""}
      >
        <span className={styles.siIcon}>
          {item.icon.includes("fas") ? (
            <i className={item.icon}></i>
          ) : (
            item.icon
          )}
        </span>
        <span className={styles.sidebarText}>{item.label}</span>
        {item.badge ? (
          <span className={styles.siBadge}>{item.badge}</span>
        ) : null}
      </button>
    );
  };

  const renderModuleButton = (item) => {
    const isActive = location.pathname === item.path;
    return (
      <button
        key={item.id}
        className={`${styles.sidebarItem} ${isActive ? styles.active : ""}`}
        onClick={() => handleModuleClick(item.path)}
        title={isCollapsed ? item.label : ""}
      >
        <span className={styles.siIcon}>
          {item.icon.includes("fas") ? (
            <i className={item.icon}></i>
          ) : (
            item.icon
          )}
        </span>
        <span className={styles.sidebarText}>{item.label}</span>
      </button>
    );
  };

  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}
      style={{
        whiteSpace: "nowrap",
        overflowX: "hidden",
      }}
    >
      <div className={styles.sidebarSectionLabel}>{config.sectionLabel}</div>
      {config.items.map(renderItemButton)}

      {config.modules.length > 0 && (
        <>
          <div className={styles.sidebarDivider}></div>
          <div className={styles.sidebarSectionLabel}>Modules</div>
          {config.modules.map(renderModuleButton)}
        </>
      )}

      <div className={styles.sidebarToggleContainer}>
        <button className={styles.sidebarToggleButton} onClick={toggleCollapse}>
          <i
            className={`fas ${isCollapsed ? "fa-chevron-right" : "fa-chevron-left"}`}
          ></i>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
