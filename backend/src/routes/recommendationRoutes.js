import { Router } from "express";
import {
  optionalAuth,
  requireAuth,
  requireRole,
} from "../middleware/authMiddleware.js";
import { recommendationRateLimiter } from "../middleware/rateLimiter.js";
import { HttpError } from "../middleware/errorHandler.js";
import {
  recommendPreEnrollment,
  recommendProgram,
  getProgramRecommendationHistory,
  getNextProgramApplicantId,
} from "../controllers/recommendationController.js";

const router = Router();

/**
 * RBAC mapping (JWT roles -> specification roles):
 * - admin  -> Admin
 * - staff  -> Adviser
 * - student -> Student
 */
const AUTHORIZED_ROLES = ["admin", "staff", "student"];
const authorizeOptionalRole = (req, res, next) => {
  if (!req.user || AUTHORIZED_ROLES.includes(req.user.role)) return next();
  return next(new HttpError(403, "You do not have access to this resource."));
};

router.get(
  "/next-applicant-id",
  recommendationRateLimiter,
  getNextProgramApplicantId,
);

router.get(
  "/history",
  requireAuth,
  requireRole("admin"),
  getProgramRecommendationHistory,
);

router.post(
  "/program",
  recommendationRateLimiter,
  optionalAuth,
  authorizeOptionalRole,
  recommendProgram,
);

router.post(
  "/pre-enrollment",
  requireAuth,
  requireRole(...AUTHORIZED_ROLES),
  recommendPreEnrollment,
);

export default router;
