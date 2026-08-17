import { supabase } from "../lib/supabaseClient";

const ADVISER_INFO_COLUMNS = "user_id, assigned_section, year_level";

export const upsertAdviserInfo = async (userId, updates) => {
  const payload = {
    user_id: userId,
    assigned_section: updates.assigned_section?.trim() || null,
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
