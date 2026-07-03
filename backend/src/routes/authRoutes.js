import { Router } from "express";
import {
  accountExists,
  getUserRole,
  updatePassword,
  validateLogin,
} from "../services/userStore.js";
import {
  createResetCode,
  verifyResetCode,
  consumeVerifiedReset,
} from "../services/resetTokenStore.js";

const router = Router();

const passwordMeetsRequirements = (password) =>
  password.length >= 8 &&
  /[A-Z]/.test(password) &&
  /[0-9]/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};

  if (!email?.trim() || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const result = validateLogin(email, password);
  if (!result.valid) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  return res.json({ valid: true, role: result.role });
});

router.post("/forgot-password/request", (req, res) => {
  const { identifier } = req.body || {};

  if (!identifier?.trim()) {
    return res.status(400).json({ error: "Email or username is required." });
  }

  if (!accountExists(identifier)) {
    return res.status(404).json({ error: "No account was found with that email or username." });
  }

  const code = createResetCode(identifier);
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    console.log(`[password-reset] Code for ${identifier.trim()}: ${code}`);
  }

  return res.json({
    success: true,
    message: "Verification code sent.",
    ...(isDev ? { devCode: code } : {}),
  });
});

router.post("/forgot-password/verify", (req, res) => {
  const { identifier, code } = req.body || {};

  if (!identifier?.trim() || !code?.trim()) {
    return res.status(400).json({ error: "Identifier and verification code are required." });
  }

  const result = verifyResetCode(identifier, code);
  if (!result.valid) {
    return res.status(400).json({ error: result.reason });
  }

  return res.json({ valid: true });
});

router.post("/forgot-password/reset", (req, res) => {
  const { identifier, newPassword } = req.body || {};

  if (!identifier?.trim() || !newPassword) {
    return res.status(400).json({ error: "Identifier and new password are required." });
  }

  if (!passwordMeetsRequirements(newPassword)) {
    return res.status(400).json({ error: "Password does not meet security requirements." });
  }

  if (!consumeVerifiedReset(identifier)) {
    return res.status(400).json({
      error: "Reset session expired or not verified. Please start over.",
    });
  }

  const updated = updatePassword(identifier, newPassword);
  if (!updated) {
    return res.status(404).json({ error: "Account not found." });
  }

  return res.json({
    success: true,
    role: getUserRole(identifier),
    message: "Password updated successfully.",
  });
});

export default router;
