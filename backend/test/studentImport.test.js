import test from "node:test";
import assert from "node:assert/strict";
import { validateStudentImportRows } from "../src/utils/studentImport.js";

const studentRow = (overrides = {}) => ({
  student_id: "STU-2023-001",
  first_name: "Sample",
  last_name: "Student One",
  email: "student001@wmsu.edu.ph",
  department: "Engineering",
  program: "BS Agricultural and Biosystems Engineering",
  section: "DEMO-1A",
  year_level: "4th Year",
  ...overrides,
});

test("normalizes account fields and email casing", () => {
  const result = validateStudentImportRows([
    studentRow({
      first_name: "  Sample   ",
      email: " STUDENT001@wmsu.edu.ph ",
    }),
  ]);

  assert.deepEqual(result.issues, []);
  assert.equal(result.rows[0].first_name, "Sample");
  assert.equal(result.rows[0].email, "student001@wmsu.edu.ph");
  assert.equal("password" in result.rows[0], false);
});

test("reports missing required fields, invalid emails, and malformed year levels", () => {
  const result = validateStudentImportRows([
    studentRow({ student_id: "", email: "not-an-email", year_level: "Senior" }),
  ]);

  assert.equal(result.rows.length, 0);
  assert.deepEqual(result.issues[0].errors, [
    "student_id is required",
    "email must be a valid address",
    "year_level must look like '1st Year'",
  ]);
});

test("rejects every row that shares a student ID or email", () => {
  const result = validateStudentImportRows([
    studentRow(),
    studentRow({ student_id: "stu-2023-001", email: "other@wmsu.edu.ph" }),
    studentRow({ student_id: "STU-2023-003", email: "STUDENT001@wmsu.edu.ph" }),
  ]);

  assert.equal(result.rows.length, 0);
  assert.equal(result.issues.length, 3);
  assert.ok(
    result.issues[0].errors.includes("duplicate student_id in this file"),
  );
  assert.ok(result.issues[2].errors.includes("duplicate email in this file"));
});

test("rejects empty imports and imports larger than the batch limit", () => {
  assert.match(
    validateStudentImportRows([]).issues[0].errors[0],
    /at least one student/,
  );
  assert.match(
    validateStudentImportRows(Array.from({ length: 501 }, studentRow)).issues[0]
      .errors[0],
    /at most 500/,
  );
});

test("student account import preview requires an admin account", async (t) => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  process.env.JWT_SECRET = "jwt-secret";
  process.env.GEMINI_API_KEY = "gemini-api-key";
  process.env.BREVO_API_KEY = "brevo-api-key";
  process.env.BREVO_SENDER_EMAIL = "sender@example.com";

  const [
    { default: express },
    { default: studentImportRoutes },
    { signToken },
  ] = await Promise.all([
    import("express"),
    import("../src/routes/studentImportRoutes.js"),
    import("../src/utils/jwt.js"),
  ]);
  const app = express();
  app.use(express.json());
  app.use("/students/import", studentImportRoutes);
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

  const baseUrl = `http://127.0.0.1:${server.address().port}/students/import/preview`;
  const unauthenticated = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ students: [] }),
  });
  assert.equal(unauthenticated.status, 401);

  const studentToken = signToken({ sub: "student-1", role: "student" });
  const forbidden = await fetch(baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${studentToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ students: [] }),
  });
  assert.equal(forbidden.status, 403);

  const adminToken = signToken({ sub: "admin-1", role: "admin" });
  const allowed = await fetch(baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ students: [] }),
  });
  assert.equal(allowed.status, 200);
});

test("provisions a linked auth user and student profile without returning its password", async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  process.env.JWT_SECRET = "jwt-secret";
  process.env.GEMINI_API_KEY = "gemini-api-key";
  process.env.BREVO_API_KEY = "brevo-api-key";
  process.env.BREVO_SENDER_EMAIL = "sender@example.com";

  const { provisionStudentAccount } =
    await import("../src/services/studentImportService.js");
  const calls = [];
  const fakeSupabase = {
    auth: {
      admin: {
        createUser: async (payload) => {
          calls.push({ table: "auth", payload });
          return {
            data: { user: { id: "generated-user-uuid" } },
            error: null,
          };
        },
        deleteUser: async (id) => {
          calls.push({ table: "auth-delete", id });
          return { error: null };
        },
      },
    },
    from: (table) => ({
      insert: async (payload) => {
        calls.push({ table, payload });
        return { error: null };
      },
      upsert: async (payload, options) => {
        calls.push({ table, payload, options });
        return { error: null };
      },
      delete: () => ({
        eq: async (column, value) => {
          calls.push({ table: `${table}-delete`, column, value });
          return { error: null };
        },
      }),
    }),
  };

  const created = await provisionStudentAccount(studentRow(), {
    supabaseClient: fakeSupabase,
    hashPassword: async (password) => `hashed:${password}`,
    generateTemporaryPassword: () => "PrivateRandomA1!",
  });

  const authCall = calls.find((call) => call.table === "auth");
  const userCall = calls.find((call) => call.table === "users");
  const studentInfoCall = calls.find((call) => call.table === "student_info");
  assert.equal(authCall.payload.password, "PrivateRandomA1!");
  assert.equal(authCall.payload.email_confirm, true);
  assert.equal(userCall.payload.id, "generated-user-uuid");
  assert.equal(userCall.payload.password_hash, "hashed:PrivateRandomA1!");
  assert.equal(studentInfoCall.payload.user_id, "generated-user-uuid");
  assert.deepEqual(studentInfoCall.options, { onConflict: "user_id" });
  assert.deepEqual(created, {
    student_id: "STU-2023-001",
    email: "student001@wmsu.edu.ph",
  });
  assert.equal(JSON.stringify(created).includes("PrivateRandomA1!"), false);
});

test("removes the auth user if saving the student profile fails", async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  process.env.JWT_SECRET = "jwt-secret";
  process.env.GEMINI_API_KEY = "gemini-api-key";
  process.env.BREVO_API_KEY = "brevo-api-key";
  process.env.BREVO_SENDER_EMAIL = "sender@example.com";

  const { provisionStudentAccount } =
    await import("../src/services/studentImportService.js");
  const calls = [];
  const fakeSupabase = {
    auth: {
      admin: {
        createUser: async () => ({
          data: { user: { id: "generated-user-uuid" } },
          error: null,
        }),
        deleteUser: async (id) => {
          calls.push({ table: "auth-delete", id });
          return { error: null };
        },
      },
    },
    from: (table) => ({
      insert: async () => ({
        error: null,
      }),
      upsert: async (_payload, options) => ({
        error:
          table === "student_info" && options.onConflict === "user_id"
            ? new Error("profile upsert failed")
            : null,
      }),
      delete: () => ({
        eq: async (column, value) => {
          calls.push({ table: `${table}-delete`, column, value });
          return { error: null };
        },
      }),
    }),
  };

  await assert.rejects(
    provisionStudentAccount(studentRow(), {
      supabaseClient: fakeSupabase,
      hashPassword: async () => "hashed-password",
      generateTemporaryPassword: () => "PrivateRandomA1!",
    }),
    /profile upsert failed/,
  );
  assert.deepEqual(calls, [
    { table: "users-delete", column: "id", value: "generated-user-uuid" },
    { table: "auth-delete", id: "generated-user-uuid" },
  ]);
});

test("rejects reserved example emails and password or UUID columns", () => {
  const previousValue = process.env.ALLOW_TEST_STUDENT_EMAILS;
  process.env.ALLOW_TEST_STUDENT_EMAILS = "false";
  const result = validateStudentImportRows([
    studentRow({
      email: "student@example.test",
      password: "dont-import-password",
    }),
  ]);

  assert.equal(result.rows.length, 0);
  assert.ok(
    result.issues[0].errors.includes(
      "email must use a reachable inbox, not a reserved example/test domain",
    ),
  );
  assert.ok(
    result.issues[0].errors.includes(
      "do not include password, user_id, or role columns",
    ),
  );
  if (previousValue === undefined) {
    delete process.env.ALLOW_TEST_STUDENT_EMAILS;
  } else {
    process.env.ALLOW_TEST_STUDENT_EMAILS = previousValue;
  }
});

test("allows .test email addresses only when the development flag is enabled", () => {
  const previousValue = process.env.ALLOW_TEST_STUDENT_EMAILS;
  process.env.ALLOW_TEST_STUDENT_EMAILS = "true";
  const allowed = validateStudentImportRows([
    studentRow({ email: "student001@hawkpredict-demo.test" }),
  ]);
  assert.deepEqual(allowed.issues, []);

  process.env.ALLOW_TEST_STUDENT_EMAILS = "false";
  const rejected = validateStudentImportRows([
    studentRow({ email: "student001@hawkpredict-demo.test" }),
  ]);
  assert.ok(
    rejected.issues[0].errors.includes(
      "email must use a reachable inbox, not a reserved example/test domain",
    ),
  );

  if (previousValue === undefined) {
    delete process.env.ALLOW_TEST_STUDENT_EMAILS;
  } else {
    process.env.ALLOW_TEST_STUDENT_EMAILS = previousValue;
  }
});
