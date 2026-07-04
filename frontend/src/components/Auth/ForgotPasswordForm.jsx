import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import styles from "../../styles/Auth.module.css";

const ForgotPasswordForm = ({ roleConfig, onBackToLogin }) => {
  const { requestPasswordReset, error, setError } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const success = await requestPasswordReset(email);
    setSubmitting(false);
    if (success) setSent(true);
  };

  if (sent) {
    return (
      <div className={styles.formView}>
        <div className={styles.fvHeading}>Check your email</div>
        <div className={styles.fvSub}>
          If an account exists for <strong>{email}</strong>, a password reset
          link is on its way. Open it to choose a new password.
        </div>
        <button
          type="button"
          className={styles.btnGold}
          onClick={onBackToLogin}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className={styles.formView}>
      <div className={styles.fvHeading}>Reset your password</div>
      <div className={styles.fvSub}>
        Enter the email on your {roleConfig.title.toLowerCase()} account and
        we'll send you a link to reset your password.
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
          <label className={styles.fLabel} htmlFor="reset-email">
            {roleConfig.emailLabel}
          </label>
          <input
            id="reset-email"
            type="email"
            className={styles.fInput}
            placeholder={roleConfig.emailPlaceholder}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
          />
        </div>

        <button type="submit" className={styles.btnGold} disabled={submitting}>
          {submitting ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <div className={styles.authSwitch}>
        Remembered your password?{" "}
        <a
          href="#"
          className={styles.signupLink}
          onClick={(e) => {
            e.preventDefault();
            onBackToLogin();
          }}
        >
          Back to sign in
        </a>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
