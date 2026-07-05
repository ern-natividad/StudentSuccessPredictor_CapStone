// REPLACES: src/features/admin/pages/AuditLogsPage.jsx
//
// Fetches real audit trail data from GET /api/audit-logs when
// VITE_USE_BACKEND_AUTH=true. Falls back to the original static sample data
// otherwise (or if the backend call fails), so the page never breaks and
// looks the same as before out of the box. Table markup/classes unchanged;
// only two columns (Module, IP Address) were added since live entries carry
// that data.
import { useEffect, useState } from "react";
import styles from "../../../styles/Dashboard.module.css";
import commonStyles from "../../../styles/Common.module.css";
import { api, isBackendAuthEnabled } from "../../../services/api";

const FALLBACK_LOGS = [
  {
    created_at: "2024-01-15T14:30:00Z",
    username: "Admin User",
    action: "Model Update",
    module: "System Operations",
    description: "Uploaded new model v1.3.0",
  },
  {
    created_at: "2024-01-15T10:15:00Z",
    username: "Staff User",
    action: "Student Alert",
    module: "System Operations",
    description: "Acknowledged alert for Juan Dela Cruz",
  },
  {
    created_at: "2024-01-14T16:45:00Z",
    username: "Admin User",
    action: "Report Generated",
    module: "System Operations",
    description: "Weekly risk assessment report",
  },
  {
    created_at: "2024-01-14T09:30:00Z",
    username: "Staff User",
    action: "Screening",
    module: "System Operations",
    description: "Completed screening for Maria Santos",
  },
  {
    created_at: "2024-01-13T15:20:00Z",
    username: "Admin User",
    action: "Settings Update",
    module: "System Operations",
    description: "Updated alert thresholds",
  },
];

const AuditLogsPage = () => {
  const [logs, setLogs] = useState(FALLBACK_LOGS);
  const [source, setSource] = useState("demo");

  useEffect(() => {
    if (!isBackendAuthEnabled()) return;

    let cancelled = false;
    api
      .getAuditLogs(200)
      .then((res) => {
        if (!cancelled && Array.isArray(res.logs)) {
          setLogs(res.logs);
          setSource("live");
        }
      })
      .catch(() => {
        // Keep the demo data if the audit backend is unreachable or the
        // signed-in user isn't an admin.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className={styles.pageTitle}>Audit Logs</h1>
      <p className={styles.pageDesc}>
        A chronological record of all system actions performed by administrators and staff.
        {source === "demo" ? " (Showing sample data.)" : ""}
      </p>
      <div className={styles.card}>
        <table className={commonStyles.table}>
          <thead className={commonStyles.tableHead}>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Module</th>
              <th>Details</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, idx) => (
              <tr key={log.id || idx} className={commonStyles.tableRow}>
                <td>{new Date(log.created_at || log.timestamp).toLocaleString()}</td>
                <td>{log.username || log.user}</td>
                <td>{log.action}</td>
                <td>{log.module || "—"}</td>
                <td>{log.description || log.details}</td>
                <td>{log.ip_address || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogsPage;
