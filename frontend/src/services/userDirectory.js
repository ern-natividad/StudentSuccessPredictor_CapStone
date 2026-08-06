import { supabase } from "../lib/supabaseClient";

// Keep this allow-list deliberate. In particular, password_hash, totp_secret,
// lock_until, and failed_attempts must never be returned to the browser.
const USER_DIRECTORY_COLUMNS =
  "id, email, full_name, role, year_level, created_at, updated_at, account_locked";

export const getUserDirectory = async () => {
  const { data, error } = await supabase
    .from("users")
    .select(USER_DIRECTORY_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};
