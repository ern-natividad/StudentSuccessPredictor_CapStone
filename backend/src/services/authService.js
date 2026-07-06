import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { supabase } from "../config/supabaseClient.js";
import { signToken, signPendingMfaToken, verifyPendingMfaToken } from "../utils/jwt.js";
import {
  checkLockStatus,
  registerFailedAttempt,
  resetFailedAttempts,
  formatRemainingLockTime,
  LOCKOUT_DURATION_MS,
} from "./lockoutService.js";
import { verifyTotpCode } from "./mfaService.js";
import { recordAuditLog, AUDIT_ACTIONS, AUDIT_MODULES } from "./auditService.js";
import { HttpError } from "../middleware/errorHandler.js";

// Generic message returned for any credential failure — never reveals
// whether the email exists, which field was wrong, or the lock state
// before we've confirmed the password (see below for the one exception:
// once locked, a "temporarily locked" message is expected UX per spec).
const GENERIC_AUTH_ERROR = "Invalid email or password.";

const findUserByEmail = async (email) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return data;
};

/**
 * Step 1 of login: validates email/password and lockout state.
 * Returns { requiresMfa: true, userId } when MFA must be completed via
 * verifyMfaAndIssueToken, or { token, user } when login is already complete.
 */
export const loginWithPassword = async (email, password, meta = {}) => {
  const user = await findUserByEmail(email);

  if (!user) {
    await recordAuditLog({
      username: email,
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      module: AUDIT_MODULES.AUTH,
      description: "Login attempt for unknown email.",
      ...meta,
    });
    throw new HttpError(401, GENERIC_AUTH_ERROR);
  }

  const { locked, remainingMs } = await checkLockStatus(user);
  if (locked) {
    throw new HttpError(
      423,
      `This account is temporarily locked due to multiple failed login attempts. Try again in ${formatRemainingLockTime(remainingMs)}.`,
    );
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    const { locked: nowLocked } = await registerFailedAttempt(user, meta);
    await recordAuditLog({
      userId: user.id,
      username: user.email,
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      module: AUDIT_MODULES.AUTH,
      description: "Incorrect password.",
      ...meta,
    });

    if (nowLocked) {
      throw new HttpError(
        423,
        `Too many failed attempts. This account is now locked for ${formatRemainingLockTime(LOCKOUT_DURATION_MS)}.`,
      );
    }
    throw new HttpError(401, GENERIC_AUTH_ERROR);
  }

  if (user.two_factor_enabled) {
    return { requiresMfa: true, pendingToken: signPendingMfaToken(user.id) };
  }

  await resetFailedAttempts(user.id);
  await recordAuditLog({
    userId: user.id,
    username: user.email,
    action: AUDIT_ACTIONS.LOGIN_SUCCESS,
    module: AUDIT_MODULES.AUTH,
    ...meta,
  });

  return issueSessionForUser(user);
};

/**
 * Step 2 of login for MFA-enabled accounts: verifies the 6-digit TOTP code
 * and only issues a session token on success. MFA can never be bypassed —
 * there is no code path that returns a token without a valid `code` here.
 */
export const verifyMfaAndIssueToken = async (pendingToken, code, meta = {}) => {
  let userId;
  try {
    userId = verifyPendingMfaToken(pendingToken).sub;
  } catch {
    throw new HttpError(401, "Your verification session expired. Please log in again.");
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!user) throw new HttpError(401, "Invalid session. Please log in again.");

  if (!user.two_factor_enabled) {
    throw new HttpError(401, "Invalid session. Please log in again.");
  }

  const { locked, remainingMs } = await checkLockStatus(user);
  if (locked) {
    throw new HttpError(
      423,
      `This account is temporarily locked due to multiple failed login attempts. Try again in ${formatRemainingLockTime(remainingMs)}.`,
    );
  }

  if (!code) {
    throw new HttpError(400, "Verification code is required.");
  }

  const isValid = verifyTotpCode(user.totp_secret, code);
  if (!isValid) {
    const { locked: nowLocked } = await registerFailedAttempt(user, meta);
    await recordAuditLog({
      userId: user.id,
      username: user.email,
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      module: AUDIT_MODULES.AUTH,
      description: "Invalid or expired MFA code.",
      ...meta,
    });

    if (nowLocked) {
      throw new HttpError(
        423,
        `Too many failed attempts. This account is now locked for ${formatRemainingLockTime(LOCKOUT_DURATION_MS)}.`,
      );
    }
    throw new HttpError(401, "Invalid or expired verification code.");
  }

  await resetFailedAttempts(user.id);
  await recordAuditLog({
    userId: user.id,
    username: user.email,
    action: AUDIT_ACTIONS.LOGIN_SUCCESS,
    module: AUDIT_MODULES.AUTH,
    description: "Login completed with MFA verification.",
    ...meta,
  });

  return issueSessionForUser(user);
};

const issueSessionForUser = (user) => {
  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      twoFactorEnabled: user.two_factor_enabled,
    },
  };
};

export const logout = async (authUser, meta = {}) => {
  await recordAuditLog({
    userId: authUser.sub,
    username: authUser.email,
    action: AUDIT_ACTIONS.LOGOUT,
    module: AUDIT_MODULES.AUTH,
    ...meta,
  });
};

export const getCurrentUser = async (authUser) => {
  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, full_name, role, two_factor_enabled")
    .eq("id", authUser.sub)
    .maybeSingle();

  if (error) throw error;
  if (!user) throw new HttpError(404, "User not found.");

  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    twoFactorEnabled: user.two_factor_enabled,
  };
};

export const recordSessionTimeout = async (authUser, meta = {}) => {
  await recordAuditLog({
    userId: authUser.sub,
    username: authUser.email,
    action: AUDIT_ACTIONS.SESSION_TIMEOUT,
    module: AUDIT_MODULES.AUTH,
    description: "Session ended automatically due to inactivity.",
    ...meta,
  });
};

export const hashPassword = (plain) => bcrypt.hash(plain, 12);

const PASSWORD_RULES = [
  { test: (value) => value.length >= 8, message: "Password must be at least 8 characters." },
  { test: (value) => /[A-Z]/.test(value), message: "Password must include an uppercase letter." },
  { test: (value) => /[0-9]/.test(value), message: "Password must include a number." },
  { test: (value) => /[^A-Za-z0-9]/.test(value), message: "Password must include a special character." },
];

const assertValidPassword = (password) => {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) {
      throw new HttpError(400, rule.message);
    }
  }
};

const assertValidAccessCode = (role, accessCode) => {
  if (role === "student") return;

  const expectedCode = role === "admin" ? env.adminAccessCode : env.staffAccessCode;
  if (!expectedCode) {
    throw new HttpError(503, "Registration is not available for this role right now.");
  }
  if (accessCode !== expectedCode) {
    throw new HttpError(403, "Invalid access code.");
  }
};

export const registerUser = async (payload, meta = {}) => {
  const {
    first_name: firstName,
    last_name: lastName,
    email,
    role = "student",
    password,
    access_code: accessCode,
    terms_accepted: termsAccepted,
  } = payload;

  if (!firstName || !lastName || !email || !password) {
    throw new HttpError(400, "Please complete all required fields.");
  }

  if (!termsAccepted) {
    throw new HttpError(400, "You must accept the Terms of Service.");
  }

  if (!["admin", "staff", "student"].includes(role)) {
    throw new HttpError(400, "Invalid role.");
  }

  assertValidPassword(password);
  assertValidAccessCode(role, accessCode);

  const normalizedEmail = email.toLowerCase();
  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new HttpError(409, "An account with this email already exists.");
  }

  // === STEP 1: CREATE USER IN SECURE SUPABASE AUTH VAULT ===
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: normalizedEmail,
    password: password,
  });

  if (authError) {
    throw new HttpError(400, authError.message);
  }

  if (!authData || !authData.user) {
    throw new HttpError(500, "Failed to initialize secure authentication session.");
  }

  // Capture the secure identifier generated by Supabase
  const authUserId = authData.user.id;

  const passwordHash = await hashPassword(password);
  const fullName = `${firstName} ${lastName}`.trim();

  // === STEP 2: INSERT ROW INTO TABLE EDITOR 'users' TABLE ===
  const { data: user, error } = await supabase
    .from("users")
    .insert({
      id: authUserId, 
      email: normalizedEmail,
      password_hash: passwordHash,
      full_name: fullName,
      role,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await recordAuditLog({
    userId: user.id,
    username: user.email,
    action: AUDIT_ACTIONS.USER_CREATED,
    module: AUDIT_MODULES.USER_MANAGEMENT,
    description: `New ${role} account registered.`,
    ...meta,
  });

  return issueSessionForUser(user);
};