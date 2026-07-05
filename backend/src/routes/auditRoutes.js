import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { getAuditLogs } from "../controllers/auditController.js";

const router = Router();

// Admin-only, per spec ("Audit Logs Page (Admin Only)").
router.get("/", requireAuth, requireRole("admin"), getAuditLogs);

export default router;
