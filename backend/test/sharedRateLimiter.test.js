import test from "node:test";
import assert from "node:assert/strict";

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
process.env.JWT_SECRET = "jwt-secret";
process.env.GEMINI_API_KEY = "gemini-api-key";
process.env.BREVO_API_KEY = "brevo-api-key";
process.env.BREVO_SENDER_EMAIL = "sender@example.com";

test("rate limit counters are shared across backend instances", async (t) => {
  const [{ default: express }, { supabase }, { createSharedRateLimiter }] =
    await Promise.all([
      import("express"),
      import("../src/config/supabaseClient.js"),
      import("../src/middleware/rateLimiter.js"),
    ]);
  const originalRpc = supabase.rpc;
  const counts = new Map();
  const calls = [];
  supabase.rpc = async (name, params) => {
    calls.push({ name, params });
    const key = `${params.p_scope}:${params.p_key_hash}`;
    const requestCount = (counts.get(key) || 0) + 1;
    counts.set(key, requestCount);
    return {
      data: [{
        allowed: requestCount <= params.p_max_requests,
        request_count: requestCount,
        reset_at: new Date(Date.now() + params.p_window_ms).toISOString(),
      }],
      error: null,
    };
  };

  const servers = [];
  const urls = [];
  for (let index = 0; index < 2; index += 1) {
    const app = express();
    app.get(
      "/limited",
      createSharedRateLimiter("test-auth", {
        windowMs: 60_000,
        max: 2,
      }),
      (_req, res) => res.status(200).json({ ok: true }),
    );
    const server = app.listen(0, "127.0.0.1");
    servers.push(server);
    await new Promise((resolve) => server.once("listening", resolve));
    urls.push(`http://127.0.0.1:${server.address().port}/limited`);
  }
  t.after(async () => {
    supabase.rpc = originalRpc;
    await Promise.all(
      servers.map(
        (server) =>
          new Promise((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve())),
          ),
      ),
    );
  });

  const first = await fetch(urls[0]);
  const secondInstance = await fetch(urls[1]);
  const blocked = await fetch(urls[0]);

  assert.equal(first.status, 200);
  assert.equal(secondInstance.status, 200);
  assert.equal(blocked.status, 429);
  assert.equal(calls.length, 3);
  assert.ok(calls.every((call) => call.name === "consume_shared_rate_limit"));
  assert.equal(calls[0].params.p_key_hash, calls[1].params.p_key_hash);
  assert.equal(calls[1].params.p_key_hash, calls[2].params.p_key_hash);
});

test("missing shared rate-limit RPC falls back to process-local limiting", async (t) => {
  const [{ default: express }, { supabase }, { createSharedRateLimiter }] =
    await Promise.all([
      import("express"),
      import("../src/config/supabaseClient.js"),
      import("../src/middleware/rateLimiter.js"),
    ]);
  const originalRpc = supabase.rpc;
  let rpcCalls = 0;
  supabase.rpc = async () => {
    rpcCalls += 1;
    return {
      data: null,
      error: {
        code: "PGRST202",
        message: "Could not find the function in the schema cache",
      },
    };
  };

  const app = express();
  app.get(
    "/limited",
    createSharedRateLimiter("test-auth-missing-rpc", {
      windowMs: 60_000,
      max: 2,
    }),
    (_req, res) => res.status(200).json({ ok: true }),
  );
  app.use((error, _req, res, _next) =>
    res.status(error.status || 500).json({ error: error.message }),
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(async () => {
    supabase.rpc = originalRpc;
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  });

  const url = `http://127.0.0.1:${server.address().port}/limited`;
  assert.equal((await fetch(url)).status, 200);
  assert.equal((await fetch(url)).status, 200);
  assert.equal((await fetch(url)).status, 429);
  assert.equal(rpcCalls, 1);
});

test("requests fail closed when shared rate-limit storage is unavailable", async (t) => {
  const [{ default: express }, { supabase }, { createSharedRateLimiter }] =
    await Promise.all([
      import("express"),
      import("../src/config/supabaseClient.js"),
      import("../src/middleware/rateLimiter.js"),
    ]);
  const originalRpc = supabase.rpc;
  supabase.rpc = async () => ({
    data: null,
    error: new Error("database unavailable"),
  });

  const app = express();
  app.get(
    "/limited",
    createSharedRateLimiter("test-auth"),
    (_req, res) => res.status(200).json({ ok: true }),
  );
  app.use((error, _req, res, _next) =>
    res.status(error.status || 500).json({ error: error.message }),
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(async () => {
    supabase.rpc = originalRpc;
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  });

  const response = await fetch(
    `http://127.0.0.1:${server.address().port}/limited`,
  );
  assert.equal(response.status, 503);
  assert.equal(
    (await response.json()).error,
    "Request throttling is temporarily unavailable. Please retry shortly.",
  );
});
