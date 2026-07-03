import { Link } from "react-router-dom";
import styles from "../styles/Legal.module.css";

const TermsOfService = () => {
  return (
    <div className={styles.legalPage}>
      <div className={styles.legalCard}>
        <Link to="/auth" className={styles.backLink}>
          <i className="fas fa-arrow-left"></i> Back to sign in
        </Link>

        <h1>Terms of Service</h1>
        <p className={styles.updated}>Last updated: July 3, 2026</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the WMSU HAWKS Student Success Predictor
            platform, you agree to be bound by these Terms of Service. If you
            do not agree, please do not use the system.
          </p>
        </section>

        <section>
          <h2>2. Eligibility</h2>
          <p>
            This platform is intended for students, faculty, staff, and
            administrators of Western Mindanao State University — College of
            Engineering and Technology. You must provide accurate registration
            information and maintain the confidentiality of your account
            credentials.
          </p>
        </section>

        <section>
          <h2>3. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Share your login credentials with unauthorized persons</li>
            <li>Attempt to access data belonging to other users without permission</li>
            <li>Interfere with the security or operation of the platform</li>
            <li>Use predictive outputs as the sole basis for academic decisions</li>
          </ul>
        </section>

        <section>
          <h2>4. Academic Data & Predictions</h2>
          <p>
            Predictive analytics and risk indicators are provided for guidance
            and early intervention purposes only. They do not replace official
            academic records, faculty judgment, or university policy.
          </p>
        </section>

        <section>
          <h2>5. Account Security</h2>
          <p>
            You are responsible for safeguarding your password and notifying
            administrators of any unauthorized access. Password reset requests
            are verified through the registered email or username associated
            with your account.
          </p>
        </section>

        <section>
          <h2>6. Modifications</h2>
          <p>
            WMSU may update these terms as the platform evolves. Continued use
            after changes constitutes acceptance of the revised terms.
          </p>
        </section>

        <section>
          <h2>7. Contact</h2>
          <p>
            For questions about these terms, contact the College of Engineering
            and Technology system administrator at{" "}
            <a href="mailto:admin@wmsu.edu.ph">admin@wmsu.edu.ph</a>.
          </p>
        </section>

        <div className={styles.footerLinks}>
          <Link to="/privacy-policy">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
