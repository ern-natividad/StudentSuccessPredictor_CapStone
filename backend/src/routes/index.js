import { Router } from "express";
import authRoutes from "./authRoutes.js";
import mfaRoutes from "./mfaRoutes.js";
import auditRoutes from "./auditRoutes.js";
import gradeRoutes from "./gradeRoutes.js";
import predictionRoutes from "./predictionRoutes.js";
import recommendationRoutes from "./recommendationRoutes.js";
import academicPerformanceRoutes from "./academicPerformanceRoutes.js";
import programRoutes from "./programRoutes.js";
import alertRoutes from "./alertRoutes.js";
import announcementRoutes from "./announcementRoutes.js";

const router = Router();

router.use('/auth', authRoutes);
router.use('/mfa', mfaRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/grades', gradeRoutes);
router.use('/predictions', predictionRoutes);
router.use('/v1/recommendations', recommendationRoutes);
router.use('/academic-performance', academicPerformanceRoutes);
router.use('/programs', programRoutes);
router.use('/alerts', alertRoutes);
router.use('/announcements', announcementRoutes);

export default router;
