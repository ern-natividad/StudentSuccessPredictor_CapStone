import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getDashboardPath } from "../../utils/authUtils";
import styles from "../../styles/Modules.module.css";

const ModuleShell = ({ title, description, activeKey, menuItems = [], children }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBack = () => {
    navigate(getDashboardPath(user.role));
  };

  return (
    <div className={styles.moduleLayout}>
      <aside className={styles.moduleSidebar}>
        <div className={styles.sidebarBrand}>HawkPredict Modules</div>
        <div className={styles.moduleMenu}>
          {menuItems.map((item) => (
            <button
              key={item.key}
              className={`${styles.moduleNavButton} ${
                activeKey === item.key ? styles.activeButton : ""
              }`}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </aside>

      <main className={styles.moduleContent}>
        <div className={styles.moduleHeader}>
          <div>
            <div className={styles.breadcrumb}>Admin / {title}</div>
            <h1 className={styles.moduleTitle}>{title}</h1>
            <p className={styles.moduleDescription}>{description}</p>
          </div>
          <button className={styles.primaryButton} onClick={handleBack}>
            Back to Dashboard
          </button>
        </div>

        {children}
      </main>
    </div>
  );
};

export default ModuleShell;
