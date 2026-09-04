import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createProgram,
  deleteProgram,
  listPrograms,
  updateProgram,
} from "../controllers/programController.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(listPrograms));
router.post("/", requireAuth, requireRole("admin"), asyncHandler(createProgram));
router.put("/:id", requireAuth, requireRole("admin"), asyncHandler(updateProgram));
router.delete("/:id", requireAuth, requireRole("admin"), asyncHandler(deleteProgram));

export default router;
