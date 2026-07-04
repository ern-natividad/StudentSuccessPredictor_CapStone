import { useEffect, useState } from "react";
import Sidebar from "../Dashboard/Sidebar"; 
import styles from "../../styles/Dashboard.module.css";
import moduleStyles from "../../styles/Modules.module.css";

const ModuleShell = ({ title, description, children, onBack }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    localStorage.getItem("sidebarCollapsed") === "true"
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setSidebarCollapsed(localStorage.getItem("sidebarCollapsed") === "true");
    };

    window.addEventListener("sidebar-toggle", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("sidebar-toggle", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <div className={`${styles.dashboardContainer} ${sidebarCollapsed ? styles.collapsed : ""}`}>
      <Sidebar />

      <div className={styles.mainContent}>
        <div className={moduleStyles.moduleHeader} style={{ marginBottom: "24px" }}>
          <div className={moduleStyles.headerTitleBlock}>
            <div className={moduleStyles.breadcrumbContainer}>
              <div className={moduleStyles.breadcrumb}>Admin / {title}</div>
              {onBack && (
                <button className={moduleStyles.headerBackButton} onClick={onBack}>
                  <i className="fas fa-arrow-left"></i> Back
                </button>
              )}
            </div>
            <h1 className={moduleStyles.moduleTitle} style={{ margin: "8px 0 4px 0" }}>{title}</h1>
            {description && <p className={moduleStyles.moduleDescription}>{description}</p>}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
};

export default ModuleShell;