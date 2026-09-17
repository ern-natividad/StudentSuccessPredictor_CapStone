import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useDashboard } from "../../hooks/useDashboard";
import { getDashboardPath } from "../../utils/authUtils";
import styles from "../../styles/Dashboard.module.css";

const getNavConfig = (role, unreadAlertCount) => {
  if (role === "student") {
    return {
      sectionLabel: "Student Panel",
      defaultTab: "prediction",
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

  if (role === "staff") {
    return {
      sectionLabel: "Staff Panel",
      defaultTab: "dashboard",
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
    defaultTab: "dashboard",
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

const MobileNavDrawer = ({ open, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  const { unreadAlertCount } = useDashboard();
  const basePath = getDashboardPath(user?.role);
  const locationKeyRef = useRef(`${location.pathname}${location.search}`);

  const config = useMemo(
    () => getNavConfig(user?.role, unreadAlertCount),
    [user?.role, unreadAlertCount],
  );

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    const nextKey = `${location.pathname}${location.search}`;
    if (open && nextKey !== locationKeyRef.current) {
      onClose();
    }
    locationKeyRef.current = nextKey;
  }, [location.pathname, location.search, open, onClose]);

  if (typeof document === "undefined" || !open) return null;

  const currentTab =
    new URLSearchParams(location.search).get("tab") || config.defaultTab;
  const onModuleRoute = location.pathname.startsWith("/modules");

  return createPortal(
    <div className={styles.mobileNavRoot}>
      <button
        type="button"
        className={styles.mobileNavBackdrop}
        aria-label="Close navigation menu"
        onClick={onClose}
      />
      <nav
        id="app-mobile-nav"
        className={styles.mobileNavDrawer}
        aria-label="Mobile navigation"
      >
        <div className={styles.sidebarSectionLabel}>{config.sectionLabel}</div>
        {config.items.map((item) => {
          const isActive = !onModuleRoute && currentTab === item.id;
          return (
            <NavLink
              key={item.id}
              to={`${basePath}?tab=${item.id}`}
              className={`${styles.sidebarItem} ${isActive ? styles.active : ""}`}
              onClick={onClose}
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
                  onClick={onClose}
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
      </nav>
    </div>,
    document.body,
  );
};

export default MobileNavDrawer;
