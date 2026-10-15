import test from "node:test";
import assert from "node:assert/strict";
import {
  computeCompositeScore,
  computeOverallCet,
  generateProgramRecommendations,
} from "../src/services/recommendationEngine.js";
import { ENGINEERING_PROGRAMS } from "../src/data/engineeringPrograms.js";

const applicant = ({ cetScore, eatScore = 80 } = {}) => ({
  applicantId: "APP-001",
  fullName: "Test Applicant",
  gwa: 90,
  strand: "STEM",
  cetScores: {
    math: cetScore,
    science: cetScore,
    english: cetScore,
    reading: cetScore,
    abstract: cetScore,
  },
  eatScore,
  screeningScore: 80,
  nonAcademic: {},
});

test("uses the average CET component score for overall CET-OAPR eligibility", () => {
  assert.equal(
    computeOverallCet({
      math: 90,
      science: 80,
      english: 70,
      reading: 60,
      abstract: 100,
    }),
    80,
  );
});

test("calculates composite ranking with the program weight proportions", () => {
  const weights = { eat: 30, math: 25, science: 25, abstract: 20 };
  assert.equal(
    computeCompositeScore(
      { math: 80, science: 60, abstract: 100 },
      90,
      weights,
    ),
    82,
  );
});

test("uses the supplied program-specific CET-OAPR thresholds", () => {
  const result = generateProgramRecommendations(applicant({ cetScore: 90 }));
  const civil = result.evaluations.find((program) => program.programId === "BSCE");
  const mechanical = result.evaluations.find(
    (program) => program.programId === "BSME",
  );

  assert.equal(civil.minimumCetOapr, 90);
  assert.equal(civil.eligible, true);
  assert.equal(mechanical.minimumCetOapr, 80);
  assert.equal(mechanical.eligible, true);
});

test("assigns the configured CET-OAPR minimum to every supported program", () => {
  const thresholds = Object.fromEntries(
    ENGINEERING_PROGRAMS.map(({ id, minimumCetOapr }) => [id, minimumCetOapr]),
  );

  assert.deepEqual(thresholds, {
    BSCE: 90,
    BSEE: 75,
    BSCPE: 70,
    BSIE: 70,
    BSME: 80,
    BSECE: 70,
    BSABE: 65,
    BSGE: 75,
    BSSE: 65,
    BSEnE: 65,
  });
});

test("keeps applicants below all thresholds out of recommendations", () => {
  const result = generateProgramRecommendations(applicant({ cetScore: 64 }));

  assert.equal(result.programs.length, 0);
  assert.equal(result.recommendedProgram, null);
  assert.ok(result.evaluations.every((program) => !program.eligible));
});

test("contains all programs from the engineering program catalog", () => {
  const result = generateProgramRecommendations(applicant({ cetScore: 100 }));
  assert.equal(result.evaluations.length, ENGINEERING_PROGRAMS.length);
  assert.equal(result.evaluations.length, 10);
});
