import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import {
  recommendPreEnrollment,
  recommendProgram,
} from "../controllers/recommendationController.js";

const router = Router();

/**
 * RBAC mapping (JWT roles -> specification roles):
 * - admin  -> Admin
 * - staff  -> Adviser
 * - student -> Student
 */
const AUTHORIZED_ROLES = ["admin", "staff", "student"];

router.post(
  "/program",
  requireAuth,
  requireRole(...AUTHORIZED_ROLES),
  recommendProgram,
);

router.post(
  "/pre-enrollment",
  requireAuth,
  requireRole(...AUTHORIZED_ROLES),
  recommendPreEnrollment,
);

export default router;
