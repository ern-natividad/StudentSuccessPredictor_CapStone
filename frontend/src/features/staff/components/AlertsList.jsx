import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useDashboard } from "../../../hooks/useDashboard";
import { useToast } from "../../../components/Common/Toast";
import styles from "../../../styles/Dashboard.module.css";
import commonStyles from "../../../styles/Common.module.css";

const AlertsList = () => {
  const { directoryLoading: contextLoading, directoryError: contextError } = useDashboard();
  const toast = useToast();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState(new Set());

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from student_info and join basic user details from public.users
      const { data: studentRecords, error: fetchError } = await supabase
        .from("student_info")
        .select(`
          id,
          student_id,
          department,
          section,
          risk_level,
          created_at,
          users (
            id,
            email,
            full_name,
            account_locked
          )
        `)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      const generatedAlerts = (studentRecords || [])
        .filter((student) => student.risk_level || student.users?.account_locked)
        .map((student) => {
          const userObj = Array.isArray(student.users) ? student.users[0] : student.users;
          const studentIdStr = student.student_id ? ` (${student.student_id})` : "";
          const displayName = (userObj?.full_name || userObj?.email || "Student Account") + studentIdStr;

          // Normalize severity from student_info.risk_level
          let severity = "low";
          const rawRisk = String(student.risk_level || "").toLowerCase();

          if (userObj?.account_locked || rawRisk === "critical") {
            severity = "critical";
          } else if (rawRisk === "high") {
            severity = "high";
          } else if (rawRisk === "medium") {
            severity = "medium";
          }

          let description = `Student flagged with ${student.risk_level || "low"} risk level.`;
          if (userObj?.account_locked) {
            description = "Account is locked due to security or administrative policy.";
          }

          const formattedTime = student.created_at
            ? new Date(student.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Recently";

          return {
            id: student.id,
            name: displayName,
            desc: description,
            sev: severity,
            time: formattedTime,
          };
        });

      setAlerts(generatedAlerts);
    } catch (err) {
      console.error("Error fetching alerts from student_info:", err);
      const message = err.message || "Failed to load account alerts.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Listen for real-time changes directly on student_info
    const subscription = supabase
      .channel("public:student_info_alerts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "student_info" },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleAcknowledge = (id) => {
    setAcknowledgedIds((prev) => new Set(prev).add(id));
    toast.success("Alert acknowledged.");
  };

  const getAlertIcon = (severity) => {
    const icons = {
      critical: "fas fa-exclamation-triangle",
      high: "fas fa-bell",
      medium: "fas fa-thumbtack",
      low: "fas fa-info-circle",
    };
    return icons[severity] || "fas fa-info-circle";
  };

  const activeAlerts = alerts.filter((a) => !acknowledgedIds.has(a.id));
  const isLoading = loading || contextLoading;
  const displayError = error || contextError;

  return (
    <div>
      <h1 className={styles.pageTitle}>Early Alerts</h1>

      {displayError && <div className={styles.card}>{displayError}</div>}

      <div className={styles.card} style={{ marginBottom: "20px" }}>
        <div className={styles.cardTitle}>Alert Summary</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "12px",
          }}
        >
          <div className={commonStyles.statBlock}>
            <div className={commonStyles.statValue}>
              {activeAlerts.filter((a) => a.sev === "low").length}
            </div>
            <div className={commonStyles.statLabel}>Low</div>
          </div>
          <div className={commonStyles.statBlock}>
            <div className={commonStyles.statValue}>
              {activeAlerts.filter((a) => a.sev === "medium").length}
            </div>
            <div className={commonStyles.statLabel}>Medium</div>
          </div>
          <div className={commonStyles.statBlock}>
            <div className={commonStyles.statValue}>
              {activeAlerts.filter((a) => a.sev === "high").length}
            </div>
            <div className={commonStyles.statLabel}>High</div>
          </div>
          <div className={commonStyles.statBlock}>
            <div className={commonStyles.statValue}>
              {activeAlerts.filter((a) => a.sev === "critical").length}
            </div>
            <div className={commonStyles.statLabel}>Critical</div>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {activeAlerts.map((alert) => (
            <div key={alert.id} className={styles.alertItem}>
              <div className={`${styles.alertIcon} ${styles[alert.sev]}`}>
                <i className={getAlertIcon(alert.sev)}></i>
              </div>
              <div style={{ flex: 1 }}>
                <div className={styles.alertName}>{alert.name}</div>
                <div className={styles.alertDesc}>{alert.desc}</div>
                <div className={styles.alertTime}>{alert.time}</div>
              </div>
              <div className={styles.alertMeta}>
                <span
                  className={`${commonStyles.riskBadge} ${
                    commonStyles["riskBadge." + alert.sev]
                  }`}
                >
                  {alert.sev}
                </span>
                <br />
                <button
                  className={commonStyles.btnSmallOutline}
                  onClick={() => handleAcknowledge(alert.id)}
                >
                  Acknowledge
                </button>
              </div>
            </div>
          ))}

          {!isLoading && activeAlerts.length === 0 && (
            <div className={commonStyles.emptyState}>No account alerts found.</div>
          )}

          {isLoading && (
            <div className={commonStyles.emptyState}>Loading alerts…</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsList;