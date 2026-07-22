import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabaseClient";
import axios from "axios";
import styles from "../../styles/Auth.module.css";
import engineeringLogo from "../../assets/EngineeringLogo.jpg";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

const ResetPasswordPage = () => {
  const { error, setError } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [userId, setUserId] = useState(null);
  const [sessionEmail, setSessionEmail] = useState("");
  const [verifyingSession, setVerifyingSession] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // === STEP 1: CAPTURE THE LINK ROUTE CONTEXT ===
  useEffect(() => {
    const parseRecoverySession = async () => {
      try {
        // Supabase auto-parses the hash token from the email link into a valid session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user?.id) {
          setError("Your password reset link is invalid or has expired.");
        } else {
          setUserId(session.user.id);
          setSessionEmail(session.user.email || "");
        }
      } catch (err) {
        setError("An error occurred while validating your recovery session.");
      } finally {
        setVerifyingSession(false);
      }
    };

    parseRecoverySession();
  }, [setError]);

  // === STEP 2: FIXED SUBMISSION HANDLER ===
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Front-end validations
    if (password.length < 8) {
      return setError("Password must be at least 8 characters long.");
    }
    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setSubmitting(true);
    setError("");

    try {
      // Hits your correct backend reset controller
      const response = await axios.post(
        `${API_BASE}/auth/forgot-password/reset`,
        {
          userId: userId,
          email: sessionEmail,
          identifier: sessionEmail,
          newPassword: password,
        },
      );

      if (response.data.success) {
        setDone(true);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to update password. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
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
            Student Success Predictor — College of Engineering
          </p>
        </div>

        <div className={styles.formPanel}>
          {verifyingSession ? (
            <div className={styles.formView}>
              <div className={styles.fvHeading}>Verifying...</div>
              <div className={styles.fvSub}>
                Validating secure single-use access link parameters...
              </div>
            </div>
          ) : done ? (
            <div className={styles.formView}>
              <div className={styles.fvHeading}>Password updated</div>
              <div className={styles.fvSub}>
                Your password has been changed successfully. You can now sign in
                with your new password.
              </div>
              <button className={styles.btnGold} onClick={() => navigate("/")}>
                Continue to sign in
              </button>
            </div>
          ) : (
            <div className={styles.formView}>
              <div className={styles.fvHeading}>Set a new password</div>
              <div className={styles.fvSub}>
                Choose a new password for your account.
              </div>

              {error && (
                <div className={styles.errorBox}>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className={styles.fGroup}>
                  <label className={styles.fLabel} htmlFor="new-password">
                    New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      className={styles.fInput}
                      value={password}
                      disabled={!userId}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                    />
                    <button
                      type="button"
                      tabIndex="-1"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        color: "#666",
                        userSelect: "none",
                      }}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <small
                    style={{
                      display: "block",
                      marginTop: "4px",
                      color: password.length >= 8 ? "#2e7d32" : "#666",
                    }}
                  >
                    ● At least 8 characters
                  </small>
                </div>

                <div className={styles.fGroup}>
                  <label
                    className={styles.fLabel}
                    htmlFor="confirm-new-password"
                  >
                    Confirm Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="confirm-new-password"
                      type={showConfirmPassword ? "text" : "password"}
                      className={styles.fInput}
                      value={confirmPassword}
                      disabled={!userId}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError("");
                      }}
                    />
                    <button
                      type="button"
                      tabIndex="-1"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        color: "#666",
                        userSelect: "none",
                      }}
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className={styles.btnGold}
                  disabled={submitting || !userId}
                >
                  {submitting ? "Updating..." : "Update password"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
