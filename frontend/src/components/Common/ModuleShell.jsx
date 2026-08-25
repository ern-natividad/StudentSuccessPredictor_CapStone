import React from "react";
import dashboardStyles from "../../styles/Dashboard.module.css";
import moduleStyles from "../../styles/Modules.module.css";

const ModuleShell = ({
  title,
  description,
  children,
  layoutShiftClass = "",
  onBack,
}) => {
  return (
    <div className={`${moduleStyles.moduleLayout} ${layoutShiftClass}`}>
      <div className={dashboardStyles.pageContainer}>
        <div className={dashboardStyles.pageShell}>
          <div className={dashboardStyles.pageHeaderCard}>
            <div className={moduleStyles.moduleHeaderRow}>
              {onBack ? (
                <button
                  type="button"
                  className={moduleStyles.moduleBackButton}
                  onClick={onBack}
                  title="Back"
                  aria-label="Back"
                >
                  <i className="fas fa-arrow-left" aria-hidden="true" />
                </button>
              ) : null}
              <div className={moduleStyles.moduleHeaderText}>
                <h1 className={dashboardStyles.pageTitle}>{title}</h1>
                {description ? (
                  <p className={dashboardStyles.pageSubtitle}>{description}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className={moduleStyles.moduleContent}>{children}</div>
        </div>
      </div>
    </div>
  );
};

export default ModuleShell;
