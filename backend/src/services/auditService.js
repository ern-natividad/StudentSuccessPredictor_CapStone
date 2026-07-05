import { supabase } from "../config/supabaseClient.js";

export const AUDIT_ACTIONS = {
  LOGIN_SUCCESS: "Successful Login",
  LOGIN_FAILED: "Failed Login",
  LOGOUT: "Logout",
  SESSION_TIMEOUT: "Session Timeout",
  ACCOUNT_LOCKED: "Account Locked",
  ACCOUNT_UNLOCKED: "Account Automatically Unlocked",
  MFA_ENABLED: "MFA Enabled",
  MFA_DISABLED: "MFA Disabled",
  USER_CREATED: "User Created",
  USER_UPDATED: "User Updated",
  USER_DELETED: "User Deleted",
  USER_ROLE_CHANGED: "User Role Changed",
  DATASET_UPLOADED: "Dataset Uploaded",
  DATASET_UPDATED: "Dataset Updated",
  DATASET_DELETED: "Dataset Deleted",
  REPORT_GENERATED: "Report Generated",
  REPORT_DOWNLOADED: "Report Downloaded",
};

export const AUDIT_MODULES = {
  AUTH: "Authentication",
  USER_MANAGEMENT: "User Management",
  SYSTEM: "System Operations",
  ADMIN: "Administrative Actions",
};

/**
 * Writes a single audit trail entry. Never throws — a logging failure must
 * never break the primary request flow. Failures are logged server-side.
 */
export const recordAuditLog = async ({
  userId = null,
  username = null,
  action,
  module,
  description = "",
  ip = "unknown",
  browser = "unknown",
}) => {
  try {
    const { error } = await supabase.from("audit_logs").insert({
      user_id: userId,
      username,
      action,
      module,
      description,
      ip_address: ip,
      browser,
    });
    if (error) console.error("[audit] failed to write log:", error.message);
  } catch (err) {
    console.error("[audit] unexpected error:", err);
  }
};

export const listAuditLogs = async ({ limit = 100, offset = 0 } = {}) => {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
};
