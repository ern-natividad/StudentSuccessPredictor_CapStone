import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  acknowledgeIntervention,
  cancelIntervention,
  escalateAlert,
  listAdminNotifications,
  listInterventions,
  markAdminNotificationsRead,
  reopenIntervention,
  revertInterventionToAcknowledged,
  updateInterventionProgress,
} from "../controllers/alertController.js";

const router = Router();

router.get(
  "/interventions",
  requireAuth,
  requireRole("admin", "staff"),
  asyncHandler(listInterventions),
);

router.post(
  "/escalate",
  requireAuth,
  requireRole("admin", "staff"),
  asyncHandler(escalateAlert),
);

router.get(
  "/notifications",
  requireAuth,
  requireRole("admin"),
  asyncHandler(listAdminNotifications),
);

router.post(
  "/notifications/mark-read",
  requireAuth,
  requireRole("admin"),
  asyncHandler(markAdminNotificationsRead),
);

router.post(
  "/:id/acknowledge",
  requireAuth,
  requireRole("admin"),
  asyncHandler(acknowledgeIntervention),
);

router.post(
  "/:id/cancel",
  requireAuth,
  requireRole("admin", "staff"),
  asyncHandler(cancelIntervention),
);

router.post(
  "/:id/reopen",
  requireAuth,
  requireRole("admin", "staff"),
  asyncHandler(reopenIntervention),
);

router.post(
  "/:id/revert-acknowledged",
  requireAuth,
  requireRole("admin", "staff"),
  asyncHandler(revertInterventionToAcknowledged),
);

router.patch(
  "/:id/progress",
  requireAuth,
  requireRole("admin", "staff"),
  asyncHandler(updateInterventionProgress),
);

export default router;
