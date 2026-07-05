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
} from "../controllers/authController.js";

const router = Router();

router.post("/login", authRateLimiter, login);
router.post("/login/verify-mfa", authRateLimiter, verifyMfaLogin);
router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logoutHandler);
router.post("/session-timeout", requireAuth, sessionTimeoutHandler);
router.post('/signup', signup);

export default router;
