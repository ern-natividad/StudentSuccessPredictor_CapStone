import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

// Keep user auth sessions off the service-role client used for database access.
export const supabaseAuth = createClient(
  env.supabaseUrl,
  env.supabaseServiceRoleKey,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
