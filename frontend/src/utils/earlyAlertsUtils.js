import { supabase } from "../lib/supabaseClient";
import { filterStudentsForAdviser } from "./adviserAssignmentUtils";

export const fetchEarlyAlerts = async () => {
  const { data: studentRecords, error: fetchError } = await supabase
    .from("student_info")
    .select(`
      id,
      student_id,
      department,
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

  return (studentRecords || [])
    .filter((student) => student.risk_level || student.users?.account_locked)
    .map((student) => {
      const userObj = Array.isArray(student.users) ? student.users[0] : student.users;
      const studentIdStr = student.student_id ? ` (${student.student_id})` : "";
      const displayName =
        (userObj?.full_name || userObj?.email || "Student Account") + studentIdStr;

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
        studentId: student.student_id || "",
        userId: userObj?.id || "",
        name: displayName,
        desc: description,
        sev: severity,
        time: formattedTime,
      };
    });
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
