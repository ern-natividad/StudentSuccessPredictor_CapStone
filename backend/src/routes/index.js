import { Router } from "express";
import authRoutes from "./authRoutes.js";
import mfaRoutes from "./mfaRoutes.js";
import auditRoutes from "./auditRoutes.js";

const router = Router();

router.use('/auth', authRoutes);
router.use('/mfa', mfaRoutes);
router.use('/audit-logs', auditRoutes);

export default router;