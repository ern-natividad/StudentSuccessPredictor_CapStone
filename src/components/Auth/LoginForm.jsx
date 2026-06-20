import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/Auth.module.css";

const LoginForm = ({ onSwitch }) => {
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(email, password)) {
      navigate("/dashboard");
    }
  };

  return (
    <div className={styles.formView}>
      <div className={styles.fvHeading}>Welcome back</div>
      <div className={styles.fvSub}>
        Login to your Architecture Titans account
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
          <label className={styles.fLabel} htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            className={styles.fInput}
            placeholder="you@wmsu.edu.ph"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
          />
        </div>

        <div className={styles.fGroup}>
          <label className={styles.fLabel} htmlFor="password">
            Password
          </label>
          <div className={styles.fInputWrap}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className={styles.fInput}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
            />
            <button
              type="button"
              className={styles.fEye}
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              <svg className={styles.eyeIcon} viewBox="0 0 24 24">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </div>

        <div className={styles.fRowSpaced}>
          <label className={styles.fCheckRow}>
            <input type="checkbox" id="remember" />
            <span style={{ fontSize: "12px", color: "var(--stone)" }}>
              Keep me signed in
            </span>
          </label>
          <a
            href="#"
            className={styles.fLink}
            onClick={(e) => e.preventDefault()}
          >
            Forgot password?
          </a>
        </div>

        <button type="submit" className={styles.btnGold}>
          Login
        </button>
      </form>

      <div className={styles.authSwitch}>
        Don't have an account?{" "}
        <a
          href="#"
          className={styles.signupLink}
          onClick={(e) => {
            e.preventDefault();
            onSwitch();
          }}
        >
          Sign up here
        </a>
      </div>
    </div>
  );
};

export default LoginForm;
