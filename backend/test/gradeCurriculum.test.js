import test from "node:test";
import assert from "node:assert/strict";
import { resolveEligibleCurriculumCourses } from "../src/services/gradeCurriculumService.js";

const profile = {
  program: "BS Computer Engineering",
  year_level: "2nd Year",
};

const curricula = [
  {
    program: "BS Computer Engineering",
    academic_year: "2025-2026",
    courses: [
      {
        code: "CPE 201",
        title: "Digital Logic Design",
        yearLevel: "2Y",
        semester: "1S",
      },
      {
        code: "CPE 202",
        title: "Data Structures",
        yearLevel: "2Y",
        semester: "2S",
      },
      {
        code: "CPE 101",
        title: "Intro to Computer Engineering",
        yearLevel: "1Y",
        semester: "1S",
      },
    ],
  },
  {
    program: "BS Electrical Engineering",
    academic_year: "2025-2026",
    courses: [
      {
        code: "CPE 201",
        title: "Different Program Course",
        yearLevel: "2Y",
        semester: "1S",
      },
    ],
  },
  {
    program: "BS Computer Engineering",
    academic_year: "2024-2025",
    courses: [
      {
        code: "CPE 205",
        title: "Older Cohort Course",
        yearLevel: "2Y",
        semester: "1S",
      },
    ],
  },
];

test("resolves subjects by assigned program and year level, not curriculum academic year", () => {
  const courses = resolveEligibleCurriculumCourses(
    profile,
    curricula,
    "2030-2031",
    "1",
  );

  assert.deepEqual(courses, [
    {
      code: "CPE 201",
      title: "Digital Logic Design",
      yearLevel: "2Y",
      semester: "1",
    },
    {
      code: "CPE 205",
      title: "Older Cohort Course",
      yearLevel: "2Y",
      semester: "1",
    },
  ]);
});

test("filters program curriculum subjects by semester", () => {
  assert.deepEqual(
    resolveEligibleCurriculumCourses(
      profile,
      curricula,
      "2026-2027",
      "S",
    ),
    [],
  );
});

test("supports the explicit cohort selected during a historical grade import", () => {
  const courses = resolveEligibleCurriculumCourses(
    profile,
    curricula,
    "2025-2026",
    "1",
    2024,
  );

  assert.deepEqual(courses, [
    {
      code: "CPE 201",
      title: "Digital Logic Design",
      yearLevel: "2Y",
      semester: "1",
    },
    {
      code: "CPE 205",
      title: "Older Cohort Course",
      yearLevel: "2Y",
      semester: "1",
    },
  ]);
});
