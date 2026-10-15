import test from "node:test";
import assert from "node:assert/strict";
import { normalizeGradeValue } from "../src/utils/gradeValueUtils.js";

test("normalizes withdrawal, incomplete, and completed incomplete grades", () => {
  assert.equal(normalizeGradeValue("AW"), "AW");
  assert.equal(normalizeGradeValue("uw"), "UW");
  assert.equal(normalizeGradeValue("INC"), "INC");
  assert.equal(normalizeGradeValue("INC (Completed: 2.75)"), "2.75");
  assert.equal(normalizeGradeValue("inc ( completed: 3.00 )"), "3");
  assert.equal(normalizeGradeValue("INC (Complied: 2.75)"), "2.75");
  assert.equal(normalizeGradeValue("inc ( complied: 3.00 )"), "3");
});

test("rejects unsupported grades and invalid completed incomplete grades", () => {
  assert.equal(normalizeGradeValue("INC (Completed: 4.00)"), null);
  assert.equal(normalizeGradeValue("INC (Completed: pending)"), null);
  assert.equal(normalizeGradeValue("2.1"), null);
  assert.equal(normalizeGradeValue(""), null);
});
