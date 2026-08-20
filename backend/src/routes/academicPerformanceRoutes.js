import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getPerformanceForecasts,
  syncPerformanceForecasts,
} from "../controllers/academicPerformanceController.js";

const router = Router();

router.get(
  "/forecasts",
  requireAuth,
  requireRole("admin", "staff"),
  asyncHandler(getPerformanceForecasts),
);

router.post(
  "/sync",
  requireAuth,
  requireRole("admin", "staff"),
  asyncHandler(syncPerformanceForecasts),
);

export default router;
