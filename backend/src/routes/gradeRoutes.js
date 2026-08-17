import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createStudentGrade,
  deleteStudentGrade,
  getStudentGrades,
  getMyGrades,
  updateStudentGrade,
} from "../controllers/gradeController.js";

const router = Router();

router.get("/me", requireAuth, asyncHandler(getMyGrades));
router.get("/:userId", requireAuth, asyncHandler(getStudentGrades));
router.post("/", requireAuth, requireRole("admin", "staff"), asyncHandler(createStudentGrade));
router.put("/:id", requireAuth, requireRole("admin", "staff"), asyncHandler(updateStudentGrade));
router.delete("/:id", requireAuth, requireRole("admin", "staff"), asyncHandler(deleteStudentGrade));

export default router;
