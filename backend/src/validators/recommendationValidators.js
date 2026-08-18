import { HttpError } from "../middleware/errorHandler.js";
import { VALID_STRANDS } from "../data/engineeringPrograms.js";

const requireString = (value, fieldName, { minLength = 1, maxLength = 200 } = {}) => {
  const trimmed = String(value ?? "").trim();
  if (trimmed.length < minLength || trimmed.length > maxLength) {
    throw new HttpError(400, `${fieldName} is required.`);
  }
  return trimmed;
};

const requireScore = (value, fieldName) => {
  const score = Number(value);
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new HttpError(400, `${fieldName} must be a number from 0 to 100.`);
  }
  return score;
};

const requireGwa = (value) => {
  const gwa = Number(value);
  if (!Number.isFinite(gwa) || gwa < 0 || gwa > 100) {
    throw new HttpError(400, "gwa must be a number from 0 to 100.");
  }
  return gwa;
};

export const validateProgramRecommendationPayload = (body = {}) => {
  const applicantId = requireString(body.applicantId, "applicantId");
  const fullName = requireString(body.fullName, "fullName", { maxLength: 120 });
  const strand = requireString(body.strand, "strand").toUpperCase();

  if (!VALID_STRANDS.includes(strand)) {
    throw new HttpError(400, `strand must be one of: ${VALID_STRANDS.join(", ")}.`);
  }

  const cetScores = body.cetScores || {};
  const parsedCet = {
    math: requireScore(cetScores.math, "cetScores.math"),
    science: requireScore(cetScores.science, "cetScores.science"),
    english: requireScore(cetScores.english, "cetScores.english"),
    reading: requireScore(cetScores.reading, "cetScores.reading"),
    abstract: requireScore(cetScores.abstract, "cetScores.abstract"),
  };

  const nonAcademic = body.nonAcademic || {};

  return {
    applicantId,
    fullName,
    strand,
    gwa: requireGwa(body.gwa),
    cetScores: parsedCet,
    eatScore: requireScore(body.eatScore, "eatScore"),
    screeningScore: requireScore(body.screeningScore, "screeningScore"),
    nonAcademic: {
      extracurriculars: String(nonAcademic.extracurriculars || "").trim(),
      leadershipRole: String(nonAcademic.leadershipRole || "").trim(),
      socioeconomicCategory: String(nonAcademic.socioeconomicCategory || "").trim(),
      specialSkills: String(nonAcademic.specialSkills || "").trim(),
    },
  };
};

export const validatePreEnrollmentPayload = (body = {}) => {
  const applicantId = requireString(body.applicantId, "applicantId");
  const programId = requireString(body.programId, "programId", { maxLength: 80 });

  const maxUnitsAllowed = Number(body.maxUnitsAllowed ?? 21);
  if (!Number.isFinite(maxUnitsAllowed) || maxUnitsAllowed < 1 || maxUnitsAllowed > 30) {
    throw new HttpError(400, "maxUnitsAllowed must be a number from 1 to 30.");
  }

  const completedCourses = Array.isArray(body.completedCourses)
    ? body.completedCourses.map((course) => String(course).trim().toUpperCase()).filter(Boolean)
    : [];

  return {
    applicantId,
    programId,
    maxUnitsAllowed,
    completedCourses,
  };
};
