import { useState, useEffect, useCallback, useMemo } from "react";
import { useRoleScopedStudents } from "../../../hooks/useRoleScopedStudents";
import { fetchEarlyAlerts, scopeEarlyAlerts } from "../../../utils/earlyAlertsUtils";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../hooks/useAuth";

export const useEarlyAlerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAdmin, visibleStudentIds, visibleUserIds } = useRoleScopedStudents();

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const generatedAlerts = await fetchEarlyAlerts();
      setAlerts(generatedAlerts);
    } catch (err) {
      console.error("Error fetching alerts from student_info:", err);
      setError(err.message || "Failed to load account alerts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    const subscription = supabase
      .channel("public:student_info_alerts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "student_info" },
        () => {
          fetchAlerts();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchAlerts]);

  const scopedAlerts = useMemo(() => {
    if (isAdmin) return alerts;

    return alerts.filter((alert) => {
      const studentId = String(alert.studentId || "").trim().toLowerCase();
      const userId = String(alert.userId || "").trim().toLowerCase();
      return (
        (studentId && visibleStudentIds.has(studentId)) ||
        (userId && visibleUserIds.has(userId))
      );
    });
  }, [alerts, isAdmin, visibleStudentIds, visibleUserIds]);

  return { alerts: scopedAlerts, loading, error, refetch: fetchAlerts };
};
