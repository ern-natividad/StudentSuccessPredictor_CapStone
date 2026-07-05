import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import { startMfaSetup, confirmMfa, removeMfa } from "../controllers/mfaController.js";

const router = Router();

router.post("/setup/start", requireAuth, authRateLimiter, startMfaSetup);
router.post("/setup/confirm", requireAuth, authRateLimiter, confirmMfa);
router.post("/disable", requireAuth, authRateLimiter, removeMfa);

export default router;
