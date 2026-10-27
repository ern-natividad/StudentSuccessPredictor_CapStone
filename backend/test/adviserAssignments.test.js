import test from "node:test";
import assert from "node:assert/strict";

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
process.env.JWT_SECRET = "jwt-secret";
process.env.GEMINI_API_KEY = "gemini-api-key";
process.env.BREVO_API_KEY = "brevo-api-key";
process.env.BREVO_SENDER_EMAIL = "sender@example.com";

test("adviser assignment writes require an administrator", async (t) => {
  const [
    { default: express },
    { default: adviserAssignmentRoutes },
    { signToken },
  ] = await Promise.all([
    import("express"),
    import("../src/routes/adviserAssignmentRoutes.js"),
    import("../src/utils/jwt.js"),
  ]);
  const app = express();
  app.use(express.json());
  app.use("/adviser-assignments", adviserAssignmentRoutes);
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

  const url = `http://127.0.0.1:${server.address().port}/adviser-assignments`;
  const studentToken = signToken({ sub: "student-1", role: "student" });
  const staffToken = signToken({ sub: "staff-1", role: "staff" });

  const unauthenticated = await fetch(url);
  assert.equal(unauthenticated.status, 401);

  for (const token of [studentToken, staffToken]) {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    assert.equal(response.status, 403);
  }
});

test("adviser assignment writes validate the school-year scope", async (t) => {
  const [
    { default: express },
    { default: adviserAssignmentRoutes },
    { signToken },
  ] = await Promise.all([
    import("express"),
    import("../src/routes/adviserAssignmentRoutes.js"),
    import("../src/utils/jwt.js"),
  ]);
  const app = express();
  app.use(express.json());
  app.use("/adviser-assignments", adviserAssignmentRoutes);
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

  const adminToken = signToken({ sub: "admin-1", role: "admin" });
  const response = await fetch(
    `http://127.0.0.1:${server.address().port}/adviser-assignments`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        adviser_user_id: "staff-1",
        school_year: "2025-2027",
        program: "Computer Engineering",
        year_level: "2nd Year",
        sections: ["2A"],
      }),
    },
  );
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /consecutive YYYY-YYYY/);
});
