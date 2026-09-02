import { Router } from "express";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import {
  login,
  verifyMfaLogin,
  logoutHandler,
  sessionTimeoutHandler,
  signup,
  me,
  updateProfile,
  changePassword,
  forgotPasswordRequest,
  verifyForgotPasswordCode,
  forgotPasswordReset,
  getManageableUsers,
  deleteUserAccount,
  addStudentGrade,
} from "../controllers/authController.js";

const router = Router();

router.get("/users", requireAuth, requireRole("admin", "staff", "student"), getManageableUsers);
router.delete("/users/:id", requireAuth, requireRole("admin"), deleteUserAccount);
router.post("/users/:id/grades", requireAuth, requireRole("admin", "staff"), addStudentGrade);

router.post("/login", authRateLimiter, login);
router.post("/login/verify-mfa", authRateLimiter, verifyMfaLogin);
router.get("/me", requireAuth, me);
router.patch("/profile", requireAuth, updateProfile);
router.post("/change-password", requireAuth, authRateLimiter, changePassword);
router.post("/logout", requireAuth, logoutHandler);
router.post("/session-timeout", requireAuth, sessionTimeoutHandler);
router.post("/signup", signup);

// Password recovery endpoints using 6-digit OTP
router.post("/forgot-password/request", authRateLimiter, forgotPasswordRequest);
router.post(
  "/forgot-password/verify",
  authRateLimiter,
  verifyForgotPasswordCode,
);
router.post("/forgot-password/reset", authRateLimiter, forgotPasswordReset);

export default router;
