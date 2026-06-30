import styles from "../../styles/Dashboard.module.css";
import commonStyles from "../../styles/Common.module.css";

const AUDIT_LOGS = [
  {
    timestamp: "2024-01-15 14:30",
    user: "Admin User",
    action: "Model Update",
    details: "Uploaded new model v1.3.0",
  },
  {
    timestamp: "2024-01-15 10:15",
    user: "Staff User",
    action: "Student Alert",
    details: "Acknowledged alert for Juan Dela Cruz",
  },
  {
    timestamp: "2024-01-14 16:45",
    user: "Admin User",
    action: "Report Generated",
    details: "Weekly risk assessment report",
  },
  {
    timestamp: "2024-01-14 09:30",
    user: "Staff User",
    action: "Screening",
    details: "Completed screening for Maria Santos",
  },
  {
    timestamp: "2024-01-13 15:20",
    user: "Admin User",
    action: "Settings Update",
    details: "Updated alert thresholds",
  },
];

const AuditLogsPage = () => {
  return (
    <div>
      <h1 className={styles.pageTitle}>Audit Logs</h1>
      <p className={styles.pageDesc}>
        A chronological record of all system actions performed by administrators and staff.
      </p>
      <div className={styles.card}>
        <table className={commonStyles.table}>
          <thead className={commonStyles.tableHead}>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {AUDIT_LOGS.map((log, idx) => (
              <tr key={idx} className={commonStyles.tableRow}>
                <td>{log.timestamp}</td>
                <td>{log.user}</td>
                <td>{log.action}</td>
                <td>{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogsPage;
