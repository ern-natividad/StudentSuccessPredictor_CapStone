import { useEffect, useState } from "react";
import styles from "../../../styles/Dashboard.module.css";
import commonStyles from "../../../styles/Common.module.css";
import { api, isBackendAuthEnabled } from "../../../services/api";

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!isBackendAuthEnabled()) return;

    let cancelled = false;
    api
      .getAuditLogs(200)
      .then((res) => {
        if (!cancelled && Array.isArray(res.logs)) {
          setLogs(res.logs);
        }
      })
      .catch(() => {
        setLogs([]);
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
      </p>
      <div className={styles.card}>
        {logs.length === 0 ? (
          <div className={commonStyles.emptyState}>No audit logs available yet.</div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;
