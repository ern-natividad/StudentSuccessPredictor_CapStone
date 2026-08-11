import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import {
  getMyPrediction,
  getStudentPrediction,
} from "../controllers/predictionController.js";

const router = Router();

router.get("/me", requireAuth, requireRole("student"), getMyPrediction);
router.get("/:userId", requireAuth, requireRole("admin", "staff", "student"), getStudentPrediction);

export default router;
