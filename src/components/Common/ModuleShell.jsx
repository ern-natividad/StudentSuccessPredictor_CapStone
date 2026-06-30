import styles from "../../styles/Modules.module.css";

const ModuleShell = ({ title, description, children }) => {
  return (
    <div className={styles.moduleLayout}>
      <main className={styles.moduleContent}>
        <div className={styles.moduleHeader}>
          <div>
            <div className={styles.breadcrumb}>Admin / {title}</div>
            <h1 className={styles.moduleTitle}>{title}</h1>
            <p className={styles.moduleDescription}>{description}</p>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
};

export default ModuleShell;
