import test from "node:test";
import assert from "node:assert/strict";
import { validateProgramRecommendationPayload } from "../src/validators/recommendationValidators.js";

const validPayload = {
  fullName: "Test Applicant",
  strand: "STEM",
  gwa: 90,
  cetScores: {
    math: 80,
    science: 80,
    english: 80,
    reading: 80,
    abstract: 80,
  },
  eatScore: 80,
  screeningScore: 80,
};

test("allows recommendation requests without an applicant ID for database generation", () => {
  const applicant = validateProgramRecommendationPayload(validPayload);
  assert.equal(applicant.applicantId, "");
});

test("preserves an applicant ID supplied by the prefilled form", () => {
  const applicant = validateProgramRecommendationPayload({
    ...validPayload,
    applicantId: "APP-2026-004",
  });
  assert.equal(applicant.applicantId, "APP-2026-004");
});
