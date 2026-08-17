import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getMyPrediction,
  getStudentPrediction,
} from "../controllers/predictionController.js";

const router = Router();

router.get("/me", requireAuth, requireRole("student"), asyncHandler(getMyPrediction));
router.get(
  "/:userId",
  requireAuth,
  requireRole("admin", "staff", "student"),
  asyncHandler(getStudentPrediction),
);

export default router;
