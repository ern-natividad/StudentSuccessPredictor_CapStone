import { useState } from "react";
import styles from "../../styles/Modules.module.css";
import { api } from "../../services/api";

/**
 * Drop this card into any settings/profile page (e.g. inside a new
 * "Account Settings" module card, or an existing admin/staff settings
 * screen). It reuses the existing moduleCard / button / form classes so it
 * matches the current design exactly.
 */
const MfaSetup = ({ twoFactorEnabled, onChanged }) => {
  const [step, setStep] = useState("idle"); // idle | qr | done
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
  const [manualEntryKey, setManualEntryKey] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const startSetup = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await api.startMfaSetup();
      setQrCodeDataUrl(result.qrCodeDataUrl);
      setManualEntryKey(result.manualEntryKey);
      setStep("qr");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmSetup = async () => {
    setError("");
    setLoading(true);
    try {
      await api.confirmMfaSetup(code);
      setStep("done");
      onChanged?.(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const disable = async () => {
    setError("");
    setLoading(true);
    try {
      await api.disableMfa();
      setStep("idle");
      onChanged?.(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.moduleCard}>
      <div className={styles.moduleTitleSmall}>Two-Factor Authentication</div>

      {error && <div className={styles.alertBanner}>{error}</div>}

      {twoFactorEnabled ? (
        <>
          <p className={styles.moduleSubtitle}>
            Two-factor authentication is currently <strong>enabled</strong> on
            your account via Google Authenticator.
          </p>
          <div className={styles.buttonGroup}>
            <button className={styles.secondaryButton} onClick={disable} disabled={loading}>
              {loading ? "Working..." : "Disable Two-Factor Authentication"}
            </button>
          </div>
        </>
      ) : step === "idle" ? (
        <>
          <p className={styles.moduleSubtitle}>
            Add an extra layer of security to your account using Google
            Authenticator.
          </p>
          <div className={styles.buttonGroup}>
            <button className={styles.primaryButton} onClick={startSetup} disabled={loading}>
              {loading ? "Preparing..." : "Enable Two-Factor Authentication"}
            </button>
          </div>
        </>
      ) : step === "qr" ? (
        <>
          <p className={styles.moduleSubtitle}>
            Scan this QR code with Google Authenticator, then enter the
            6-digit code it generates.
          </p>
          {qrCodeDataUrl && (
            <img
              src={qrCodeDataUrl}
              alt="Google Authenticator QR code"
              style={{ width: 180, height: 180, margin: "16px 0" }}
            />
          )}
          <div className={styles.formField} style={{ marginBottom: 12 }}>
            <label className={styles.formLabel}>Manual entry key</label>
            <code style={{ wordBreak: "break-all" }}>{manualEntryKey}</code>
          </div>
          <div className={styles.formField} style={{ maxWidth: 200, marginBottom: 12 }}>
            <label className={styles.formLabel}>Verification Code</label>
            <input
              className={styles.formInput}
              value={code}
              maxLength={6}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
            />
          </div>
          <div className={styles.buttonGroup}>
            <button className={styles.primaryButton} onClick={confirmSetup} disabled={loading}>
              {loading ? "Verifying..." : "Verify & Enable"}
            </button>
            <button className={styles.secondaryButton} onClick={() => setStep("idle")}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <p className={styles.moduleSubtitle}>
          ✓ Two-factor authentication is now enabled on your account.
        </p>
      )}
    </div>
  );
};

export default MfaSetup;
