import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getAdviserAssignments,
  putAdviserAssignmentGroup,
} from "../controllers/adviserAssignmentController.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  requireRole("admin", "staff"),
  asyncHandler(getAdviserAssignments),
);
router.put(
  "/",
  requireAuth,
  requireRole("admin"),
  asyncHandler(putAdviserAssignmentGroup),
);

export default router;
