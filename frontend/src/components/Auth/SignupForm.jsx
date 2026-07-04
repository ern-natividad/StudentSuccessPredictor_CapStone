import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { getDashboardPath } from "../../utils/authUtils";
import styles from "../../styles/Auth.module.css";

const SignupForm = ({ roleConfig, onSwitch }) => {
  const { signup, error, setError } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    studentId: "",
    employeeId: "",
    year: roleConfig.id === "student" ? roleConfig.groupOptions[0] : "",
    department: roleConfig.id !== "student" ? roleConfig.groupOptions[0] : "",
    accessCode: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [passwordReqs, setPasswordReqs] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    setError("");

    if (name === "password") {
      setPasswordReqs({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        number: /[0-9]/.test(value),
        special: /[^A-Za-z0-9]/.test(value),
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const result = await signup(formData, roleConfig.id);
    setSubmitting(false);

    if (result === "confirm-email") {
      setConfirmationSent(true);
    } else if (result === true) {
      navigate(getDashboardPath(roleConfig.id));
    }
  };

  if (confirmationSent) {
    return (
      <div className={styles.formView}>
        <div className={styles.fvHeading}>Check your email</div>
        <div className={styles.fvSub}>
          We sent a confirmation link to <strong>{formData.email}</strong>.
          Click it to activate your account, then come back and sign in.
        </div>
        <button
          type="button"
          className={styles.btnGold}
          onClick={onSwitch}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className={styles.formView}>
      <h2 className={styles.formHeading}>{roleConfig.signupTitle}</h2>
      <p className={styles.formSubtitle}>{roleConfig.signupSubtitle}</p>

      {error && (
        <div className={styles.errorBox}>
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>First Name</label>
            <input
              type="text"
              name="firstName"
              className={styles.formInput}
              placeholder="Juan"
              value={formData.firstName}
              onChange={handleInputChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Last Name</label>
            <input
              type="text"
              name="lastName"
              className={styles.formInput}
              placeholder="Dela Cruz"
              value={formData.lastName}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{roleConfig.emailLabel}</label>
            <input
              type="email"
              name="email"
              className={styles.formInput}
              placeholder={roleConfig.emailPlaceholder}
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{roleConfig.idLabel}</label>
            <input
              type="text"
              name={roleConfig.idName}
              className={styles.formInput}
              placeholder={roleConfig.idPlaceholder}
              value={formData[roleConfig.idName]}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{roleConfig.groupLabel}</label>
          <select
            name={roleConfig.groupName}
            className={styles.formSelect}
            value={formData[roleConfig.groupName]}
            onChange={handleInputChange}
          >
            {roleConfig.groupOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {roleConfig.id !== "student" && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              {roleConfig.accessCodeLabel}
            </label>
            <input
              type="password"
              name="accessCode"
              className={styles.formInput}
              placeholder={roleConfig.accessCodePlaceholder}
              value={formData.accessCode}
              onChange={handleInputChange}
            />
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Password</label>
          <div className={styles.formInputWrap}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              className={styles.formInput}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleInputChange}
            />
            <button
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowPassword(!showPassword)}
            >
              <i className={`fas fa-eye${showPassword ? "-slash" : ""}`}></i>
            </button>
          </div>
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

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Confirm Password</label>
          <div className={styles.formInputWrap}>
            <input
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              className={styles.formInput}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleInputChange}
            />
            <button
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowConfirm(!showConfirm)}
            >
              <i className={`fas fa-eye${showConfirm ? "-slash" : ""}`}></i>
            </button>
          </div>
        </div>

        <div className={styles.termsRow}>
          <input
            type="checkbox"
            id="terms"
            name="termsAccepted"
            checked={formData.termsAccepted}
            onChange={handleInputChange}
          />
          <label htmlFor="terms">
            I agree to the{" "}
            <a href="#" onClick={(e) => e.preventDefault()}>
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" onClick={(e) => e.preventDefault()}>
              Privacy Policy
            </a>
          </label>
        </div>

        <button type="submit" className={styles.btnGold} disabled={submitting}>
          {submitting
            ? "Creating account..."
            : `Create ${roleConfig.shortTitle} Account`}
        </button>
      </form>

      <p className={styles.authSwitch}>
        Already have an account?{" "}
        <button type="button" className={styles.formLink} onClick={onSwitch}>
          Sign in
        </button>
      </p>
    </div>
  );
};

export default SignupForm;
