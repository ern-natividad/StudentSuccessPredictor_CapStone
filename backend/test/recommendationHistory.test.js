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
