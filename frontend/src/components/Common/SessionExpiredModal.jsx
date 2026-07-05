// Reuses the existing modal styling from Common.module.css (same classes as
// ConfirmModal) so it matches the current UI exactly — no new design system.
import styles from "../../styles/Common.module.css";

const SessionExpiredModal = ({ open, onDismiss }) => {
  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>Session Expired</h2>
        <p className={styles.modalDescription}>
          Your session has expired due to inactivity.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className={styles.btnSmallDanger} onClick={onDismiss}>
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
