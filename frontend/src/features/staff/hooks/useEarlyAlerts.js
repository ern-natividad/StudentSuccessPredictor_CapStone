import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabaseClient";

// Shared alert source for the Early Alerts module and the Dashboard's
// Recent Alerts widget, so both surfaces always reflect the same data.
export const useEarlyAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

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
      setError(err.message || "Failed to load account alerts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    // Keep both the Early Alerts page and the Dashboard widget live-updated.
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

  return { alerts, loading, error, refetch: fetchAlerts };
};
