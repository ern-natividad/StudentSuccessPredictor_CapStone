import { Router } from "express";
import {
  archiveCourseCatalogEntry,
  createCourseCatalogEntry,
  listCourseCatalog,
  updateCourseCatalogEntry,
} from "../controllers/courseCatalogController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(listCourseCatalog));
router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  asyncHandler(createCourseCatalogEntry),
);
router.put(
  "/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(updateCourseCatalogEntry),
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(archiveCourseCatalogEntry),
);

export default router;
