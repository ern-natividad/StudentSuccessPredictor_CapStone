import { supabase } from "../config/supabaseClient.js";
import { HttpError } from "../middleware/errorHandler.js";
import { isStudentAssignedToStaff } from "../utils/staffStudentAssignment.js";

export const getStaffAccessibleStudentUserIds = async (
  requester,
  studentUserIds,
) => {
  const staffId = requester?.sub || requester?.id;
  const userIds = [...new Set((studentUserIds || []).filter(Boolean))];
  if (requester?.role !== "staff") return new Set(userIds);
  if (!staffId || userIds.length === 0) return new Set();

  const { data: adviser, error: adviserError } = await supabase
    .from("adviser_assignments")
    .select("school_year, program, year_level, section, is_active")
    .eq("adviser_user_id", staffId)
    .eq("is_active", true);
  if (adviserError) throw adviserError;
  if (!adviser?.length) return new Set();

  const { data: students, error: studentError } = await supabase
    .from("student_info")
    .select("user_id, section, year_level, program, department, school_year")
    .in("user_id", userIds);
  if (studentError) throw studentError;

  const accessibleUserIds = new Set(
    (students || [])
      .filter((student) => isStudentAssignedToStaff(student, adviser))
      .map((student) => student.user_id),
  );
  return accessibleUserIds;
};

export const assertStaffCanAccessStudents = async (requester, studentUserIds) => {
  const userIds = [...new Set((studentUserIds || []).filter(Boolean))];
  if (requester?.role !== "staff") return;
  if (userIds.length === 0) {
    throw new HttpError(403, "You are not assigned to the requested student.");
  }

  const accessibleUserIds = await getStaffAccessibleStudentUserIds(
    requester,
    userIds,
  );
  if (userIds.some((userId) => !accessibleUserIds.has(userId))) {
    throw new HttpError(403, "You are not assigned to the requested student.");
  }
};
