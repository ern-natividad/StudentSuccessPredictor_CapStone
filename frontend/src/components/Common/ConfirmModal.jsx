import React from "react";
import styles from "../../styles/Common.module.css";

const ConfirmModal = ({ open, title, description, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel" }) => {
  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>{title}</h2>
        <p className={styles.modalDescription}>{description}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button className={styles.btnSmallOutline} onClick={onCancel}>
            {cancelText}
          </button>
          <button className={styles.btnSmallDanger} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
