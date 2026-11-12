import { asyncHandler } from "../utils/asyncHandler.js";
import { generateProgramRecommendations } from "../services/recommendationEngine.js";
import { generatePreEnrollmentSchedule } from "../services/preEnrollmentService.js";
import {
  deleteProgramRecommendationHistory,
  getNextApplicantId,
  listProgramRecommendationHistory,
  saveProgramRecommendation,
} from "../services/recommendationHistoryService.js";
import { HttpError } from "../middleware/errorHandler.js";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  recordAuditLog,
} from "../services/auditService.js";
import { getRequestMeta } from "../utils/requestMeta.js";
import {
  validatePreEnrollmentPayload,
  validateProgramRecommendationPayload,
} from "../validators/recommendationValidators.js";

/** GET /api/v1/recommendations/next-applicant-id */
export const getNextProgramApplicantId = asyncHandler(async (_req, res) => {
  const applicantId = await getNextApplicantId();
  return res.status(200).json({ applicantId });
});

/**
 * POST /api/v1/recommendations/program
 * Computes ranked degree program recommendations for an applicant profile.
 */
export const recommendProgram = asyncHandler(async (req, res) => {
  const applicant = validateProgramRecommendationPayload(req.body);
  const result = generateProgramRecommendations(applicant);
  const record = await saveProgramRecommendation({
    applicant,
    recommendation: result,
    createdBy: req.user?.sub || null,
  });
  await recordAuditLog({
    userId: req.user?.sub || null,
    username: req.user?.email || "Public applicant",
    action: AUDIT_ACTIONS.RECOMMENDATION_GENERATED,
    module: AUDIT_MODULES.PRE_ENROLLMENT,
    description:
      `${req.user ? "Recommendation generated" : "Public recommendation generated"} for ` +
      `${record.applicant_id}: ` +
      `${result.recommendedProgram || "no eligible program"}.`,
    ...getRequestMeta(req),
  });

  res.status(201).json({
    ...result,
    applicantId: record.applicant_id,
    recordId: record.id,
  });
});

/** GET /api/v1/recommendations/history */
export const getProgramRecommendationHistory = asyncHandler(async (req, res) => {
  const requestedLimit = Number(req.query.limit) || 500;
  const limit = Math.max(1, Math.min(requestedLimit, 500));
  const records = await listProgramRecommendationHistory({ limit });
  return res.status(200).json({ records });
});

/** DELETE /api/v1/recommendations/history */
export const deleteProgramRecommendationHistoryRecords = asyncHandler(
  async (req, res) => {
    const { ids } = req.body || {};
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      ids.length > 500 ||
      ids.some((id) => typeof id !== "string" || !uuidPattern.test(id))
    ) {
      throw new HttpError(
        400,
        "Provide between 1 and 500 valid recommendation record IDs.",
      );
    }

    const deletedRecords = await deleteProgramRecommendationHistory([
      ...new Set(ids),
    ]);

    return res.status(200).json({
      deletedCount: deletedRecords.length,
      deletedIds: deletedRecords.map((record) => record.id),
    });
  },
);

/**
 * POST /api/v1/recommendations/pre-enrollment
 * Suggests eligible first-year first-semester courses for enrollment planning.
 */
export const recommendPreEnrollment = asyncHandler(async (req, res) => {
  const payload = validatePreEnrollmentPayload(req.body);
  const result = await generatePreEnrollmentSchedule(payload);

  res.status(200).json(result);
});
