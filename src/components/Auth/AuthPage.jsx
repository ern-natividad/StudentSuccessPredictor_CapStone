import React, { useState } from "react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import styles from "../../styles/Auth.module.css";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  const HelmetSVG = () => (
    <svg
      className={styles.brandHelmet}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="hg1" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#F5C200" />
          <stop offset="100%" stopColor="#8B6F00" />
        </radialGradient>
      </defs>
      {/* plume */}
      <path
        d="M50,8 C40,6 28,10 24,20 C30,16 40,16 50,20"
        fill="#C9A200"
        opacity=".6"
      />
      <path
        d="M50,8 C60,6 72,10 76,20 C70,16 60,16 50,20"
        fill="#C9A200"
        opacity=".6"
      />
      <path d="M50,5 L44,22 L50,20 L56,22 Z" fill="url(#hg1)" />
      {/* crest base */}
      <rect x="44" y="18" width="12" height="6" rx="2" fill="#A67C00" />
      {/* helmet bowl */}
      <path
        d="M20,42 C20,25 33,18 50,18 C67,18 80,25 80,42 L80,55 C80,60 76,63 72,63 L28,63 C24,63 20,60 20,55 Z"
        fill="url(#hg1)"
      />
      {/* visor */}
      <path d="M26,50 L74,50 L72,63 L28,63 Z" fill="#8B6F00" opacity=".7" />
      {/* cheek guard left */}
      <path
        d="M20,42 L16,58 C16,62 20,65 24,64 L28,63 L20,55 Z"
        fill="#C9A200"
        opacity=".8"
      />
      {/* cheek guard right */}
      <path
        d="M80,42 L84,58 C84,62 80,65 76,64 L72,63 L80,55 Z"
        fill="#C9A200"
        opacity=".8"
      />
      {/* neck guard */}
      <rect x="28" y="62" width="44" height="8" rx="2" fill="#8B6F00" />
      {/* eye slot */}
      <rect
        x="28"
        y="44"
        width="44"
        height="8"
        rx="3"
        fill="#1c1810"
        opacity=".8"
      />
      {/* highlight */}
      <path
        d="M32,28 C36,24 44,22 50,22"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* sword cross */}
      <line
        x1="14"
        y1="70"
        x2="86"
        y2="70"
        stroke="#C9A200"
        strokeWidth="3"
        strokeLinecap="round"
        opacity=".5"
      />
      <line
        x1="50"
        y1="58"
        x2="50"
        y2="90"
        stroke="#C9A200"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity=".5"
      />
      <rect
        x="44"
        y="68"
        width="12"
        height="4"
        rx="1"
        fill="#A67C00"
        opacity=".7"
      />
    </svg>
  );

  return (
    <div className={styles.authScreen}>
      <div className={styles.authCard}>
        {/* Brand Panel */}
        <div className={styles.brandPanel}>
          <HelmetSVG />
          <div className={styles.brandWordmark}>
            <span className={styles.dept}>Architecture</span>
            <span className={styles.system}>WMSU TITANS</span>
          </div>
          <div className={styles.brandRule}></div>
          <p className={styles.brandSubtitle}>
            Student Success Predictor — College of Architecture
          </p>
          <div className={styles.brandBadge}>Est. WMSU</div>
        </div>

        {/* Form Panel */}
        <div className={styles.formPanel}>
          {isLogin ? (
            <LoginForm onSwitch={() => setIsLogin(false)} />
          ) : (
            <SignupForm onSwitch={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
