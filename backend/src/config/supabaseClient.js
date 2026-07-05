import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

// Service-role client — used only on the backend. The service-role key must
// never be sent to, or embedded in, the frontend bundle.
export const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
