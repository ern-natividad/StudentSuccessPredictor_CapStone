import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useDashboard } from "../../hooks/useDashboard";
import { generateInitials } from "../../utils/authUtils";
import BrandHelmet from "./BrandHelmet";
import ConfirmModal from "./ConfirmModal";
import styles from "../../styles/Dashboard.module.css";

const TopNav = ({ onLogout }) => {
  const { user } = useAuth();
  const { toggleNotificationsPanel, alerts } = useDashboard();
  const [showConfirm, setShowConfirm] = useState(false);
  const initials = generateInitials(user.name);
  const roleLabel =
    user.role === "admin"
      ? "System Administrator"
      : user.role === "staff"
        ? "Academic Staff"
        : "Engineering Student - 3rd Year";

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
          <BrandHelmet className={styles.navLogoIcon} />
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
