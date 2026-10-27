import test from "node:test";
import assert from "node:assert/strict";
import { isStudentAssignedToStaff } from "../src/utils/staffStudentAssignment.js";

const adviserAssignments = [
  {
    school_year: "2025-2026",
    section: "2A",
    year_level: "2nd Year",
    program: "Computer Engineering",
  },
  {
    school_year: "2025-2026",
    section: "2B",
    year_level: "2nd Year",
    program: "Computer Engineering",
  },
  {
    school_year: "2025-2026",
    section: "2C",
    year_level: "2nd Year",
    program: "Computer Engineering",
  },
  {
    school_year: "2025-2026",
    section: "2D",
    year_level: "2nd Year",
    program: "Computer Engineering",
  },
];

const assignedStudent = {
  school_year: "2025-2026",
  section: "2A",
  year_level: "2",
  program: "Computer Engineering",
};

test("matches any assigned section in the same year, program, and school year", () => {
  assert.equal(
    isStudentAssignedToStaff(assignedStudent, adviserAssignments),
    true,
  );
  assert.equal(
    isStudentAssignedToStaff(
      { ...assignedStudent, section: "2D" },
      adviserAssignments,
    ),
    true,
  );
});

test("does not match students outside the assigned scope", () => {
  for (const student of [
    { ...assignedStudent, section: "2E" },
    { ...assignedStudent, year_level: "3" },
    { ...assignedStudent, program: "Civil Engineering" },
    { ...assignedStudent, school_year: "2024-2025" },
    { ...assignedStudent, school_year: null },
  ]) {
    assert.equal(isStudentAssignedToStaff(student, adviserAssignments), false);
  }
});

test("an unassigned adviser cannot access students", () => {
  assert.equal(
    isStudentAssignedToStaff(assignedStudent, []),
    false,
  );
});

test("inactive assignments do not grant student access", () => {
  assert.equal(
    isStudentAssignedToStaff(assignedStudent, [
      { ...adviserAssignments[0], is_active: false },
    ]),
    false,
  );
});
