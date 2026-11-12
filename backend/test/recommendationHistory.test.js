import test from "node:test";
import assert from "node:assert/strict";

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
process.env.JWT_SECRET = "jwt-secret";
process.env.BREVO_API_KEY = "brevo-api-key";
process.env.BREVO_SENDER_EMAIL = "sender@example.com";

test("applicant ID lookups preview without reserving or advancing an ID", async () => {
  const [{ supabase }, { getNextApplicantId }] = await Promise.all([
    import("../src/config/supabaseClient.js"),
    import("../src/services/recommendationHistoryService.js"),
  ]);
  const originalRpc = supabase.rpc;
  const calls = [];
  supabase.rpc = async (name) => {
    calls.push(name);
    return { data: "APP-2026-068", error: null };
  };

  try {
    assert.equal(await getNextApplicantId(), "APP-2026-068");
    assert.equal(await getNextApplicantId(), "APP-2026-068");
    assert.deepEqual(calls, [
      "preview_pre_enrollment_applicant_id",
      "preview_pre_enrollment_applicant_id",
    ]);
  } finally {
    supabase.rpc = originalRpc;
  }
});

test("recommendation saves allocate an applicant ID in the atomic database write", async () => {
  const [{ supabase }, { saveProgramRecommendation }] = await Promise.all([
    import("../src/config/supabaseClient.js"),
    import("../src/services/recommendationHistoryService.js"),
  ]);
  const originalRpc = supabase.rpc;
  let call;
  supabase.rpc = async (name, params) => {
    call = { name, params };
    return {
      data: { id: "record-1", applicant_id: "APP-2026-068" },
      error: null,
    };
  };

  try {
    const applicant = { fullName: "Ada Lovelace", applicantId: "" };
    const recommendation = { recommendedProgram: "BS Computer Engineering" };
    const saved = await saveProgramRecommendation({
      applicant,
      recommendation,
      createdBy: null,
    });

    assert.deepEqual(call, {
      name: "create_pre_enrollment_recommendation",
      params: {
        p_applicant: applicant,
        p_created_by: null,
        p_recommendation: recommendation,
      },
    });
    assert.equal(saved.applicant_id, "APP-2026-068");
  } finally {
    supabase.rpc = originalRpc;
  }
});

test("recommendation history deletes only the requested unique record IDs", async () => {
  const [
    { supabase },
    { deleteProgramRecommendationHistoryRecords },
  ] = await Promise.all([
    import("../src/config/supabaseClient.js"),
    import("../src/controllers/recommendationController.js"),
  ]);
  const originalFrom = supabase.from;
  const ids = [
    "11111111-1111-4111-8111-111111111111",
    "22222222-2222-4222-8222-222222222222",
  ];
  let deletedIds;

  supabase.from = (table) => ({
    delete() {
      return this;
    },
    in(column, values) {
      assert.equal(table, "pre_enrollment_recommendations");
      assert.equal(column, "id");
      deletedIds = values;
      return this;
    },
    select() {
      return Promise.resolve({
        data: valuesResult(deletedIds),
        error: null,
      });
    },
  });

  try {
    let responseBody;
    const response = {
      status(status) {
        assert.equal(status, 200);
        return this;
      },
      json(body) {
        responseBody = body;
        return this;
      },
    };

    await deleteProgramRecommendationHistoryRecords(
      { body: { ids: [...ids, ids[0]] } },
      response,
    );

    assert.deepEqual(deletedIds, ids);
    assert.deepEqual(responseBody, {
      deletedCount: 2,
      deletedIds: ids,
    });
  } finally {
    supabase.from = originalFrom;
  }
});

test("recommendation history delete rejects empty or invalid ID lists", async () => {
  const { deleteProgramRecommendationHistoryRecords } = await import(
    "../src/controllers/recommendationController.js"
  );
  const response = {};

  for (const ids of [[], ["not-a-uuid"]]) {
    await assert.rejects(
      deleteProgramRecommendationHistoryRecords({ body: { ids } }, response),
      (error) => error.status === 400,
    );
  }
});

const valuesResult = (ids) => ids.map((id) => ({ id }));
