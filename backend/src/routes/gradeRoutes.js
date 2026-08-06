import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import {
  createStudentGrade,
  deleteStudentGrade,
  getStudentGrades,
  getMyGrades,
  updateStudentGrade,
} from "../controllers/gradeController.js";

const router = Router();

router.get("/me", requireAuth, getMyGrades);
router.get("/:userId", requireAuth, getStudentGrades);
router.post("/", requireAuth, requireRole("admin", "staff"), createStudentGrade);
router.put("/:id", requireAuth, requireRole("admin", "staff"), updateStudentGrade);
router.delete("/:id", requireAuth, requireRole("admin", "staff"), deleteStudentGrade);

export default router;
