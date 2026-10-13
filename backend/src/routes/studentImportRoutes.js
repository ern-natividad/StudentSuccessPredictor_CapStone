import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  importStudentAccountsHandler,
  previewStudentAccounts,
} from "../controllers/studentImportController.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));
router.post("/preview", asyncHandler(previewStudentAccounts));
router.post("/", asyncHandler(importStudentAccountsHandler));

export default router;
