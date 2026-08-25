import { useEffect, useState, useMemo } from "react";
import styles from "../../../styles/Dashboard.module.css";
import commonStyles from "../../../styles/Common.module.css";
import { api, isBackendAuthEnabled } from "../../../services/api";

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
        if (!cancelled) setLogs([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Filter logs by date range safely
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const logDateStr = log.created_at || log.timestamp;
      if (!logDateStr) return true;

      const logDate = new Date(logDateStr);
      if (isNaN(logDate.getTime())) return true;

      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          start.setHours(0, 0, 0, 0);
          if (logDate < start) return false;
        }
      }

      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          if (logDate > end) return false;
        }
      }

      return true;
    });
  }, [logs, startDate, endDate]);

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className={styles.pageShell}>
      <div className={styles.pageHeaderCard}>
        <div>
          <h1 className={styles.pageTitle}>Audit Logs</h1>
          <p className={styles.pageSubtitle}>
            A chronological record of all system actions performed by administrators and staff.
          </p>
        </div>
      </div>

      <div className={styles.card}>
        {/* Medium-Sized Date Filter Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1.25rem",
            marginBottom: "1.5rem",
            padding: "0.9rem 1.25rem",
            backgroundColor: "#f8fafc",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "0.95rem",
                fontWeight: "700",
                color: "#800000",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Filter Date Range
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <label htmlFor="startDate" style={{ fontSize: "0.875rem", fontWeight: "600", color: "#475569" }}>
                From:
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  padding: "0.5rem 0.85rem",
                  fontSize: "0.9rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  color: "#0f172a",
                  backgroundColor: "#ffffff",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <label htmlFor="endDate" style={{ fontSize: "0.875rem", fontWeight: "600", color: "#475569" }}>
                To:
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  padding: "0.5rem 0.85rem",
                  fontSize: "0.9rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  color: "#0f172a",
                  backgroundColor: "#ffffff",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {(startDate || endDate) && (
            <button
              onClick={handleClearFilters}
              style={{
                fontSize: "0.85rem",
                fontWeight: "600",
                color: "#800000",
                background: "#ffffff",
                border: "1px solid #800000",
                padding: "0.45rem 0.85rem",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#800000";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#ffffff";
                e.currentTarget.style.color = "#800000";
              }}
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Dynamic Empty State or Refined Table */}
        {filteredLogs.length === 0 ? (
          <div className={commonStyles.emptyState}>
            {logs.length === 0
              ? "No audit logs available yet."
              : "No audit logs found matching the selected date range."}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className={commonStyles.table} style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead className={commonStyles.tableHead}>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "0.75rem 0.8rem", textAlign: "left", width: "175px" }}>Timestamp</th>
                  <th style={{ padding: "0.75rem 0.8rem", textAlign: "left", width: "130px" }}>User</th>
                  <th style={{ padding: "0.75rem 0.8rem", textAlign: "left", width: "140px" }}>Action</th>
                  <th style={{ padding: "0.75rem 0.8rem", textAlign: "left", width: "140px" }}>Module</th>
                  <th style={{ padding: "0.75rem 0.8rem", textAlign: "left" }}>Details</th>
                  <th style={{ padding: "0.75rem 0.8rem", textAlign: "left", width: "120px" }}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => (
                  <tr
                    key={log.id || idx}
                    className={commonStyles.tableRow}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "0.7rem 0.8rem", color: "#64748b", fontSize: "0.825rem", whiteSpace: "nowrap" }}>
                      {new Date(log.created_at || log.timestamp).toLocaleString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td style={{ padding: "0.7rem 0.8rem", fontWeight: "600", color: "#1e293b", fontSize: "0.85rem" }}>
                      {log.username || log.user || "System"}
                    </td>
                    <td style={{ padding: "0.7rem 0.8rem" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          backgroundColor: "#f1f5f9",
                          color: "#334155",
                          border: "1px solid #cbd5e1",
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: "0.7rem 0.8rem", color: "#475569", fontSize: "0.85rem" }}>
                      {log.module ? (
                        <span style={{ fontWeight: "500", color: "#0f172a" }}>{log.module}</span>
                      ) : (
                        <span style={{ color: "#cbd5e1" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "0.7rem 0.8rem", color: "#334155", fontSize: "0.85rem", lineHeight: "1.4" }}>
                      {log.description || log.details || "—"}
                    </td>
                    <td style={{ padding: "0.7rem 0.8rem", color: "#64748b", fontFamily: "monospace", fontSize: "0.8rem" }}>
                      {log.ip_address || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;