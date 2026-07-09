import { asyncHandler } from "../utils/asyncHandler.js";
import { getRequestMeta } from "../utils/requestMeta.js";
import { supabase } from "../config/supabaseClient.js";
import {
  loginWithPassword,
  verifyMfaAndIssueToken,
  logout,
  recordSessionTimeout,
  registerUser,
  getCurrentUser,
  initiatePasswordReset,
  verifyPasswordOtp,
  completePasswordReset,
} from "../services/authService.js";

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const meta = getRequestMeta(req);

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const result = await loginWithPassword(email, password, meta);

  if (result.requiresMfa) {
    return res.status(200).json({
      requiresMfa: true,
      pendingToken: result.pendingToken,
      userId: result.pendingToken,
    });
  }

  return res.status(200).json(result);
});

export const verifyMfaLogin = asyncHandler(async (req, res) => {
  const { pendingToken, code } = req.body;
  const meta = getRequestMeta(req);

  if (!pendingToken) {
    return res.status(400).json({ error: "Missing session reference." });
  }

  const result = await verifyMfaAndIssueToken(pendingToken, code, meta);
  return res.status(200).json(result);
});

export const me = asyncHandler(async (req, res) => {
  const profile = await getCurrentUser(req.user);
  return res.status(200).json(profile);
});

export const logoutHandler = asyncHandler(async (req, res) => {
  const meta = getRequestMeta(req);
  await logout(req.user, meta);
  return res.status(200).json({ success: true });
});

export const sessionTimeoutHandler = asyncHandler(async (req, res) => {
  const meta = getRequestMeta(req);
  await recordSessionTimeout(req.user, meta);
  return res.status(200).json({ success: true });
});

export const signup = asyncHandler(async (req, res) => {
  const meta = getRequestMeta(req);
  const result = await registerUser(req.body, meta);
  return res.status(201).json(result);
});

/**
 * POST /forgot-password/request
 * Initiates a 6-digit OTP token request.
 */
export const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const email = req.body.email || req.body.identifier;
  const meta = getRequestMeta(req);

  if (!email || !email.trim()) {
    return res.status(400).json({ error: "Email address is required." });
  }

  const result = await initiatePasswordReset(email, meta);
  return res.status(200).json(result);
});

/**
 * POST /forgot-password/verify
 * Validates the 6-digit numeric OTP text code typed into the UI.
 */
export const verifyForgotPasswordCode = asyncHandler(async (req, res) => {
  const email = req.body.email || req.body.identifier;
  const { code } = req.body;
  const meta = getRequestMeta(req);

  if (!email || !code) {
    return res
      .status(400)
      .json({ error: "Email address and verification code are required." });
  }

  const result = await verifyPasswordOtp(email, code, meta);
  return res.status(200).json(result);
});

/**
 * POST /forgot-password/reset
 * Updates the password in Supabase Auth using the validated user context.
 */
export const forgotPasswordReset = asyncHandler(async (req, res) => {
  // 1. Accept userId OR email parameters dynamically from the frontend payload
  const { userId, email, identifier, newPassword } = req.body;
  const meta = getRequestMeta(req);

  if (!newPassword) {
    return res.status(400).json({ error: "New password is required." });
  }

  let targetId = userId;

  // 2. Fallback: If the frontend didn't track the UUID but passed the email address, resolve it
  if (!targetId && (email || identifier)) {
    const fallbackEmail = (email || identifier).trim().toLowerCase();

    const { data: foundUser, error: fetchError } = await supabase
      .from("users")
      .select("id")
      .eq("email", fallbackEmail)
      .maybeSingle();

    if (fetchError) {
      return res
        .status(500)
        .json({ error: "Database error resolving account context." });
    }

    if (foundUser) {
      targetId = foundUser.id;
    } else {
      const { data: authUsersData, error: authListError } =
        await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });

      if (!authListError) {
        const authUser = authUsersData?.users?.find(
          (user) => user.email?.toLowerCase() === fallbackEmail,
        );
        if (authUser) {
          targetId = authUser.id;
        }
      }
    }
  }

  // 3. Throw a clean error if neither approach can establish who the user is
  if (!targetId) {
    return res
      .status(404)
      .json({ error: "Target account identifier not found." });
  }

  // 4. Complete password update step via the authService logic
  const user = await completePasswordReset(targetId, newPassword, meta);

  return res.status(200).json({
    success: true,
    role: user.role,
    message: "Password updated successfully.",
  });
});
