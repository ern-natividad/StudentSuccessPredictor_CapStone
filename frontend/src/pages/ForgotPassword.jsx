import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../styles/Auth.module.css";
import engineeringLogo from "../assets/EngineeringLogo.jpg";
import {
  requestPasswordReset,
  verifyPasswordResetCode,
  resetPassword as resetPasswordApi,
} from "../services/authApi";

const STEPS = {
  REQUEST: "request",
  VERIFY: "verify",
  RESET: "reset",
  DONE: "done",
};

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.REQUEST);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [userRole, setUserRole] = useState("student");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordReqs, setPasswordReqs] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false,
  });

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your registered email or username.");
      return;
    }

    setLoading(true);
    try {
      const result = await requestPasswordReset(email.trim());
      setDevCode(result.devCode || "");
      setStep(STEPS.VERIFY);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");
    if (!code.trim()) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      await verifyPasswordResetCode(email.trim(), code.trim());
      setStep(STEPS.RESET);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (value) => {
    setNewPassword(value);
    setPasswordReqs({
      length: value.length >= 8,
      uppercase: /[A-Z]/.test(value),
      number: /[0-9]/.test(value),
      special: /[^A-Za-z0-9]/.test(value),
    });
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    const allMet = Object.values(passwordReqs).every(Boolean);
    if (!allMet) {
      setError("Please meet all password requirements.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await resetPasswordApi(email.trim(), newPassword);
      setUserRole(result.role || "student");
      setStep(STEPS.DONE);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await requestPasswordReset(email.trim());
      setDevCode(result.devCode || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate(`/auth/${userRole}`);
  };

  return (
    <div className={styles.authScreen}>
      <div className={styles.authCard}>
        <div className={styles.brandPanel}>
          <div className={styles.logoContainer}>
            <img
              src={engineeringLogo}
              alt="WMSU College of Engineering and Technology Seal"
              className={styles.brandLogoImage}
            />
          </div>
          <div className={styles.brandWordmark}>
            <span className={styles.dept}>Engineering</span>
            <span className={styles.system}>WMSU HAWKS</span>
          </div>
          <div className={styles.brandRule}></div>
          <p className={styles.brandSubtitle}>
            Account Recovery — College of Engineering
          </p>
          <div className={styles.brandBadge}>Est. WMSU</div>
        </div>

        <div className={styles.formPanel}>
          <Link
            to="/auth"
            className={styles.backButton}
            style={{ textDecoration: "none" }}
          >
            <i className="fas fa-arrow-left"></i>
            Back to sign in
          </Link>

          <div className={styles.formView}>
            {step === STEPS.REQUEST && (
              <>
                <div className={styles.fvHeading}>Forgot Password</div>
                <div className={styles.fvSub}>
                  Enter your registered email or username and we&apos;ll send
                  you a verification code.
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

                <form onSubmit={handleRequestCode}>
                  <div className={styles.fGroup}>
                    <label className={styles.fLabel} htmlFor="resetEmail">
                      Email or Username
                    </label>
                    <input
                      id="resetEmail"
                      type="text"
                      className={styles.fInput}
                      placeholder="you@wmsu.edu.ph"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                    />
                  </div>
                  <button type="submit" className={styles.btnGold} disabled={loading}>
                    {loading ? "Sending..." : "Send Verification Code"}
                  </button>
                </form>
              </>
            )}

            {step === STEPS.VERIFY && (
              <>
                <div className={styles.fvHeading}>Enter Verification Code</div>
                <div className={styles.fvSub}>
                  We sent a 6-digit code to <strong>{email}</strong>. Enter it
                  below to continue.
                </div>

                {devCode && (
                  <div
                    className={styles.errorBox}
                    style={{
                      background: "#fff9d9",
                      border: "1px solid #f0e0a0",
                      color: "#7a5c00",
                    }}
                  >
                    <span>
                      Demo mode (no email server connected) — your code is{" "}
                      <strong>{devCode}</strong>
                    </span>
                  </div>
                )}

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

                <form onSubmit={handleVerifyCode}>
                  <div className={styles.fGroup}>
                    <label className={styles.fLabel} htmlFor="resetCode">
                      6-Digit Code
                    </label>
                    <input
                      id="resetCode"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      className={styles.fInput}
                      placeholder="123456"
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.replace(/\D/g, ""));
                        setError("");
                      }}
                    />
                  </div>
                  <button type="submit" className={styles.btnGold} disabled={loading}>
                    {loading ? "Verifying..." : "Verify Code"}
                  </button>
                </form>

                <div className={styles.authSwitch}>
                  Didn&apos;t get a code?{" "}
                  <button
                    type="button"
                    className={styles.signupLink}
                    onClick={handleResend}
                    disabled={loading}
                    style={{ background: "none", border: "none", cursor: "pointer" }}
                  >
                    Resend code
                  </button>
                </div>
              </>
            )}

            {step === STEPS.RESET && (
              <>
                <div className={styles.fvHeading}>Set a New Password</div>
                <div className={styles.fvSub}>
                  Choose a strong password for your account.
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

                <form onSubmit={handleResetPassword}>
                  <div className={styles.fGroup}>
                    <label className={styles.fLabel} htmlFor="newPassword">
                      New Password
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      className={styles.fInput}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                    />
                    <div className={styles.reqPills}>
                      <span
                        className={`${styles.reqPill} ${passwordReqs.length ? styles.ok : ""}`}
                      >
                        <span className={styles.dot}></span>
                        At least 8 characters
                      </span>
                      <span
                        className={`${styles.reqPill} ${passwordReqs.uppercase ? styles.ok : ""}`}
                      >
                        <span className={styles.dot}></span>
                        Uppercase letter
                      </span>
                      <span
                        className={`${styles.reqPill} ${passwordReqs.number ? styles.ok : ""}`}
                      >
                        <span className={styles.dot}></span>
                        Number
                      </span>
                      <span
                        className={`${styles.reqPill} ${passwordReqs.special ? styles.ok : ""}`}
                      >
                        <span className={styles.dot}></span>
                        Special character
                      </span>
                    </div>
                  </div>

                  <div className={styles.fGroup}>
                    <label className={styles.fLabel} htmlFor="confirmNewPassword">
                      Confirm New Password
                    </label>
                    <input
                      id="confirmNewPassword"
                      type="password"
                      className={styles.fInput}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError("");
                      }}
                    />
                  </div>

                  <button type="submit" className={styles.btnGold} disabled={loading}>
                    {loading ? "Updating..." : "Reset Password"}
                  </button>
                </form>
              </>
            )}

            {step === STEPS.DONE && (
              <>
                <div className={styles.fvHeading}>Password Updated</div>
                <div className={styles.fvSub}>
                  Your password has been changed successfully. You can now
                  sign in with your new password.
                </div>
                <button
                  type="button"
                  className={styles.btnGold}
                  onClick={handleBackToLogin}
                >
                  Back to Sign In
                </button>
              </>
            )}
          </div>

          <p className={styles.authSwitch}>
            Remembered your password?{" "}
            <Link to="/auth" className={styles.formLink}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
