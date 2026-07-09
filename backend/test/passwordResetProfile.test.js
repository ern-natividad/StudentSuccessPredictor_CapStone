import test from "node:test";
import assert from "node:assert/strict";

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
process.env.JWT_SECRET = "jwt-secret";
process.env.SMTP_USER = "smtp-user";
process.env.SMTP_PASS = "smtp-pass";

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
