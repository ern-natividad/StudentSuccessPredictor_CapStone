import test from "node:test";
import assert from "node:assert/strict";
import { buildCurriculumAppraisalSections } from "../src/utils/curriculumAppraisalUtils.js";

test("appraisal sections include third- and fourth-year summer courses", () => {
  const sections = buildCurriculumAppraisalSections(
    [
      {
        code: "CE 301",
        title: "Summer Design",
        yearLevel: "3Y",
        semester: "Summer",
        units: 3,
      },
      {
        code: "CE 401",
        title: "Summer Project",
        yearLevel: "4Y",
        semester: "Summer",
        units: 2,
      },
    ],
    { includeEmpty: false },
  );

  assert.deepEqual(
    sections.map(({ key, semesterLabel, courses }) => ({
      key,
      semesterLabel,
      courseCodes: courses.map((course) => course.code),
    })),
    [
      {
        key: "3Y::Summer",
        semesterLabel: "Summer",
        courseCodes: ["CE 301"],
      },
      {
        key: "4Y::Summer",
        semesterLabel: "Summer",
        courseCodes: ["CE 401"],
      },
    ],
  );
});
