import test from "node:test";
import assert from "node:assert/strict";
import { findCourseMatches } from "./courseImportUtils.js";

const courses = [
  { code: "BEM 1", title: "Engineering Basics", semester: "1" },
  { code: "BEM 111", title: "Engineering Mechanics", semester: "1" },
  { code: "NSTP 2", title: "NSTP 2", semester: "1" },
  { code: "NSTP 2", title: "NSTP 2", semester: "2" },
];

test("prefers exact course codes over similar code prefixes", () => {
  assert.deepEqual(findCourseMatches("BEM 1", courses), [courses[0]]);
});

test("uses an explicit spreadsheet semester suffix to select a repeated course", () => {
  assert.deepEqual(findCourseMatches("NSTP 2_S2", courses), [courses[3]]);
});

test("keeps an unqualified repeated course ambiguous instead of guessing", () => {
  assert.deepEqual(findCourseMatches("NSTP 2", courses), [
    courses[2],
    courses[3],
  ]);
});

test("uses a paired semester-suffixed column to resolve the unsuffixed course", () => {
  assert.deepEqual(
    findCourseMatches("NSTP 2", courses, ["NSTP 2", "NSTP 2_S2"]),
    [courses[2]],
  );
});
