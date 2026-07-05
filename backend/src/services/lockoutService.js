import { supabase } from "../config/supabaseClient.js";
import { env } from "../config/env.js";
import { recordAuditLog, AUDIT_ACTIONS, AUDIT_MODULES } from "./auditService.js";

const MAX_ATTEMPTS = env.lockoutMaxAttempts;
const LOCK_MINUTES = env.lockoutDurationMinutes;

/**
 * Checks whether an account is currently locked. If the lock window has
 * already elapsed, auto-unlocks the account and resets failed_attempts.
 * Returns { locked, remainingMs }.
 */
export const checkLockStatus = async (user) => {
  if (!user.account_locked) return { locked: false, remainingMs: 0 };

  const lockUntil = user.lock_until ? new Date(user.lock_until).getTime() : 0;
  const now = Date.now();

  if (lockUntil <= now) {
    await supabase
      .from("users")
      .update({ account_locked: false, lock_until: null, failed_attempts: 0 })
      .eq("id", user.id);

    await recordAuditLog({
      userId: user.id,
      username: user.email,
      action: AUDIT_ACTIONS.ACCOUNT_UNLOCKED,
      module: AUDIT_MODULES.AUTH,
      description: "Account automatically unlocked after the lockout period elapsed.",
    });

    return { locked: false, remainingMs: 0 };
  }

  return { locked: true, remainingMs: lockUntil - now };
};

/**
 * Registers a failed login attempt. Locks the account once MAX_ATTEMPTS
 * consecutive failures have been reached.
 */
export const registerFailedAttempt = async (user, meta = {}) => {
  const nextAttempts = (user.failed_attempts || 0) + 1;
  const shouldLock = nextAttempts >= MAX_ATTEMPTS;

  const update = {
    failed_attempts: shouldLock ? MAX_ATTEMPTS : nextAttempts,
    account_locked: shouldLock,
    lock_until: shouldLock
      ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString()
      : user.lock_until,
  };

  await supabase.from("users").update(update).eq("id", user.id);

  if (shouldLock) {
    await recordAuditLog({
      userId: user.id,
      username: user.email,
      action: AUDIT_ACTIONS.ACCOUNT_LOCKED,
      module: AUDIT_MODULES.AUTH,
      description: `Account locked after ${MAX_ATTEMPTS} consecutive failed login attempts.`,
      ip: meta.ip,
      browser: meta.browser,
    });
  }

  return { locked: shouldLock, attempts: update.failed_attempts };
};

export const resetFailedAttempts = async (userId) => {
  await supabase
    .from("users")
    .update({ failed_attempts: 0, account_locked: false, lock_until: null })
    .eq("id", userId);
};

export const formatRemainingLockTime = (remainingMs) => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
};

export const LOCKOUT_DURATION_MS = LOCK_MINUTES * 60 * 1000;
