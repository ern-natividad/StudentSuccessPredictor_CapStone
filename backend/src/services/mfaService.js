import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { supabase } from "../config/supabaseClient.js";
import { recordAuditLog, AUDIT_ACTIONS, AUDIT_MODULES } from "./auditService.js";

const ISSUER = "HawkPredict";

export const beginMfaSetup = async (user) => {
  const secret = speakeasy.generateSecret({
    name: `${ISSUER} (${user.email})`,
    issuer: ISSUER,
    length: 20,
  });

  await supabase
    .from("users")
    .update({ totp_secret: secret.base32, two_factor_enabled: false })
    .eq("id", user.id);

  const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

  return { qrCodeDataUrl, manualEntryKey: secret.base32 };
};

export const verifyTotpCode = (secretBase32, token) => {
  if (!secretBase32 || !token) return false;
  return speakeasy.totp.verify({
    secret: secretBase32,
    encoding: "base32",
    token: String(token),
    window: 1, // tolerate +/- one 30s time-step of clock drift
  });
};

export const confirmMfaSetup = async (user, token) => {
  const isValid = verifyTotpCode(user.totp_secret, token);
  if (!isValid) return false;

  await supabase.from("users").update({ two_factor_enabled: true }).eq("id", user.id);

  await recordAuditLog({
    userId: user.id,
    username: user.email,
    action: AUDIT_ACTIONS.MFA_ENABLED,
    module: AUDIT_MODULES.AUTH,
    description: "Two-factor authentication enabled via Google Authenticator.",
  });

  return true;
};

export const disableMfa = async (user, token) => {
  if (!user.two_factor_enabled) {
    return false;
  }

  const isValid = verifyTotpCode(user.totp_secret, token);
  if (!isValid) {
    return false;
  }

  await supabase
    .from("users")
    .update({ two_factor_enabled: false, totp_secret: null })
    .eq("id", user.id);

  await recordAuditLog({
    userId: user.id,
    username: user.email,
    action: AUDIT_ACTIONS.MFA_DISABLED,
    module: AUDIT_MODULES.AUTH,
    description: "Two-factor authentication disabled.",
  });

  return true; 
};
