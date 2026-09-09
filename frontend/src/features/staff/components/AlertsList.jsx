import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDashboard } from "../../../hooks/useDashboard";
import { useRoleScopedStudents } from "../../../hooks/useRoleScopedStudents";
import { useToast } from "../../../components/Common/Toast";
import { useEarlyAlerts } from "../hooks/useEarlyAlerts";
import { api, isBackendAuthEnabled } from "../../../services/api";
import styles from "../../../styles/Dashboard.module.css";
import commonStyles from "../../../styles/Common.module.css";

const STATUS_LABELS = {
  pending_admin: "Pending Admin",
  acknowledged: "Acknowledged",
  monitoring: "Monitoring",
  improving: "Improving",
  resolved: "Resolved",
};

const PROGRESS_OPTIONS = [
  { value: "monitoring", label: "Monitoring" },
  { value: "improving", label: "Improving" },
  { value: "resolved", label: "Resolved" },
];

const formatEventTime = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AlertsList = () => {
  const {
    directoryLoading: contextLoading,
    directoryError: contextError,
    refreshAdminNotifications,
  } = useDashboard();
  const { isAdmin, visibleStudentIds, visibleUserIds } = useRoleScopedStudents();
  const toast = useToast();

  const { alerts, loading, error, refetch } = useEarlyAlerts();
  const [interventions, setInterventions] = useState([]);
  const [interventionsLoading, setInterventionsLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [progressDrafts, setProgressDrafts] = useState({});

  const loadInterventions = useCallback(async () => {
    if (!isBackendAuthEnabled()) {
      setInterventions([]);
      return;
    }

    try {
      setInterventionsLoading(true);
      const result = await api.getAlertInterventions(true);
      setInterventions(result.interventions || []);
    } catch (requestError) {
      console.error(requestError);
      toast.error(requestError.message || "Unable to load intervention cases.");
    } finally {
      setInterventionsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadInterventions();
  }, [loadInterventions]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error, toast]);

  const interventionByUserId = useMemo(() => {
    const map = new Map();
    interventions.forEach((item) => {
      if (item.student_user_id) {
        map.set(String(item.student_user_id), item);
      }
    });
    return map;
  }, [interventions]);

  const mergedAlerts = useMemo(() => {
    return alerts.map((alert) => {
      const intervention = interventionByUserId.get(String(alert.userId || ""));
      return {
        ...alert,
        intervention: intervention || null,
      };
    });
  }, [alerts, interventionByUserId]);

  const activeAlerts = useMemo(
    () =>
      mergedAlerts.filter(
        (alert) => alert.intervention?.status !== "resolved",
      ),
    [mergedAlerts],
  );

  const resolvedCases = useMemo(() => {
    const rows = interventions.filter((item) => item.status === "resolved");
    if (isAdmin) return rows;

    return rows.filter((item) => {
      const studentId = String(item.student_id || "").trim().toLowerCase();
      const userId = String(item.student_user_id || "").trim().toLowerCase();
      return (
        (studentId && visibleStudentIds.has(studentId)) ||
        (userId && visibleUserIds.has(userId))
      );
    });
  }, [interventions, isAdmin, visibleStudentIds, visibleUserIds]);

  const getAlertIcon = (severity) => {
    const icons = {
      critical: "fas fa-exclamation-triangle",
      high: "fas fa-bell",
      medium: "fas fa-thumbtack",
      low: "fas fa-info-circle",
    };
    return icons[severity] || "fas fa-info-circle";
  };

  const getDraft = (intervention) => {
    if (!intervention?.id) {
      return { status: "monitoring", note: "" };
    }

    if (progressDrafts[intervention.id]) {
      return progressDrafts[intervention.id];
    }

    return {
      status:
        intervention.status === "acknowledged" ||
        intervention.status === "pending_admin"
          ? "monitoring"
          : PROGRESS_OPTIONS.some((option) => option.value === intervention.status)
            ? intervention.status
            : "monitoring",
      note: "",
    };
  };

  const setDraft = (intervention, patch) => {
    if (!intervention?.id) return;
    setProgressDrafts((prev) => ({
      ...prev,
      [intervention.id]: {
        ...getDraft(intervention),
        ...(prev[intervention.id] || {}),
        ...patch,
      },
    }));
  };

  const handleEscalate = async (alert) => {
    if (!alert.userId) {
      toast.error("Missing student user id for this alert.");
      return;
    }

    try {
      setBusyId(alert.id);
      const result = await api.escalateAlert({
        studentUserId: alert.userId,
        studentInfoId: alert.id,
        studentId: alert.studentId || "",
        studentName: alert.name,
        riskLevel: alert.riskLevel,
        severity: alert.sev,
      });
      if ((result?.notifiedAdminCount ?? 0) > 0) {
        toast.success("Escalated to Admin. They will be notified.");
      } else {
        toast.error(
          "Case escalated, but no admin accounts were found to notify.",
        );
      }
      await loadInterventions();
      if (typeof refreshAdminNotifications === "function") {
        await refreshAdminNotifications();
      }
    } catch (requestError) {
      toast.error(requestError.message || "Unable to escalate alert.");
    } finally {
      setBusyId("");
    }
  };

  const handleAcknowledge = async (intervention) => {
    try {
      setBusyId(intervention.id);
      await api.acknowledgeAlertIntervention(intervention.id);
      toast.success("Student risk case acknowledged. You can track progress now.");
      await loadInterventions();
      if (typeof refreshAdminNotifications === "function") {
        await refreshAdminNotifications();
      }
    } catch (requestError) {
      toast.error(requestError.message || "Unable to acknowledge case.");
    } finally {
      setBusyId("");
    }
  };

  const handleCancelCase = async (intervention) => {
    try {
      setBusyId(intervention.id);
      await api.cancelAlertIntervention(intervention.id);
      toast.success("Case closed. You can open it again anytime.");
      await loadInterventions();
      if (typeof refreshAdminNotifications === "function") {
        await refreshAdminNotifications();
      }
      await refetch();
    } catch (requestError) {
      toast.error(requestError.message || "Unable to cancel case.");
    } finally {
      setBusyId("");
    }
  };

  const handleReopenCase = async (intervention) => {
    try {
      setBusyId(intervention.id);
      await api.reopenAlertIntervention(intervention.id, {
        note: "Case reopened from Resolved Cases.",
      });
      toast.success("Case reopened and moved back to Early Alerts.");
      await loadInterventions();
      await refetch();
    } catch (requestError) {
      toast.error(requestError.message || "Unable to reopen case.");
    } finally {
      setBusyId("");
    }
  };

  const handleSaveProgress = async (intervention) => {
    const draft = getDraft(intervention);
    try {
      setBusyId(intervention.id);
      await api.updateAlertInterventionProgress(intervention.id, {
        status: draft.status,
        note: draft.note,
      });
      toast.success("Progress updated.");
      setProgressDrafts((prev) => {
        const next = { ...prev };
        delete next[intervention.id];
        return next;
      });
      await loadInterventions();
      await refetch();
    } catch (requestError) {
      toast.error(requestError.message || "Unable to update progress.");
    } finally {
      setBusyId("");
    }
  };

  const handleCancelProgress = async (intervention) => {
    try {
      setBusyId(intervention.id);
      // Go back to waiting for acknowledgement (Pending Admin).
      await api.revertAlertInterventionToAcknowledged(intervention.id, {
        note: "Returned to pending admin acknowledgement.",
      });
      toast.success("Case returned to waiting for acknowledgement.");
      setProgressDrafts((prev) => {
        const next = { ...prev };
        delete next[intervention.id];
        return next;
      });
      await loadInterventions();
      await refetch();
    } catch (requestError) {
      toast.error(requestError.message || "Unable to cancel progress.");
    } finally {
      setBusyId("");
    }
  };

  const isLoading = loading || contextLoading || interventionsLoading;
  const displayError = error || contextError;

  return (
    <div className={styles.pageShell}>
      <div className={styles.pageHeaderCard}>
        <div>
          <h1 className={styles.pageTitle}>
            {isAdmin ? "Early Alerts" : "Early Alerts — Assigned Students"}
          </h1>
          <p className={styles.pageSubtitle}>
            {isAdmin
              ? "Review escalations from advisers, acknowledge at-risk students, and track intervention progress."
              : "Escalate assigned student risk flags to Admin, then track progress after acknowledgement."}
          </p>
        </div>
      </div>

      {displayError && <div className={styles.card}>{displayError}</div>}

      <div className={styles.card}>
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
          {activeAlerts.map((alert) => {
            const intervention = alert.intervention;
            const status = intervention?.status;
            const draft = intervention ? getDraft(intervention) : null;
            const showStaffEscalate = !isAdmin && (!status || status === "resolved");
            const showAdminOpenCase = isAdmin && !status;
            const showAdminAcknowledge = isAdmin && status === "pending_admin";
            const showCancelPending = status === "pending_admin";
            const showProgress =
              Boolean(status) &&
              status !== "pending_admin" &&
              status !== "resolved";
            const showCancelProgress =
              status === "acknowledged" ||
              status === "monitoring" ||
              status === "improving";
            const isBusy =
              busyId === alert.id || busyId === intervention?.id;

            return (
              <div key={alert.id} className={styles.alertItem}>
                <div className={`${styles.alertIcon} ${styles[alert.sev]}`}>
                  <i className={getAlertIcon(alert.sev)}></i>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={styles.alertName}>{alert.name}</div>
                  <div className={styles.alertDesc}>{alert.desc}</div>
                  <div className={styles.alertTime}>{alert.time}</div>

                  {status ? (
                    <div style={{ marginTop: "0.55rem" }}>
                      <span
                        className={commonStyles.riskBadge}
                        style={{ marginRight: "0.5rem" }}
                      >
                        {STATUS_LABELS[status] || status}
                      </span>
                      {intervention?.latest_note ? (
                        <span className={styles.alertDesc}>
                          Latest note: {intervention.latest_note}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {showProgress ? (
                    <div
                      style={{
                        marginTop: "0.75rem",
                        display: "grid",
                        gap: "0.5rem",
                        maxWidth: "520px",
                      }}
                    >
                      <label
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        Track progress
                        <select
                          value={draft.status}
                          disabled={isBusy}
                          onChange={(event) =>
                            setDraft(intervention, {
                              status: event.target.value,
                            })
                          }
                          style={{
                            display: "block",
                            width: "100%",
                            marginTop: "0.3rem",
                            padding: "0.45rem 0.6rem",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                          }}
                        >
                          {PROGRESS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        Progress note (optional)
                        <textarea
                          value={draft.note}
                          disabled={isBusy}
                          rows={2}
                          placeholder="e.g. Met with student; tutoring scheduled"
                          onChange={(event) =>
                            setDraft(intervention, {
                              note: event.target.value,
                            })
                          }
                          style={{
                            display: "block",
                            width: "100%",
                            marginTop: "0.3rem",
                            padding: "0.45rem 0.6rem",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            resize: "vertical",
                          }}
                        />
                      </label>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.5rem",
                          alignItems: "center",
                        }}
                      >
                        <button
                          type="button"
                          className={styles.alertActionBtn}
                          disabled={isBusy}
                          onClick={() => handleSaveProgress(intervention)}
                        >
                          {isBusy ? "Saving…" : "Save progress"}
                        </button>
                        {showCancelProgress ? (
                          <button
                            type="button"
                            className={styles.alertActionBtnSecondary}
                            disabled={isBusy}
                            onClick={() => handleCancelProgress(intervention)}
                            title="Return to waiting for acknowledgement"
                          >
                            {isBusy ? "Cancelling…" : "Cancel"}
                          </button>
                        ) : null}
                      </div>

                      {intervention.events?.length ? (
                        <div style={{ marginTop: "0.35rem" }}>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              color: "#64748b",
                              marginBottom: "0.25rem",
                            }}
                          >
                            Recent updates
                          </div>
                          {intervention.events.slice(0, 4).map((event) => (
                            <div
                              key={event.id}
                              className={styles.alertDesc}
                              style={{ marginBottom: "0.2rem" }}
                            >
                              {formatEventTime(event.created_at)} —{" "}
                              {STATUS_LABELS[event.status] ||
                                event.event_type}
                              {event.note ? `: ${event.note}` : ""}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {status === "pending_admin" && !isAdmin ? (
                    <div
                      className={styles.alertDesc}
                      style={{ marginTop: "0.5rem" }}
                    >
                      Waiting for Admin acknowledgement.
                    </div>
                  ) : null}
                </div>

                <div className={styles.alertMeta}>
                  <span
                    className={`${commonStyles.riskBadge} ${
                      commonStyles["riskBadge." + alert.sev]
                    }`}
                  >
                    {alert.riskLevel || alert.sev}
                  </span>
                  <br />
                  {showStaffEscalate ? (
                    <button
                      type="button"
                      className={styles.alertActionBtn}
                      disabled={isBusy}
                      onClick={() => handleEscalate(alert)}
                    >
                      {isBusy ? "Sending…" : "Escalate to Admin"}
                    </button>
                  ) : null}
                  {showAdminOpenCase ? (
                    <button
                      type="button"
                      className={styles.alertActionBtnSecondary}
                      disabled={isBusy}
                      onClick={() => handleEscalate(alert)}
                    >
                      {isBusy ? "Saving…" : "Open case"}
                    </button>
                  ) : null}
                  {showAdminAcknowledge ? (
                    <button
                      type="button"
                      className={styles.alertActionBtn}
                      disabled={isBusy}
                      onClick={() => handleAcknowledge(intervention)}
                    >
                      {isBusy ? "Saving…" : "Acknowledge"}
                    </button>
                  ) : null}
                  {showCancelPending ? (
                    <button
                      type="button"
                      className={styles.alertActionBtnSecondary}
                      disabled={isBusy}
                      onClick={() => handleCancelCase(intervention)}
                      title="Cancel this pending case"
                    >
                      {isBusy ? "Closing…" : "Cancel"}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}

          {!isLoading && activeAlerts.length === 0 && (
            <div className={commonStyles.emptyState}>
              {isAdmin
                ? "No account alerts found."
                : "No alerts found for your assigned students."}
            </div>
          )}

          {isLoading && (
            <div className={commonStyles.emptyState}>Loading alerts…</div>
          )}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Resolved Cases</div>
        <p className={styles.pageSubtitle} style={{ marginTop: 0 }}>
          Accidentally resolved a case? Reopen it here to continue tracking.
        </p>

        {resolvedCases.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Risk</th>
                  <th>Last note</th>
                  <th>Resolved</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {resolvedCases.map((item) => {
                  const isBusy = busyId === item.id;
                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {item.student_name || "Student"}
                        </div>
                        <div className={styles.alertDesc}>
                          {item.student_id || item.student_user_id}
                        </div>
                      </td>
                      <td>{item.risk_level || item.severity || "—"}</td>
                      <td>{item.latest_note || "—"}</td>
                      <td>{formatEventTime(item.updated_at)}</td>
                      <td>
                        <button
                          type="button"
                          className={styles.alertActionBtn}
                          disabled={isBusy}
                          onClick={() => handleReopenCase(item)}
                        >
                          {isBusy ? "Opening…" : "Reopen case"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={commonStyles.emptyState}>
            {isLoading ? "Loading resolved cases…" : "No resolved cases yet."}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsList;
