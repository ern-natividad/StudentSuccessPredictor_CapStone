import { Router } from "express";
import authRoutes from "./authRoutes.js";
import mfaRoutes from "./mfaRoutes.js";
import auditRoutes from "./auditRoutes.js";
import gradeRoutes from "./gradeRoutes.js";
import predictionRoutes from "./predictionRoutes.js";
import recommendationRoutes from "./recommendationRoutes.js";

const router = Router();

router.use('/auth', authRoutes);
router.use('/mfa', mfaRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/grades', gradeRoutes);
router.use('/predictions', predictionRoutes);
router.use('/v1/recommendations', recommendationRoutes);

export default router;
