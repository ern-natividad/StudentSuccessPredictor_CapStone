import { supabase } from "../config/supabaseClient.js";
import { HttpError } from "../middleware/errorHandler.js";
import { isStudentAssignedToStaff } from "../utils/staffStudentAssignment.js";

export const assertStaffCanAccessStudents = async (requester, studentUserIds) => {
  if (requester?.role !== "staff") return;

  const staffId = requester.sub || requester.id;
  const userIds = [...new Set((studentUserIds || []).filter(Boolean))];
  if (!staffId || userIds.length === 0) {
    throw new HttpError(403, "You are not assigned to the requested student.");
  }

  const { data: adviser, error: adviserError } = await supabase
    .from("adviser_info")
    .select("assigned_section, year_level, program")
    .eq("user_id", staffId)
    .maybeSingle();
  if (adviserError) throw adviserError;

  const { data: students, error: studentError } = await supabase
    .from("student_info")
    .select("user_id, section, year_level, program, department")
    .in("user_id", userIds);
  if (studentError) throw studentError;

  const studentsById = new Map(
    (students || []).map((student) => [student.user_id, student]),
  );
  if (
    userIds.some(
      (userId) => !isStudentAssignedToStaff(studentsById.get(userId), adviser),
    )
  ) {
    throw new HttpError(403, "You are not assigned to the requested student.");
  }
};
