import { Link } from "react-router-dom";
import styles from "../styles/Legal.module.css";

const PrivacyPolicy = () => {
  return (
    <div className={styles.legalPage}>
      <div className={styles.legalCard}>
        <Link to="/auth" className={styles.backLink}>
          <i className="fas fa-arrow-left"></i> Back to sign in
        </Link>

        <h1>Privacy Policy</h1>
        <p className={styles.updated}>Last updated: July 3, 2026</p>

        <section>
          <h2>1. Information We Collect</h2>
          <p>
            When you register or use the WMSU HAWKS platform, we may collect:
          </p>
          <ul>
            <li>Name, email address, and university ID number</li>
            <li>Role, department or year level, and login activity</li>
            <li>Academic performance data used for prediction and advising</li>
            <li>Password reset verification codes (temporary, not stored long-term)</li>
          </ul>
        </section>

        <section>
          <h2>2. How We Use Your Information</h2>
          <p>Your data is used to:</p>
          <ul>
            <li>Authenticate access and manage your account</li>
            <li>Generate student success predictions and early alerts</li>
            <li>Support academic advising and intervention workflows</li>
            <li>Maintain audit logs for system security and compliance</li>
          </ul>
        </section>

        <section>
          <h2>3. Data Sharing</h2>
          <p>
            Academic data is shared only with authorized WMSU personnel who
            require access for their official duties. We do not sell personal
            information to third parties.
          </p>
        </section>

        <section>
          <h2>4. Data Security</h2>
          <p>
            We apply role-based access controls, session management, and secure
            password reset flows. While we take reasonable measures to protect
            your information, no system can guarantee absolute security.
          </p>
        </section>

        <section>
          <h2>5. Data Retention</h2>
          <p>
            Account and academic records are retained in accordance with WMSU
            policies and applicable education regulations. Temporary verification
            codes expire automatically after a short period.
          </p>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <p>
            You may request correction of inaccurate personal data or report
            privacy concerns through your department administrator or the
            system office.
          </p>
        </section>

        <section>
          <h2>7. Contact</h2>
          <p>
            Privacy inquiries may be directed to{" "}
            <a href="mailto:admin@wmsu.edu.ph">admin@wmsu.edu.ph</a>.
          </p>
        </section>

        <div className={styles.footerLinks}>
          <Link to="/terms-of-service">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
