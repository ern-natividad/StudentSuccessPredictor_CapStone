import { asyncHandler } from "../utils/asyncHandler.js";
import { getRequestMeta } from "../utils/requestMeta.js";
import {
  loginWithPassword,
  verifyMfaAndIssueToken,
  logout,
  recordSessionTimeout,
  registerUser,
  getCurrentUser,
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
      userId: result.pendingToken 
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