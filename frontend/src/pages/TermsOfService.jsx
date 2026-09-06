import { Link, useLocation } from "react-router-dom";
import styles from "../styles/Legal.module.css";
import { buildLegalNavState, getAuthReturnPath } from "../utils/legalNav";
import engineeringLogo from "../assets/EngineeringLogo.jpg";

const TermsOfService = () => {
  const location = useLocation();
  const authReturnPath = getAuthReturnPath(location);
  const legalState = buildLegalNavState(location);

  return (
    <div className={styles.legalPage}>
      <div className={styles.legalShell}>
        <header className={styles.legalHeader}>
          <div className={styles.brandRow}>
            <img
              src={engineeringLogo}
              alt="WMSU College of Engineering and Technology"
              className={styles.brandLogo}
            />
            <div>
              <p className={styles.brandEyebrow}>WMSU HAWKS</p>
              <p className={styles.brandTitle}>Student Success Predictor</p>
            </div>
          </div>
          <Link to={authReturnPath} className={styles.backLink}>
            <i className="fas fa-arrow-left" aria-hidden="true"></i>
            Back to Sign In
          </Link>
        </header>

        <article className={styles.legalCard}>
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
              <li>
                Attempt to access data belonging to other users without
                permission
              </li>
              <li>Interfere with the security or operation of the platform</li>
              <li>
                Use predictive outputs as the sole basis for academic decisions
              </li>
            </ul>
          </section>

          <section>
            <h2>4. Academic Data &amp; Predictions</h2>
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
            <Link to="/privacy-policy" state={legalState}>
              Privacy Policy
            </Link>
            <Link to={authReturnPath}>Return to Sign In</Link>
          </div>
        </article>
      </div>
    </div>
  );
};

export default TermsOfService;
