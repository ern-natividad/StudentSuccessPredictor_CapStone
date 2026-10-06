import test from "node:test";
import assert from "node:assert/strict";
import {
  hasDuplicateCourseScope,
  normalizeCoursePayload,
  normalizeCourseScopes,
} from "../src/utils/courseCatalog.js";

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
process.env.JWT_SECRET = "jwt-secret";
process.env.GEMINI_API_KEY = "gemini-api-key";
process.env.BREVO_API_KEY = "brevo-api-key";
process.env.BREVO_SENDER_EMAIL = "sender@example.com";

const programId = "11111111-1111-4111-8111-111111111111";

test("normalizes course fields and validates required fields and units", () => {
  const course = normalizeCoursePayload({
    code: "  CE   101 ",
    title: "  Intro to Civil Engineering ",
    units: "3",
    prerequisites: "  MATH 101 ",
  });
  assert.deepEqual(course, {
    code: "CE 101",
    title: "Intro to Civil Engineering",
    units: 3,
    lec: 0,
    lab: 0,
    type: "Professional",
    prerequisites: "MATH 101",
    description: "",
  });
  assert.equal(
    normalizeCoursePayload({ code: "", title: "Course without a code" }).code,
    "",
  );
  assert.throws(
    () => normalizeCoursePayload({ code: "CE 101" }),
    /title is required/,
  );
  assert.throws(
    () => normalizeCoursePayload({ code: "CE 101", title: "Math", units: -1 }),
    /non-negative/,
  );
});

test("normalizes and deduplicates shared, department, and program scopes", () => {
  const scopes = normalizeCourseScopes([
    { type: "department", department: "  Engineering " },
    { type: "department", department: "engineering" },
    { type: "program", programId },
  ]);

  assert.deepEqual(scopes, [
    { scope_type: "department", department: "Engineering", program_id: null },
    { scope_type: "program", department: null, program_id: programId },
  ]);
  assert.throws(() => normalizeCourseScopes([]), /scope is required/);
  assert.throws(
    () => normalizeCourseScopes([{ type: "program", programId: "bad" }]),
    /valid program/,
  );
});

test("detects duplicate codes only when the applicability scope overlaps exactly", () => {
  const entries = [
    {
      id: "course-1",
      code: "CE 101",
      course_catalog_scopes: [{ scope_type: "program", program_id: programId }],
    },
  ];

  assert.equal(
    hasDuplicateCourseScope(entries, " ce 101 ", [
      { scope_type: "program", program_id: programId },
    ]),
    true,
  );
  assert.equal(
    hasDuplicateCourseScope(entries, "CE 101", [
      { scope_type: "shared", department: null, program_id: null },
    ]),
    false,
  );
  assert.equal(
    hasDuplicateCourseScope(
      entries,
      "CE 101",
      [{ scope_type: "program", program_id: programId }],
      "Intro to Civil Engineering",
      "course-1",
    ),
    false,
  );
});

test("allows different blank-code courses in one scope and detects duplicate titles", () => {
  const entries = [
    {
      id: "course-1",
      code: "",
      title: "Elective Course A",
      course_catalog_scopes: [{ scope_type: "shared" }],
    },
  ];
  const sharedScope = [
    { scope_type: "shared", department: null, program_id: null },
  ];

  assert.equal(
    hasDuplicateCourseScope(entries, "", sharedScope, "Elective Course B"),
    false,
  );
  assert.equal(
    hasDuplicateCourseScope(entries, "", sharedScope, "Elective Course A"),
    true,
  );
});

test("course catalog routes reject unauthenticated reads and non-admin writes", async (t) => {
  const [
    { default: express },
    { default: courseCatalogRoutes },
    { signToken },
  ] = await Promise.all([
    import("express"),
    import("../src/routes/courseCatalogRoutes.js"),
    import("../src/utils/jwt.js"),
  ]);
  const app = express();
  app.use(express.json());
  app.use("/course-catalog", courseCatalogRoutes);
  app.use((error, _req, res, _next) =>
    res.status(error.status || 500).json({ error: error.message }),
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(
    () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  );

  const address = server.address();
  const unauthenticated = await fetch(
    `http://127.0.0.1:${address.port}/course-catalog`,
  );
  assert.equal(unauthenticated.status, 401);

  const studentToken = signToken({ sub: "student-1", role: "student" });
  const forbiddenWrite = await fetch(
    `http://127.0.0.1:${address.port}/course-catalog`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${studentToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code: "CE 101", title: "Engineering" }),
    },
  );
  assert.equal(forbiddenWrite.status, 403);

  const forbiddenUpdate = await fetch(
    `http://127.0.0.1:${address.port}/course-catalog/course-1`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${studentToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    },
  );
  assert.equal(forbiddenUpdate.status, 403);

  const forbiddenArchive = await fetch(
    `http://127.0.0.1:${address.port}/course-catalog/course-1`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${studentToken}` },
    },
  );
  assert.equal(forbiddenArchive.status, 403);
});
