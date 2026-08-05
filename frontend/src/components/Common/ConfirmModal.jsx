import React from 'react';
import styles from "../../styles/Common.module.css";

const ConfirmModal = ({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "Logout",
  cancelText = "Stay Logged In",
}) => {
  if (!open) return null;

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>{title}</h2>
        <p className={styles.modalDescription}>{description}</p>
        
        <div className={styles.modalActions}>
          <button 
            type="button" 
            className={styles.cancelBtn} 
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            type="button" 
            className={styles.confirmBtn} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;