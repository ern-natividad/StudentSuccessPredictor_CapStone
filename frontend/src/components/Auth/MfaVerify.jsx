import { useState } from "react";
import styles from "../../styles/Auth.module.css";

/**
 * Pure presentational MFA-code entry step, styled with the exact same
 * classes as LoginForm/SignupForm so it slots into the existing auth card
 * without any visual changes. Verification itself happens in AuthContext
 * (completeMfaLogin), which this component calls via onSubmit.
 */
const MfaVerify = ({ onSubmit, onCancel, error, submitting }) => {
  const [code, setCode] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(code);
  };

  return (
    <div className={styles.formView}>
      <div className={styles.fvHeading}>Two-Factor Verification</div>
      <div className={styles.fvSub}>
        Enter the 6-digit code from your Google Authenticator app.
      </div>

      {error && (
        <div className={styles.errorBox}>
          <svg className={styles.errorIcon} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={styles.fGroup}>
          <label className={styles.fLabel} htmlFor="mfa-code">
            Authentication Code
          </label>
          <input
            id="mfa-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            className={styles.fInput}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            autoFocus
          />
        </div>

        <button type="submit" className={styles.btnGold} disabled={submitting}>
          {submitting ? "Verifying..." : "Verify & Continue"}
        </button>
      </form>

      <div className={styles.authSwitch}>
        <a
          href="#"
          className={styles.signupLink}
          onClick={(e) => {
            e.preventDefault();
            onCancel();
          }}
        >
          Back to login
        </a>
      </div>
    </div>
  );
};

export default MfaVerify;
