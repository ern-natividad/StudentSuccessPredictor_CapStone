import test from "node:test";
import assert from "node:assert/strict";

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
process.env.JWT_SECRET = "jwt-secret";
process.env.BREVO_API_KEY = "brevo-api-key";
process.env.BREVO_SENDER_EMAIL = "sender@example.com";

test("buildPasswordResetProfilePayload creates a profile payload from auth metadata", async () => {
  const { buildPasswordResetProfilePayload } =
    await import("../src/services/authService.js");

  const authUser = {
    id: "11111111-1111-1111-1111-111111111111",
    email: "student@example.com",
    user_metadata: {
      full_name: "Ada Lovelace",
      role: "student",
    },
  };

  const payload = buildPasswordResetProfilePayload(authUser, "hashed-password");

  assert.equal(payload.id, authUser.id);
  assert.equal(payload.email, "student@example.com");
  assert.equal(payload.password_hash, "hashed-password");
  assert.equal(payload.full_name, "Ada Lovelace");
  assert.equal(payload.role, "student");
});

test("password cannot be reset without an active verified email challenge", async () => {
  const [{ supabase }, { completePasswordReset }] = await Promise.all([
    import("../src/config/supabaseClient.js"),
    import("../src/services/authService.js"),
  ]);
  const originalRpc = supabase.rpc;
  supabase.rpc = async () => ({ data: false, error: null });

  try {
    await assert.rejects(
      completePasswordReset(
        "student-1",
        "NewPassword1!",
        {},
        "student@example.com",
      ),
      /verify your email code/,
    );
    await assert.rejects(
      completePasswordReset("student-1", "NewPassword1!"),
      /Email address is required/,
    );
  } finally {
    supabase.rpc = originalRpc;
  }
});

test("password reset request does not reveal whether an email is registered", async () => {
  const [{ supabase }, { initiatePasswordReset }] = await Promise.all([
    import("../src/config/supabaseClient.js"),
    import("../src/services/authService.js"),
  ]);
  const originalFrom = supabase.from;
  const originalListUsers = supabase.auth.admin.listUsers;

  supabase.from = () => ({
    select() {
      return this;
    },
    eq() {
      return this;
    },
    maybeSingle: async () => ({ data: null, error: null }),
  });
  supabase.auth.admin.listUsers = async () => ({
    data: { users: [] },
    error: null,
  });

  try {
    const response = await initiatePasswordReset("unknown@example.com");
    assert.deepEqual(response, {
      success: true,
      message:
        "If an account exists for this email, a verification code will be sent.",
    });
    assert.doesNotMatch(response.message, /not found|registered|unknown/i);
  } finally {
    supabase.from = originalFrom;
    supabase.auth.admin.listUsers = originalListUsers;
  }
});

test("password reset verification uses the same error when no challenge exists", async () => {
  const [{ supabase }, { verifyPasswordOtp }] = await Promise.all([
    import("../src/config/supabaseClient.js"),
    import("../src/services/authService.js"),
  ]);
  const originalFrom = supabase.from;
  const originalRpc = supabase.rpc;
  supabase.from = () => ({
    select() {
      return this;
    },
    eq() {
      return this;
    },
    maybeSingle: async () => ({
      data: { id: "student-1", email: "no-challenge@example.com" },
      error: null,
    }),
  });
  supabase.rpc = async () => ({ data: false, error: null });

  try {
    await assert.rejects(
      verifyPasswordOtp("no-challenge@example.com", "123456"),
      (error) =>
        error.status === 400 &&
        error.message ===
          "The verification code is invalid or expired. Please check the code or request a new one.",
    );
  } finally {
    supabase.from = originalFrom;
    supabase.rpc = originalRpc;
  }
});

test("password reset verification delegates the attempt to the shared database", async () => {
  const [{ supabase }, { verifyPasswordOtp }] = await Promise.all([
    import("../src/config/supabaseClient.js"),
    import("../src/services/authService.js"),
  ]);
  const originalFrom = supabase.from;
  const originalRpc = supabase.rpc;
  let rpcCall;
  supabase.from = () => ({
    select() {
      return this;
    },
    eq() {
      return this;
    },
    maybeSingle: async () => ({
      data: { id: "student-1", email: "student@example.com" },
      error: null,
    }),
  });
  supabase.rpc = async (name, params) => {
    rpcCall = { name, params };
    return { data: true, error: null };
  };

  try {
    const result = await verifyPasswordOtp("Student@Example.com", "123456");
    assert.equal(result.userId, "student-1");
    assert.equal(rpcCall.name, "verify_password_reset_challenge");
    assert.equal(rpcCall.params.p_user_id, "student-1");
    assert.equal(rpcCall.params.p_max_attempts, 5);
    assert.match(rpcCall.params.p_email_hash, /^[a-f0-9]{64}$/);
    assert.match(rpcCall.params.p_code_hash, /^[a-f0-9]{64}$/);
    assert.notEqual(rpcCall.params.p_code_hash, "123456");
  } finally {
    supabase.from = originalFrom;
    supabase.rpc = originalRpc;
  }
});
