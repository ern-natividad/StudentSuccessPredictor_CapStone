import { supabase } from "../lib/supabaseClient";

const STUDENT_INFO_COLUMNS =
  "user_id, student_id, department, program, section, year_level, risk_level";

export const upsertStudentInfo = async (userId, updates) => {
  const payload = {
    user_id: userId,
    student_id: updates.student_id?.trim(),
    department: updates.department?.trim() || null,
    program: updates.program?.trim() || null,
    section: updates.section?.trim() || null,
    year_level: updates.year_level?.trim() || null,
    risk_level: updates.risk_level?.trim() || null,
  };

  const { data: updated, error: updateError } = await supabase
    .from("student_info")
    .update(payload)
    .eq("user_id", userId)
    .select(STUDENT_INFO_COLUMNS)
    .maybeSingle();

  if (updateError) throw updateError;
  if (updated) return updated;

  const { data: inserted, error: insertError } = await supabase
    .from("student_info")
    .insert(payload)
    .select(STUDENT_INFO_COLUMNS)
    .single();

  if (insertError) throw insertError;
  return inserted;
};
