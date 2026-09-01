import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useDashboard } from "../../hooks/useDashboard";
import { generateInitials } from "../../utils/authUtils";
import ConfirmModal from "./ConfirmModal";
import engineeringLogo from "../../assets/EngineeringLogo.jpg";
import styles from "../../styles/Dashboard.module.css";

const TopNav = ({ onLogout }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggleNotificationsPanel, unreadAlertCount } = useDashboard();
  const [showConfirm, setShowConfirm] = useState(false);
  const displayName = user?.name || user?.fullName || user?.full_name || "User";
  const initials = generateInitials(displayName);
  const profilePicture = user?.profilePicture || user?.profile_picture || "";
  const ROLE_LABELS = {
    admin: "System Administrator",
    staff: "Academic Staff",
    student: "Student",
  };
  const roleLabel = ROLE_LABELS[user.role] ?? "User";

  const handleLogoutClick = () => setShowConfirm(true);
  const handleConfirmLogout = () => {
    setShowConfirm(false);
    onLogout();
  };
  const handleCancelLogout = () => setShowConfirm(false);

  const handleBellClick = (event) => {
    event.stopPropagation();
    toggleNotificationsPanel();
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

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
              padding: "2px",
            }}
          />
          <div>
            <div className={styles.navLogoText}>HawkPredict</div>
            <div className={styles.navLogoSub}>WMSU — College of Engineering</div>
          </div>
        </div>
        <div className={styles.navRight}>
          <button
            type="button"
            className={styles.navBell}
            data-nav-bell="true"
            onClick={handleBellClick}
            aria-label="Open notifications"
            title="Notifications"
          >
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
            {unreadAlertCount > 0 && (
              <span className={styles.navBellBadge}>
                {unreadAlertCount > 9 ? "9+" : unreadAlertCount}
              </span>
            )}
          </button>
          <div>
            <div className={styles.navUserName}>{displayName}</div>
            <div className={styles.navUserRole}>{roleLabel}</div>
          </div>
          <button
            type="button"
            className={styles.navAvatarButton}
            onClick={handleProfileClick}
            title="View profile"
            aria-label="View profile"
          >
            <div className={styles.navAvatar}>
              {profilePicture ? (
                <img src={profilePicture} alt={`${displayName} profile`} />
              ) : (
                initials
              )}
            </div>
          </button>
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
