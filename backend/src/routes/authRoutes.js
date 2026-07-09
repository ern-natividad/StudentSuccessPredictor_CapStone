import { Router } from "express";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  login,
  verifyMfaLogin,
  logoutHandler,
  sessionTimeoutHandler,
  signup,
  me,
  forgotPasswordRequest,
  verifyForgotPasswordCode,
  forgotPasswordReset,
} from "../controllers/authController.js";

const router = Router();

router.post("/login", authRateLimiter, login);
router.post("/login/verify-mfa", authRateLimiter, verifyMfaLogin);
router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logoutHandler);
router.post("/session-timeout", requireAuth, sessionTimeoutHandler);
router.post('/signup', signup);

// Password recovery endpoints using 6-digit OTP
router.post("/forgot-password/request", authRateLimiter, forgotPasswordRequest);
router.post("/forgot-password/verify", authRateLimiter, verifyForgotPasswordCode);
router.post("/forgot-password/reset", authRateLimiter, forgotPasswordReset);

export default router;