import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getPredictionModelInfo,
  generateStudentPythonForecast,
  getMyPrediction,
  getStudentPrediction,
  getStudentPredictionsBulk,
} from "../controllers/predictionController.js";

const router = Router();

router.get(
  "/models",
  requireAuth,
  requireRole("admin"),
  asyncHandler(getPredictionModelInfo),
);
router.get("/me", requireAuth, requireRole("student"), asyncHandler(getMyPrediction));
router.post(
  "/bulk",
  requireAuth,
  requireRole("admin", "staff"),
  asyncHandler(getStudentPredictionsBulk),
);
router.post(
  "/:userId/forecast",
  requireAuth,
  requireRole("admin", "staff"),
  asyncHandler(generateStudentPythonForecast),
);
router.get(
  "/:userId",
  requireAuth,
  requireRole("admin", "staff", "student"),
  asyncHandler(getStudentPrediction),
);

export default router;
