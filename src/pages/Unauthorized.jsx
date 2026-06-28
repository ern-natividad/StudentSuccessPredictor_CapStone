import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import styles from "../styles/Modules.module.css";

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const destination = user.role === "admin" ? "/admin" : user.role === "staff" ? "/staff" : "/dashboard";

  return (
    <div className={styles.moduleLayout}>
      <div className={styles.moduleSidebar} />
      <main className={styles.moduleContent}>
        <div className={styles.moduleHeader}>
          <div>
            <div className={styles.breadcrumb}>Access Denied</div>
            <h1 className={styles.moduleTitle}>Unauthorized</h1>
            <p className={styles.moduleDescription}>
              You do not have permission to view this page. Please return to your dashboard or contact your administrator if you believe this is an error.
            </p>
          </div>
        </div>
        <div className={styles.moduleCard}>
          <div className={styles.moduleTitleSmall}>Access Denied (403)</div>
          <div className={styles.moduleSubtitle}>
            Only staff and admin roles are authorized to access these advanced academic modules.
          </div>
          <div className={styles.buttonGroup}>
            <button className={styles.primaryButton} onClick={() => navigate(destination)}>
              Return to Dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UnauthorizedPage;
