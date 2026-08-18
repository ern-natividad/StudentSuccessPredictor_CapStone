import { asyncHandler } from "../utils/asyncHandler.js";
import { generateProgramRecommendations } from "../services/recommendationEngine.js";
import { generatePreEnrollmentSchedule } from "../services/preEnrollmentService.js";
import {
  validatePreEnrollmentPayload,
  validateProgramRecommendationPayload,
} from "../validators/recommendationValidators.js";

/**
 * POST /api/v1/recommendations/program
 * Computes ranked degree program recommendations for an applicant profile.
 */
export const recommendProgram = asyncHandler(async (req, res) => {
  const applicant = validateProgramRecommendationPayload(req.body);
  const result = generateProgramRecommendations(applicant);

  res.status(200).json(result);
});

/**
 * POST /api/v1/recommendations/pre-enrollment
 * Suggests eligible first-year first-semester courses for enrollment planning.
 */
export const recommendPreEnrollment = asyncHandler(async (req, res) => {
  const payload = validatePreEnrollmentPayload(req.body);
  const result = await generatePreEnrollmentSchedule(payload);

  res.status(200).json(result);
});
