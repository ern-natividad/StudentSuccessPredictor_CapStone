import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createAnnouncement,
  deleteAnnouncement,
  listActiveAnnouncements,
  listAnnouncements,
  updateAnnouncement,
} from "../controllers/announcementController.js";

const router = Router();

router.get("/active", asyncHandler(listActiveAnnouncements));

router.get(
  "/",
  requireAuth,
  requireRole("admin"),
  asyncHandler(listAnnouncements),
);

router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  asyncHandler(createAnnouncement),
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(updateAnnouncement),
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(deleteAnnouncement),
);

export default router;
