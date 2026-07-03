import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useDashboard } from "../../hooks/useDashboard";
import { generateInitials } from "../../utils/authUtils";
import ConfirmModal from "./ConfirmModal";
import engineeringLogo from "../../assets/EngineeringLogo.jpg";
import styles from "../../styles/Dashboard.module.css";

const TopNav = ({ onLogout }) => {
  const { user } = useAuth();
  const { toggleNotificationsPanel, alerts } = useDashboard();
  const [showConfirm, setShowConfirm] = useState(false);
  const initials = generateInitials(user.name);
  const ROLE_LABELS = {
    admin: "System Administrator",
    staff: "Academic Staff",
    student: "Engineering Student - 3rd Year",
  };
  const roleLabel = ROLE_LABELS[user.role] ?? "User";

  const handleLogoutClick = () => setShowConfirm(true);
  const handleConfirmLogout = () => {
    setShowConfirm(false);
    onLogout();
  };
  const handleCancelLogout = () => setShowConfirm(false);

  return (
    <>
      <nav className={styles.topNav}>
        <div className={styles.navLogo}>
          <img 
            src={engineeringLogo} 
            alt="WMSU College of Engineering Logo" 
            className={styles.navLogoIcon}
            style={{ 
              width: "28px", 
              height: "28px", 
              objectFit: "contain",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              padding: "2px"
            }}
          />
          <div>
            <div className={styles.navLogoText}>HawkPredict</div>
            <div className={styles.navLogoSub}>WMSU — College of Engineering</div>
          </div>
        </div>
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
            <div className={styles.navUserRole}>{roleLabel}</div>
          </div>
          <div className={styles.navAvatar}>{initials}</div>
          <button className={styles.navLogout} onClick={handleLogoutClick}>
            Logout
          </button>
        </div>
      </nav>
      <ConfirmModal
        open={showConfirm}
        title="Confirm Logout"
        description="Are you sure you want to log out? You will need to sign in again to continue."
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
        confirmText="Logout"
        cancelText="Stay Logged In"
      />
    </>
  );
};

export default TopNav;
