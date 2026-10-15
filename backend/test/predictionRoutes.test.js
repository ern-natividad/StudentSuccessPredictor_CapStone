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

test("model evaluation endpoint requires admin and returns the service report", async (t) => {
  const [
    { default: express },
    { default: predictionRoutes },
    { signToken },
  ] = await Promise.all([
    import("express"),
    import("../src/routes/predictionRoutes.js"),
    import("../src/utils/jwt.js"),
  ]);

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

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, options) => {
    if (String(input) === "http://prediction-service.test/model-info") {
      assert.equal(options.headers["X-Prediction-Service-Key"], "prediction-service-secret");
      return new Response(
        JSON.stringify({
          model_version: "test-version",
          selected_model: "Gradient Boosting",
          metrics: { "Gradient Boosting": { mae: 0.18 } },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    return originalFetch(input, options);
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const address = server.address();
  const url = `http://127.0.0.1:${address.port}/predictions/models`;
  const unauthenticated = await originalFetch(url);
  assert.equal(unauthenticated.status, 401);
  const bulkUrl = `http://127.0.0.1:${address.port}/predictions/bulk`;
  const unauthenticatedBulk = await originalFetch(bulkUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_ids: ["student-1"] }),
  });
  assert.equal(unauthenticatedBulk.status, 401);

  const studentToken = signToken({ sub: "student-1", role: "student" });
  const forbidden = await originalFetch(url, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert.equal(forbidden.status, 403);
  const forbiddenBulk = await originalFetch(bulkUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${studentToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_ids: ["student-1"] }),
  });
  assert.equal(forbiddenBulk.status, 403);

  const adminToken = signToken({ sub: "admin-1", role: "admin" });
  const allowed = await originalFetch(url, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(allowed.status, 200);
  assert.equal((await allowed.json()).selected_model, "Gradient Boosting");
});
