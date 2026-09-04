import { supabase } from "../lib/supabaseClient";
import { api, isBackendAuthEnabled } from "../services/api";
import { filterStudentsForAdviser } from "./adviserAssignmentUtils";

const normalizeRiskLabel = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "critical") return "Critical";
  if (raw === "high") return "High";
  if (raw === "medium") return "Medium";
  if (raw === "low") return "Low";
  return "";
};

const riskLabelToSeverity = (riskLabel) => {
  const raw = String(riskLabel || "").trim().toLowerCase();
  if (raw === "critical") return "critical";
  if (raw === "high") return "high";
  if (raw === "medium") return "medium";
  return "low";
};

const getUserFromJoin = (users) =>
  Array.isArray(users) ? users[0] : users;

/**
 * Same risk source as Students List:
 * prediction.risk_level → student_info.risk_level → Low
 */
export const fetchEarlyAlerts = async () => {
  const { data: studentRecords, error: fetchError } = await supabase
    .from("student_info")
    .select(`
      id,
      student_id,
      user_id,
      department,
      program,
      section,
      year_level,
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

  const records = studentRecords || [];

  const predictionsByUserId = {};
  if (isBackendAuthEnabled() && records.length > 0) {
    await Promise.all(
      records.map(async (student) => {
        const userObj = getUserFromJoin(student.users);
        const userId = userObj?.id || student.user_id;
        if (!userId) return;

        try {
          const result = await api.getStudentPrediction(userId);
          predictionsByUserId[userId] = result.prediction || null;
        } catch {
          predictionsByUserId[userId] = null;
        }
      }),
    );
  }

  return records
    .map((student) => {
      const userObj = getUserFromJoin(student.users);
      const userId = userObj?.id || student.user_id || "";
      const prediction = predictionsByUserId[userId] || null;

      const predictedRisk = normalizeRiskLabel(prediction?.risk_level);
      const storedRisk = normalizeRiskLabel(student.risk_level);
      const riskLabel = predictedRisk || storedRisk || "Low";

      // Keep student_info in sync with the same risk Students List uses.
      if (
        predictedRisk &&
        predictedRisk !== storedRisk &&
        (student.user_id || userId)
      ) {
        void supabase
          .from("student_info")
          .update({ risk_level: predictedRisk })
          .eq("user_id", student.user_id || userId);
      }

      const accountLocked = Boolean(userObj?.account_locked);
      let severity = riskLabelToSeverity(riskLabel);
      if (accountLocked) severity = "critical";

      const studentIdStr = student.student_id ? ` (${student.student_id})` : "";
      const displayName =
        (userObj?.full_name || userObj?.email || "Student Account") + studentIdStr;

      let description = `Student flagged with ${riskLabel} risk level.`;
      if (accountLocked) {
        description =
          "Account is locked due to security or administrative policy.";
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
        id: student.id || userId || student.student_id,
        studentId: student.student_id || "",
        userId,
        name: displayName,
        desc: description,
        sev: severity,
        riskLevel: riskLabel,
        time: formattedTime,
        accountLocked,
      };
    })
    .filter((alert) => alert.riskLevel || alert.accountLocked);
};

export const scopeEarlyAlerts = ({
  alerts,
  role,
  userId,
  userEmail,
  students = [],
  staffMembers = [],
  getStudentsForStaff,
}) => {
  if (role === "admin") return alerts;

  if (role === "student") {
    const normalizedUserId = String(userId || "").trim().toLowerCase();
    return alerts.filter(
      (alert) => String(alert.userId || "").trim().toLowerCase() === normalizedUserId,
    );
  }

  if (role === "staff") {
    const normalizedEmail = String(userEmail || "").trim().toLowerCase();
    const loggedInStaff =
      staffMembers.find(
        (staff) =>
          staff.id === userId ||
          staff.email?.toLowerCase() === normalizedEmail,
      ) || null;

    if (!loggedInStaff) return [];

    const visibleStudents = getStudentsForStaff
      ? getStudentsForStaff(loggedInStaff.id)
      : filterStudentsForAdviser(
          students,
          loggedInStaff.assignedSections?.length
            ? loggedInStaff.assignedSections
            : loggedInStaff.assignedSection,
          loggedInStaff.assignedYearLevel,
          loggedInStaff.assignedProgram,
        );

    const visibleStudentIds = new Set(
      visibleStudents
        .map((student) => String(student.student_id || "").trim().toLowerCase())
        .filter(Boolean),
    );
    const visibleUserIds = new Set(
      visibleStudents
        .map((student) => String(student.user_id || "").trim().toLowerCase())
        .filter(Boolean),
    );

    return alerts.filter((alert) => {
      const studentId = String(alert.studentId || "").trim().toLowerCase();
      const alertUserId = String(alert.userId || "").trim().toLowerCase();
      return (
        (studentId && visibleStudentIds.has(studentId)) ||
        (alertUserId && visibleUserIds.has(alertUserId))
      );
    });
  }

  return [];
};
