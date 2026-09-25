import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createStudentGrade,
  createStudentGradesBulk,
  importStudentGrades,
  deleteStudentGrade,
  getStudentGrades,
  getMyGrades,
  updateStudentGrade,
} from "../controllers/gradeController.js";

const router = Router();

router.get("/me", requireAuth, asyncHandler(getMyGrades));
router.post(
  "/bulk",
  requireAuth,
  requireRole("admin", "staff"),
  asyncHandler(createStudentGradesBulk),
);
router.post(
  "/import",
  requireAuth,
  requireRole("admin", "staff"),
  asyncHandler(importStudentGrades),
);
router.get("/:userId", requireAuth, asyncHandler(getStudentGrades));
router.post("/", requireAuth, requireRole("admin", "staff"), asyncHandler(createStudentGrade));
router.put("/:id", requireAuth, requireRole("admin", "staff"), asyncHandler(updateStudentGrade));
router.delete("/:id", requireAuth, requireRole("admin", "staff"), asyncHandler(deleteStudentGrade));

export default router;
