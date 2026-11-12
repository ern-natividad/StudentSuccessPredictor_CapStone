import test from "node:test";
import assert from "node:assert/strict";

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
process.env.JWT_SECRET = "jwt-secret";

test("acknowledging a pending intervention succeeds and records the event", async () => {
  const [{ supabase }, { acknowledgeIntervention }] = await Promise.all([
    import("../src/config/supabaseClient.js"),
    import("../src/controllers/alertController.js"),
  ]);
  const originalFrom = supabase.from;
  const pendingIntervention = {
    id: "intervention-1",
    student_user_id: "student-1",
    status: "pending_admin",
  };
  const recordedEvents = [];

  supabase.from = (table) => ({
    select() {
      return this;
    },
    eq() {
      return this;
    },
    update() {
      return this;
    },
    insert(row) {
      recordedEvents.push(row);
      return Promise.resolve({ error: null });
    },
    maybeSingle: async () => ({
      data:
        table === "alert_interventions"
          ? pendingIntervention
          : { risk_level: "Medium" },
      error: null,
    }),
    order: async () => ({ data: [], error: null }),
    single: async () => ({
      data: { ...pendingIntervention, status: "acknowledged" },
      error: null,
    }),
  });

  try {
    let responseStatus;
    let responseBody;
    const response = {
      status(status) {
        responseStatus = status;
        return this;
      },
      json(body) {
        responseBody = body;
        return this;
      },
    };

    await acknowledgeIntervention(
      { params: { id: pendingIntervention.id }, user: { sub: "admin-1" } },
      response,
    );

    assert.equal(responseStatus, 200);
    assert.equal(responseBody.intervention.status, "acknowledged");
    assert.equal(recordedEvents.length, 1);
    assert.equal(recordedEvents[0].event_type, "acknowledged");
  } finally {
    supabase.from = originalFrom;
  }
});
