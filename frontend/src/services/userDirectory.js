import { supabase } from "../lib/supabaseClient";

// Keep this allow-list deliberate. In particular, password_hash, totp_secret,
// lock_until, and failed_attempts must never be returned to the browser.
const USER_DIRECTORY_COLUMNS =
  "id, email, full_name, role, year_level, created_at, updated_at, account_locked";
const STUDENT_INFO_COLUMNS =
  "user_id, student_id, department, section, year_level, risk_level";

export const getUserDirectory = async () => {
  const [usersResult, studentInfoResult] = await Promise.all([
    supabase
      .from("users")
      .select(USER_DIRECTORY_COLUMNS)
      .order("created_at", { ascending: false }),
    supabase.from("student_info").select(STUDENT_INFO_COLUMNS),
  ]);

  if (usersResult.error) throw usersResult.error;
  if (studentInfoResult.error) throw studentInfoResult.error;

  const studentInfoByUserId = new Map(
    (studentInfoResult.data || []).map((studentInfo) => [
      studentInfo.user_id,
      studentInfo,
    ]),
  );

  return (usersResult.data || []).map((user) => ({
    ...user,
    student_info: studentInfoByUserId.get(user.id) || null,
  }));
};
