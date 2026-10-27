import test from "node:test";
import assert from "node:assert/strict";

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
process.env.JWT_SECRET = "jwt-secret";
process.env.GEMINI_API_KEY = "gemini-api-key";
process.env.BREVO_API_KEY = "brevo-api-key";
process.env.BREVO_SENDER_EMAIL = "sender@example.com";
process.env.PREDICTION_SERVICE_URL = "http://prediction-service.test";
process.env.PREDICTION_SERVICE_SECRET = "prediction-service-secret";

test("admin can generate a Python-only forecast for one student", async (t) => {
  const [
    { default: express },
    { default: predictionRoutes },
    { signToken },
    { supabase },
  ] = await Promise.all([
    import("express"),
    import("../src/routes/predictionRoutes.js"),
    import("../src/utils/jwt.js"),
    import("../src/config/supabaseClient.js"),
  ]);
  const originalFrom = supabase.from;
  const originalFetch = globalThis.fetch;
  let pythonRequest;
  supabase.from = (table) => {
    assert.equal(table, "users");
    return {
      select() {
        return this;
      },
      eq() {
        return this;
      },
      maybeSingle: async () => ({
        data: {
          id: "student-1",
          full_name: "Test Student",
          role: "student",
        },
        error: null,
      }),
    };
  };
  globalThis.fetch = async (url, options) => {
    pythonRequest = { url: String(url), options };
    return new Response(
      JSON.stringify({
        processed: 1,
        results: [
          {
            user_id: "student-1",
            status: "updated",
            prediction: {
              current_gwa: 2.4,
              predicted_gwa: 2.2,
              selected_model: "Ridge Regression",
              target_school_year: "2026-2027",
              target_semester: "1",
            },
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  t.after(() => {
    supabase.from = originalFrom;
    globalThis.fetch = originalFetch;
  });

  const app = express();
  app.use("/predictions", predictionRoutes);
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
  const response = await originalFetch(
    `http://127.0.0.1:${server.address().port}/predictions/student-1/forecast`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
    },
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.student.id, "student-1");
  assert.equal(body.prediction.predicted_gpa, 2.2);
  assert.equal(body.prediction.selected_model, "Ridge Regression");
  assert.equal(body.prediction.risk_level, "Low");
  assert.equal(pythonRequest.url, "http://prediction-service.test/forecast");
  assert.equal(
    pythonRequest.options.headers["X-Prediction-Service-Key"],
    "prediction-service-secret",
  );
  assert.deepEqual(JSON.parse(pythonRequest.options.body), {
    user_ids: ["student-1"],
  });
});
