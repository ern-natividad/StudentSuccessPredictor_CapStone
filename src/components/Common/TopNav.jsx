import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { useDashboard } from "../../hooks/useDashboard";
import { generateInitials } from "../../utils/authUtils";
import styles from "../../styles/Dashboard.module.css";

const TopNav = ({ onLogout }) => {
  const { user } = useAuth();
  const { toggleNotificationsPanel, alerts } = useDashboard();
  const initials = generateInitials(user.name);

  return (
    <nav className={styles.topNav}>
      <div className={styles.navLogo}>
        <svg
          className={styles.navLogoIcon}
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="32" height="32" rx="6" fill="#F5C200" opacity=".15" />
          <path d="M16,4 L14,14 L16,15 L18,14 Z" fill="#F5C200" />
          <rect x="10" y="13" width="12" height="10" rx="1" fill="#C9A200" />
          <rect x="8" y="22" width="16" height="3" rx="1" fill="#8B6F00" />
          <rect
            x="8"
            y="23"
            width="16"
            height="3"
            rx="1"
            fill="#F5C200"
            opacity=".3"
          />
        </svg>
        <span className={styles.navLogoText}>Architecture Titans</span>
      </div>
      <div className={styles.navDivider}></div>
      <div className={styles.navRight}>
        <button className={styles.navBell} onClick={toggleNotificationsPanel}>
          <svg
            className="ico"
            viewBox="0 0 24 24"
            style={{ width: "16px", height: "16px" }}
          >
            <path
              d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M13.73 21a2 2 0 0 1-3.46 0"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
          {alerts.length > 0 && (
            <span className={styles.navBellBadge}>{alerts.length}</span>
          )}
        </button>
        <div>
          <div className={styles.navUserName}>{user.name}</div>
          <div className={styles.navUserRole}>
            Architecture {user.role} · 3rd Year
          </div>
        </div>
        <div className={styles.navAvatar}>{initials}</div>
        <button className={styles.navLogout} onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default TopNav;
