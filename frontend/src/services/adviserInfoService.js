import { supabase } from "../lib/supabaseClient";

import { serializeAssignedSections } from "../utils/adviserAssignmentUtils";

const ADVISER_INFO_COLUMNS = "user_id, assigned_section, year_level";

export const upsertAdviserInfo = async (userId, updates) => {
  const assignedSection = Array.isArray(updates.assigned_sections)
    ? serializeAssignedSections(updates.assigned_sections)
    : updates.assigned_section?.trim() || null;

  const payload = {
    user_id: userId,
    assigned_section: assignedSection,
    year_level: updates.year_level?.trim() || null,
  };

  const { data: updated, error: updateError } = await supabase
    .from("adviser_info")
    .update(payload)
    .eq("user_id", userId)
    .select(ADVISER_INFO_COLUMNS)
    .maybeSingle();

  if (updateError) throw updateError;
  if (updated) return updated;

  const { data: inserted, error: insertError } = await supabase
    .from("adviser_info")
    .insert(payload)
    .select(ADVISER_INFO_COLUMNS)
    .single();

  if (insertError) throw insertError;
  return inserted;
};
