import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import { useAuth } from "../../hooks/useAuth";
import { getAuthRole } from "../../utils/authUtils";
import styles from "../../styles/Auth.module.css";

/* Phoenix / Eagle logo inspired by the uploaded image — gold bird with open book & pen */
const PhoenixSVG = () => (
  <svg
    className={styles.brandHelmet}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <radialGradient id="pg1" cx="50%" cy="40%">
        <stop offset="0%" stopColor="#c8860a" />
        <stop offset="100%" stopColor="#7a4f00" />
      </radialGradient>
      <radialGradient id="pg2" cx="50%" cy="60%">
        <stop offset="0%" stopColor="#e0a020" />
        <stop offset="100%" stopColor="#9a6200" />
      </radialGradient>
    </defs>

    {/* Circular arc background (partial ring like the reference) */}
    <path
      d="M15,55 A38,38 0 1,1 85,55"
      fill="none"
      stroke="url(#pg2)"
      strokeWidth="4"
      strokeLinecap="round"
      opacity="0.7"
    />

    {/* Open book base */}
    <path
      d="M22,68 Q50,60 78,68 L75,78 Q50,72 25,78 Z"
      fill="url(#pg1)"
      opacity="0.9"
    />
    {/* Book spine line */}
    <line x1="50" y1="61" x2="50" y2="78" stroke="#7a4f00" strokeWidth="1.5" />
    {/* Left page */}
    <path d="M25,78 Q37,70 50,61 L50,78 Z" fill="#c8860a" opacity="0.7" />
    {/* Right page */}
    <path d="M75,78 Q63,70 50,61 L50,78 Z" fill="#e0a020" opacity="0.7" />

    {/* Pen / quill pointing diagonally up-right from book */}
    <line x1="62" y1="74" x2="82" y2="50" stroke="url(#pg2)" strokeWidth="2.5" strokeLinecap="round" />
    <polygon points="82,50 77,54 79,56" fill="#c8860a" />

    {/* Body of the bird */}
    <ellipse cx="50" cy="46" rx="12" ry="9" fill="url(#pg1)" />

    {/* Left wing — swept back */}
    <path
      d="M50,44 C42,38 28,30 18,34 C26,36 34,42 38,48 C40,46 44,45 50,44 Z"
      fill="url(#pg2)"
    />
    <path
      d="M50,44 C42,36 24,22 14,26 C22,30 34,38 38,48 Z"
      fill="#c8860a"
      opacity="0.6"
    />

    {/* Right wing — swept back */}
    <path
      d="M50,44 C58,38 72,30 82,34 C74,36 66,42 62,48 C60,46 56,45 50,44 Z"
      fill="url(#pg2)"
    />
    <path
      d="M50,44 C58,36 76,22 86,26 C78,30 66,38 62,48 Z"
      fill="#c8860a"
      opacity="0.6"
    />

    {/* Neck */}
    <path d="M46,40 Q50,34 54,40 L52,46 L48,46 Z" fill="url(#pg1)" />

    {/* Head */}
    <ellipse cx="50" cy="32" rx="7" ry="6" fill="url(#pg1)" />

    {/* Beak */}
    <path d="M56,31 L63,33 L56,35 Z" fill="#9a6200" />

    {/* Eye */}
    <circle cx="53" cy="30" r="1.5" fill="#1a0808" />
    <circle cx="53.5" cy="29.5" r="0.5" fill="rgba(255,255,255,0.6)" />

    {/* Crown / crest feathers */}
    <path d="M50,26 L47,18 L50,22 L53,16 L52,22 L56,19 L53,24 Z" fill="url(#pg2)" />

    {/* Tail feathers */}
    <path d="M44,54 C38,60 30,66 26,72 C34,66 42,60 48,56 Z" fill="#c8860a" opacity="0.8" />
    <path d="M50,55 C48,62 46,70 44,76 C48,68 52,62 52,56 Z" fill="#e0a020" opacity="0.8" />
    <path d="M56,54 C62,60 70,66 74,72 C66,66 58,60 52,56 Z" fill="#c8860a" opacity="0.8" />
  </svg>
);

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { role = "student" } = useParams();
  const navigate = useNavigate();
  const { setError } = useAuth();
  const roleConfig = getAuthRole(role);

  const handleBack = () => {
    setError("");
    navigate("/");
  };

  return (
    <div className={styles.authScreen}>
      <div className={styles.authCard}>
        {/* Brand Panel */}
        <div className={styles.brandPanel}>
          <PhoenixSVG />
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
          {isLogin ? (
            <LoginForm
              roleConfig={roleConfig}
              onSwitch={() => setIsLogin(false)}
            />
          ) : (
            <SignupForm
              roleConfig={roleConfig}
              onSwitch={() => setIsLogin(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;