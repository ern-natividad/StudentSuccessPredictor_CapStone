import { useState } from "react";
import axios from "axios";
import styles from "../../styles/Modules.module.css";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../Common/Toast";

const MfaSetup = ({ twoFactorEnabled, onChanged }) => {
  const { updateUserFields } = useAuth(); // 💡 Added: Pull the field updater from AuthContext
  const toast = useToast();
  const [step, setStep] = useState("idle"); // idle | qr | done | confirm_disable
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
  const [manualEntryKey, setManualEntryKey] = useState("");
  const [code, setCode] = useState(""); // Used for enabling setup
  const [disableCode, setDisableCode] = useState(""); // Used for security confirmation during disable
  const [loading, setLoading] = useState(false);

  // Helper to quickly grab token
  const getAuthHeader = () => {
    const token = sessionStorage.getItem("authToken");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const startSetup = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5001/api/mfa/setup/start", {}, getAuthHeader());
      setQrCodeDataUrl(response.data.qrCodeDataUrl);
      setManualEntryKey(response.data.manualEntryKey);
      setStep("qr");
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.message;
      toast.error(serverMessage || "Failed to start MFA setup.");
    } finally {
      setLoading(false);
    }
  };

  const confirmSetup = async () => {
    if (!code) {
      toast.error("Please enter the 6-digit verification code.");
      return;
    }
    setLoading(true);
    try {
      await axios.post("http://localhost:5001/api/mfa/setup/confirm", { code }, getAuthHeader());

      // 💡 FIX: Sync the AuthContext state permanently for page reloads
      updateUserFields({ twoFactorEnabled: true });

      setStep("done");
      toast.success("Two-factor authentication enabled successfully.");
      onChanged?.(true);
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.message;
      toast.error(serverMessage || "Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const disable = async () => {
    if (!disableCode) {
      toast.error("Please enter your current authentication code to disable protection.");
      return;
    }

    setLoading(true);
    try {
      await axios.post("http://localhost:5001/api/mfa/disable", { code: disableCode }, getAuthHeader());

      // 💡 FIX: Sync the AuthContext state permanently for page reloads
      updateUserFields({ twoFactorEnabled: false });

      setStep("idle");
      setDisableCode("");
      toast.success("Two-factor authentication disabled.");
      onChanged?.(false);
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.message;
      toast.error(serverMessage || "Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.moduleCard}>
      <div className={styles.moduleTitleSmall}>Two-Factor Authentication</div>

      {twoFactorEnabled ? (
        <>
          {step === "confirm_disable" ? (
            <div style={{ marginTop: "12px" }}>
              <p className={styles.moduleSubtitle} style={{ color: "#d9534f", fontWeight: "600" }}>
                Are you absolutely sure?
              </p>
              <p className={styles.moduleSubtitle}>
                Disabling multi-factor authentication drops an extra layer of account protection. 
                To proceed, confirm by typing the current code from your authenticator application.
              </p>
              <div className={styles.formField} style={{ maxWidth: 220, marginBottom: 12 }}>
                <label className={styles.formLabel}>Authentication Code</label>
                <input
                  className={styles.formInput}
                  value={disableCode}
                  maxLength={6}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  autoFocus
                />
              </div>
              <div className={styles.buttonGroup}>
                <button 
                  className={styles.primaryButton} 
                  style={{ backgroundColor: "#d9534f", borderColor: "#d43f3a" }}
                  onClick={disable} 
                  disabled={loading}
                >
                  {loading ? "Disabling..." : "Yes, Disable Protection"}
                </button>
                <button 
                  className={styles.secondaryButton} 
                  onClick={() => { setStep("idle"); setDisableCode(""); }}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className={styles.moduleSubtitle}>
                Two-factor authentication is currently <strong>enabled</strong> on
                your account via Google Authenticator.
              </p>
              <div className={styles.buttonGroup}>
                <button className={styles.secondaryButton} onClick={() => setStep("confirm_disable")} disabled={loading}>
                  Disable Two-Factor Authentication
                </button>
              </div>
            </>
          )}
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