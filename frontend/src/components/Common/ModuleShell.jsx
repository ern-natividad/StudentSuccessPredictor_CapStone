import React from "react";
import dashboardStyles from "../../styles/Dashboard.module.css";
import moduleStyles from "../../styles/Modules.module.css";

const ModuleShell = ({ title, description, children, layoutShiftClass = "" }) => {
  return (
    <div className={`${moduleStyles.moduleLayout} ${layoutShiftClass}`}>
      <div className={dashboardStyles.pageContainer}>
        <div className={dashboardStyles.pageHeaderSection}>
          <h1 className={dashboardStyles.pageTitle}>{title}</h1>
          {description && <p className={dashboardStyles.pageDesc}>{description}</p>}
        </div>
        <div className={moduleStyles.moduleContent}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default ModuleShell;