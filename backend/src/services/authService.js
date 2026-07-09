import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
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

// 1. Initialize the SMTP Transporter matching your exact env.js exports
const transporter = nodemailer.createTransport({
  host: env.smtpHost,          
  port: env.smtpPort,          
  secure: false, 
  auth: {
    user: env.smtpUser,       
    pass: env.smtpPass,    
  },
});

// 2. Clear state-free backend cache for transient verification tokens
const otpCache = new Map();

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
 * Step 2 of login for MFA-enabled accounts.
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

export const registerUser = async (payload, meta = {}) => {
  const {
    first_name: firstName,
    last_name: lastName,
    email,
    role = "student",
    password,
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
    throw new HttpError(500, "Failed to initialize secure authentication session.");
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
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
  });

  // 3. Fire the real email using Nodemailer via Brevo API relay
  try {
    await transporter.sendMail({
      from: `"WMSU Engineering Support" <justinjamesalviar@gmail.com>`, 
      to: normalizedEmail, 
      subject: `${generatedCode} is your account recovery code`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #800000; text-align: center;">Account Recovery Request</h2>
          <p>We received a request to reset your password for the College of Engineering portal.</p>
          <p>Use the following 6-digit verification code to proceed:</p>
          <div style="background: #f4f4f4; text-align: center; font-size: 28px; font-weight: bold; padding: 15px; letter-spacing: 6px; color: #333; margin: 20px 0; border-radius: 4px;">
            ${generatedCode}
          </div>
          <p style="font-size: 12px; color: #666;">This verification code expires in 10 minutes. If you did not make this request, you can safely ignore this message.</p>
        </div>
      `,
    });
  } catch (mailError) {
    console.error("Mail Dispatch Failure:", mailError);
    throw new HttpError(500, "Failed to send verification email. Please check server configuration.");
  }

  return { 
    success: true, 
    message: "6-digit verification code sent to email."
  };
};

/**
 * Verifies the manually keyed 6-digit OTP code text against server memory cache.
 */
export const verifyPasswordOtp = async (email, code, meta = {}) => {
  const normalizedEmail = email.trim().toLowerCase();
  const cachedData = otpCache.get(normalizedEmail);

  if (!cachedData) {
    throw new HttpError(400, "No active verification request found for this email.");
  }

  if (Date.now() > cachedData.expiresAt) {
    otpCache.delete(normalizedEmail); // Clear expired entry
    throw new HttpError(400, "Your verification code has expired. Please request a new one.");
  }

  if (cachedData.code !== code.trim()) {
    throw new HttpError(400, "Invalid or incorrect verification code.");
  }

  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    throw new HttpError(404, "Target account identifier no longer exists.");
  }

  // Clear OTP from cache after a successful verification
  otpCache.delete(normalizedEmail);

  return {
    success: true,
    userId: user.id,
    message: "Code verified successfully."
  };
};

/**
 * Completes the password reset process inside Supabase and the user profile state cleanly.
 */
export const completePasswordReset = async (userId, newPassword, meta = {}) => {
  if (!userId) {
    throw new HttpError(400, "Invalid or missing user identity session context.");
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

  const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });
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
    description: "Password reset completed successfully via 6-digit OTP validation step.",
    ...meta,
  });

  return user;
};