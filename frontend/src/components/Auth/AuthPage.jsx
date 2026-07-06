import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import ForgotPasswordForm from "./ForgotPasswordForm";
import { useAuth } from "../../hooks/useAuth";
import { getAuthRole } from "../../utils/authUtils";
import styles from "../../styles/Auth.module.css";
import engineeringLogo from "../../assets/EngineeringLogo.jpg";

const AuthPage = () => {
  const [view, setView] = useState("login");
  const { role = "student" } = useParams();
  const navigate = useNavigate();
  const { setError } = useAuth();
  const roleConfig = getAuthRole(role);

  const handleBack = () => {
    setError("");
    navigate("/");
  };

  const switchView = (next) => {
    setError("");
    setView(next);
  };

  return (
    <div className={styles.authScreen}>
      <div className={styles.authCard}>
        {/* Brand Panel */}
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
          <div className={styles.brandBadge}>Est. WMSU</div>
        </div>

        {/* Form Panel */}
        <div className={styles.formPanel}>
          <button
            type="button"
            className={styles.backButton}
            onClick={handleBack}
          >
            <i className="fas fa-arrow-left"></i>
            Back to roles
          </button>
          <div className={styles.roleBadge}>{roleConfig.title}</div>
          {view === "login" && (
            <LoginForm
              roleConfig={roleConfig}
              onSwitch={() => switchView("signup")}
              onForgotPassword={() => switchView("forgot")}
            />
          )}
          {view === "signup" && (
            <SignupForm
              roleConfig={roleConfig}
              onSwitch={() => switchView("login")}
            />
          )}
          {view === "forgot" && (
            <ForgotPasswordForm
              roleConfig={roleConfig}
              onBackToLogin={() => switchView("login")}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
