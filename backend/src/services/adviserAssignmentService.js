import { supabase } from "../config/supabaseClient.js";

const ASSIGNMENT_COLUMNS =
  "id, adviser_user_id, school_year, program, year_level, section, is_active, created_at, updated_at";

export const listAdviserAssignments = async () => {
  const { data, error } = await supabase
    .from("adviser_assignments")
    .select(ASSIGNMENT_COLUMNS)
    .order("school_year", { ascending: false })
    .order("program", { ascending: true })
    .order("year_level", { ascending: true })
    .order("section", { ascending: true });

  if (error) throw error;
  return data || [];
};

export const saveAdviserAssignmentGroup = async ({
  adviserUserId,
  schoolYear,
  program,
  yearLevel,
  sections,
  previousGroup,
}) => {
  const records = sections.map((section) => ({
    adviser_user_id: adviserUserId,
    school_year: schoolYear,
    program,
    year_level: yearLevel,
    section,
    is_active: true,
    updated_at: new Date().toISOString(),
  }));
  const { data, error } = await supabase
    .from("adviser_assignments")
    .upsert(records, {
      onConflict: "adviser_user_id,school_year,program,year_level,section",
    })
    .select(ASSIGNMENT_COLUMNS);

  if (error) throw error;

  if (previousGroup) {
    const oldGroupQuery = supabase
      .from("adviser_assignments")
      .select("id, section")
      .eq("adviser_user_id", previousGroup.adviserUserId)
      .eq("school_year", previousGroup.schoolYear)
      .eq("program", previousGroup.program)
      .eq("year_level", previousGroup.yearLevel);

    const { data: oldRecords, error: oldRecordsError } = await oldGroupQuery;
    if (oldRecordsError) throw oldRecordsError;

    const sameGroup =
      previousGroup.adviserUserId === adviserUserId &&
      previousGroup.schoolYear === schoolYear &&
      previousGroup.program === program &&
      previousGroup.yearLevel === yearLevel;
    const obsoleteIds = (oldRecords || [])
      .filter((record) => !sameGroup || !sections.includes(record.section))
      .map((record) => record.id);

    if (obsoleteIds.length > 0) {
      const { error: deleteError } = await supabase
        .from("adviser_assignments")
        .delete()
        .in("id", obsoleteIds);
      if (deleteError) throw deleteError;
    }
  }

  return data || [];
};
