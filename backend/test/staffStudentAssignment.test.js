import test from "node:test";
import assert from "node:assert/strict";
import { isStudentAssignedToStaff } from "../src/utils/staffStudentAssignment.js";

const adviser = {
  assigned_section: "A, B",
  year_level: "2",
  program: "Computer Engineering",
};

test("matches assigned section, year level, and program", () => {
  assert.equal(
    isStudentAssignedToStaff(
      {
        section: "2A",
        year_level: "2",
        program: "Computer Engineering",
      },
      adviser,
    ),
    true,
  );
});

test("does not match students outside the assigned section, year, or program", () => {
  for (const student of [
    { section: "2C", year_level: "2", program: "Computer Engineering" },
    { section: "2A", year_level: "3", program: "Computer Engineering" },
    { section: "2A", year_level: "2", program: "Civil Engineering" },
  ]) {
    assert.equal(isStudentAssignedToStaff(student, adviser), false);
  }
});

test("an unassigned adviser cannot access students", () => {
  assert.equal(
    isStudentAssignedToStaff(
      {
        section: "2A",
        year_level: "2",
        program: "Computer Engineering",
      },
      { assigned_section: "Unassigned", year_level: "2" },
    ),
    false,
  );
});
