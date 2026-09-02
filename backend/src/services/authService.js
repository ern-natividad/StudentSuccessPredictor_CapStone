import bcrypt from "bcryptjs";
import { timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { supabase } from "../config/supabaseClient.js";
import {
  signToken,
  signPendingMfaToken,
  verifyPendingMfaToken,
} from "../utils/jwt.js";
import {
  checkLockStatus,
  registerFailedAttempt,
  resetFailedAttempts,
  formatRemainingLockTime,
  LOCKOUT_DURATION_MS,
} from "./lockoutService.js";
import { verifyTotpCode } from "./mfaService.js";
import {
  recordAuditLog,
  AUDIT_ACTIONS,
  AUDIT_MODULES,
} from "./auditService.js";
import { HttpError } from "../middleware/errorHandler.js";
import { sendPasswordResetOtpEmail } from "./emailService.js";

// Clear state-free backend cache for transient verification tokens
const otpCache = new Map();

const GENERIC_AUTH_ERROR = "Invalid email or password.";

export const buildPasswordResetProfilePayload = (
  authUser,
  passwordHash = null,
) => ({
  id: authUser.id,
  email: authUser.email?.toLowerCase(),
  password_hash: passwordHash,
  full_name:
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.fullName ||
    authUser.user_metadata?.name ||
    null,
  role: authUser.user_metadata?.role || "student",
});

const findUserByEmail = async (email) => {
  const normalizedEmail = email?.trim().toLowerCase();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;

  const { data: authUsersData, error: authListError } =
    await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

  if (authListError) throw authListError;

  const authUser = authUsersData?.users?.find(
    (user) => user.email?.toLowerCase() === normalizedEmail,
  );
  if (!authUser) return null;

  return buildPasswordResetProfilePayload(authUser);
};

const ensureUserProfileForAuthUser = async (userId) => {
  const { data: existingUser, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (existingUser) return existingUser;

  const { data: authUserResponse, error: authLookupError } =
    await supabase.auth.admin.getUserById(userId);
  if (authLookupError || !authUserResponse?.user) {
    throw new HttpError(404, "Target account identifier not found.");
  }

  const { data: createdUser, error: insertError } = await supabase
    .from("users")
    .insert(buildPasswordResetProfilePayload(authUserResponse.user))
    .select("*")
    .single();

  if (insertError) {
    const { data: fallbackUser, error: fallbackError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (fallbackError) throw fallbackError;
    if (!fallbackUser) throw insertError;
    return fallbackUser;
  }

  return createdUser;
};

/**
 * Step 1 of login: validates email/password and lockout state.
 */
const accessCodesMatch = (providedCode, configuredCode) => {
  const normalizedProvided = String(providedCode || "").trim();
  const normalizedConfigured = String(configuredCode || "").trim();
  if (!normalizedProvided || !normalizedConfigured) return false;
  const provided = Buffer.from(normalizedProvided);
  const configured = Buffer.from(normalizedConfigured);
  return provided.length === configured.length && timingSafeEqual(provided, configured);
};

const getRequiredAccessCode = (role) =>
  role === "admin"
    ? env.adminAccessCode
    : role === "staff"
      ? env.staffAccessCode
      : null;

export const loginWithPassword = async (
  email,
  password,
  accessCode,
  meta = {},
  selectedRole = null,
) => {
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

  if (selectedRole && user.role !== selectedRole) {
    await recordAuditLog({
      userId: user.id,
      username: user.email,
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      module: AUDIT_MODULES.AUTH,
      description: `Login attempted on ${selectedRole} portal for ${user.role} account.`,
      ...meta,
    });
    throw new HttpError(
      401,
      `This account is registered as ${user.role}. Please sign in using the ${user.role} portal.`,
    );
  }

  const requiredAccessCode = getRequiredAccessCode(user.role);

  if (requiredAccessCode !== null && !accessCodesMatch(accessCode, requiredAccessCode)) {
    await recordAuditLog({
      userId: user.id,
      username: user.email,
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      module: AUDIT_MODULES.AUTH,
      description: "Invalid role access code.",
      ...meta,
    });
    throw new HttpError(401, "Invalid role access code.");
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
 * Step 2 of login for MFA-enabled accounts.
 */
export const verifyMfaAndIssueToken = async (pendingToken, code, meta = {}) => {
  let userId;
  try {
    userId = verifyPendingMfaToken(pendingToken).sub;
  } catch {
    throw new HttpError(
      401,
      "Your verification session expired. Please log in again.",
    );
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
      profilePicture: user.profile_picture || null,
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
    .select("id, email, full_name, role, two_factor_enabled, profile_picture")
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
    profilePicture: user.profile_picture || null,
  };
};

export const updateUserProfile = async (authUser, payload) => {
  const fullName = payload.fullName?.trim();
  const profilePicture = payload.profilePicture;

  if (!fullName) {
    throw new HttpError(400, "Full name is required.");
  }

  if (
    profilePicture !== undefined &&
    profilePicture !== null &&
    typeof profilePicture !== "string"
  ) {
    throw new HttpError(400, "Profile picture must be a valid image string.");
  }

  if (profilePicture && profilePicture.length > 1_500_000) {
    throw new HttpError(400, "Profile picture is too large. Use an image under 1 MB.");
  }

  const updates = {
    full_name: fullName,
    updated_at: new Date().toISOString(),
  };

  if (profilePicture !== undefined) {
    updates.profile_picture = profilePicture || null;
  }

  const { data: user, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", authUser.sub)
    .select("id, email, full_name, role, two_factor_enabled, profile_picture")
    .maybeSingle();

  if (error) throw error;
  if (!user) throw new HttpError(404, "User not found.");

  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    twoFactorEnabled: user.two_factor_enabled,
    profilePicture: user.profile_picture || null,
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
  {
    test: (value) => value.length >= 8,
    message: "Password must be at least 8 characters.",
  },
  {
    test: (value) => /[A-Z]/.test(value),
    message: "Password must include an uppercase letter.",
  },
  {
    test: (value) => /[0-9]/.test(value),
    message: "Password must include a number.",
  },
  {
    test: (value) => /[^A-Za-z0-9]/.test(value),
    message: "Password must include a special character.",
  },
];

const assertValidPassword = (password) => {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) {
      throw new HttpError(400, rule.message);
    }
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
    year_level: yearLevel,
  } = payload;

  console.log("authService -> payload:", payload);
  console.log("authService -> yearLevel:", yearLevel);

  const safeYearLevel = yearLevel ?? null;

  if (!firstName || !lastName || !email || !password) {
    throw new HttpError(400, "Please complete all required fields.");
  }

  if (!termsAccepted) {
    throw new HttpError(400, "You must accept the Terms of Service.");
  }

  if (!["admin", "staff", "student"].includes(role)) {
    throw new HttpError(400, "Invalid role.");
  }

  const requiredAccessCode = getRequiredAccessCode(role);
  if (requiredAccessCode !== null && !accessCodesMatch(accessCode, requiredAccessCode)) {
    throw new HttpError(401, "Invalid role access code.");
  }

  assertValidPassword(password);

  const normalizedEmail = email.toLowerCase();
  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new HttpError(409, "An account with this email already exists.");
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: normalizedEmail,
    password: password,
  });

  if (authError) {
    throw new HttpError(400, authError.message);
  }

  if (!authData || !authData.user) {
    throw new HttpError(
      500,
      "Failed to initialize secure authentication session.",
    );
  }

  const authUserId = authData.user.id;
  const passwordHash = await hashPassword(password);
  const fullName = `${firstName} ${lastName}`.trim();

  const { data: user, error } = await supabase
    .from("users")
    .insert({
      id: authUserId,
      email: normalizedEmail,
      password_hash: passwordHash,
      full_name: fullName,
      role,
      year_level: safeYearLevel,
    })
    .select("*")
    .single();

  console.log("authService -> insert payload:", {
    id: authUserId,
    email: normalizedEmail,
    full_name: fullName,
    role,
    year_level: safeYearLevel,
  });

  if (error) {
    throw error;
  }

  await recordAuditLog({
    userId: user.id,
    username: user.email,
    action: AUDIT_ACTIONS.USER_CREATED,
    module: AUDIT_MODULES.USER_MANAGEMENT,
    description: `New ${role} account registered.`,
  });

  return issueSessionForUser(user);
};

/**
 * Initiates a password reset challenge by generating an internal 6-digit verification code.
 */
export const initiatePasswordReset = async (email, meta = {}) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    throw new HttpError(404, "Email address not found.");
  }

  // 1. Generate a local 6-digit code
  const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

  // 2. Store code in server memory cache with a 10-minute expiration
  otpCache.set(normalizedEmail, {
    code: generatedCode,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  });

  // 3. Send the verification code through Brevo Transactional Email.
  try {
    await sendPasswordResetOtpEmail({ to: normalizedEmail, code: generatedCode });
  } catch (mailError) {
    console.error("Mail Dispatch Failure:", mailError);
    throw new HttpError(
      500,
      "Failed to send verification email. Please check server configuration.",
    );
  }

  return {
    success: true,
    message: "6-digit verification code sent to email.",
  };
};

/**
 * Verifies the manually keyed 6-digit OTP code text against server memory cache.
 */
export const verifyPasswordOtp = async (email, code, meta = {}) => {
  const normalizedEmail = email.trim().toLowerCase();
  const cachedData = otpCache.get(normalizedEmail);

  if (!cachedData) {
    throw new HttpError(
      400,
      "No active verification request found for this email.",
    );
  }

  if (Date.now() > cachedData.expiresAt) {
    otpCache.delete(normalizedEmail);
    throw new HttpError(
      400,
      "Your verification code has expired. Please request a new one.",
    );
  }

  if (cachedData.code !== code.trim()) {
    throw new HttpError(400, "Invalid or incorrect verification code.");
  }

  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    throw new HttpError(404, "Target account identifier no longer exists.");
  }

  otpCache.set(normalizedEmail, {
    ...cachedData,
    verified: true,
    verifiedUserId: user.id,
    verifiedAt: Date.now(),
  });

  return {
    success: true,
    userId: user.id,
    message: "Code verified successfully.",
  };
};

/**
 * Completes the password reset process inside Supabase and the user profile state cleanly.
 */
export const completePasswordReset = async (userId, newPassword, meta = {}, email = null) => {
  if (!userId) {
    throw new HttpError(
      400,
      "Invalid or missing user identity session context.",
    );
  }

  const normalizedEmail = email?.trim().toLowerCase();
  if (normalizedEmail) {
    const cachedData = otpCache.get(normalizedEmail);
    if (!cachedData?.verified || cachedData.verifiedUserId !== userId) {
      throw new HttpError(
        400,
        "Please verify your email code before resetting your password.",
      );
    }
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (userError || !user) {
    throw new HttpError(404, "Target account identifier not found.");
  }

  assertValidPassword(newPassword);

  const { error: authError } = await supabase.auth.admin.updateUserById(
    userId,
    {
      password: newPassword,
    },
  );
  if (authError) {
    throw new HttpError(400, authError.message);
  }

  const passwordHash = await hashPassword(newPassword);
  const { error: dbError } = await supabase
    .from("users")
    .update({ password_hash: passwordHash })
    .eq("id", userId);

  if (dbError) {
    throw dbError;
  }

  if (normalizedEmail) {
    otpCache.delete(normalizedEmail);
  }

  await recordAuditLog({
    userId: user.id,
    username: user.email,
    action: AUDIT_ACTIONS.USER_UPDATED,
    module: AUDIT_MODULES.AUTH,
    description:
      "Password reset completed successfully via 6-digit OTP validation step.",
    ...meta,
  });

  return user;
};

/**
 * Lets an authenticated user change their password after verifying the current one.
 */
export const changeUserPassword = async (
  authUser,
  { currentPassword, newPassword },
  meta = {},
) => {
  const userId = authUser?.id || authUser?.sub;
  if (!userId) {
    throw new HttpError(401, "Authentication required.");
  }

  if (!currentPassword || !newPassword) {
    throw new HttpError(400, "Current password and new password are required.");
  }

  if (currentPassword === newPassword) {
    throw new HttpError(
      400,
      "New password must be different from your current password.",
    );
  }

  assertValidPassword(newPassword);

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email, password_hash")
    .eq("id", userId)
    .maybeSingle();

  if (userError || !user) {
    throw new HttpError(404, "Account not found.");
  }

  if (!user.password_hash) {
    throw new HttpError(
      400,
      "Password change is unavailable for this account. Use Forgot Password instead.",
    );
  }

  const passwordMatches = await bcrypt.compare(
    currentPassword,
    user.password_hash,
  );
  if (!passwordMatches) {
    throw new HttpError(401, "Current password is incorrect.");
  }

  const { error: authError } = await supabase.auth.admin.updateUserById(
    userId,
    { password: newPassword },
  );
  if (authError) {
    throw new HttpError(400, authError.message);
  }

  const passwordHash = await hashPassword(newPassword);
  const { error: dbError } = await supabase
    .from("users")
    .update({ password_hash: passwordHash })
    .eq("id", userId);

  if (dbError) {
    throw dbError;
  }

  await recordAuditLog({
    userId: user.id,
    username: user.email,
    action: AUDIT_ACTIONS.USER_UPDATED,
    module: AUDIT_MODULES.AUTH,
    description: "Password changed successfully from Account Settings.",
    ...meta,
  });

  return {
    success: true,
    message: "Password updated successfully.",
  };
};
