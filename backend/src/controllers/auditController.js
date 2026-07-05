import { asyncHandler } from "../utils/asyncHandler.js";
import { listAuditLogs } from "../services/auditService.js";

export const getAuditLogs = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const offset = Number(req.query.offset) || 0;
  const logs = await listAuditLogs({ limit, offset });
  return res.status(200).json({ logs });
});
