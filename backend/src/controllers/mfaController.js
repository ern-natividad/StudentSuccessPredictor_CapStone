import { asyncHandler } from "../utils/asyncHandler.js";
import { supabase } from "../config/supabaseClient.js";
import { beginMfaSetup, confirmMfaSetup, disableMfa } from "../services/mfaService.js";
import { HttpError } from "../middleware/errorHandler.js";

const getUserOrThrow = async (id) => {
  const { data, error } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "User not found.");
  return data;
};

export const startMfaSetup = asyncHandler(async (req, res) => {
  const user = await getUserOrThrow(req.user.sub);
  const { qrCodeDataUrl, manualEntryKey } = await beginMfaSetup(user);
  return res.status(200).json({ qrCodeDataUrl, manualEntryKey });
});

export const confirmMfa = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) throw new HttpError(400, "Verification code is required.");

  const user = await getUserOrThrow(req.user.sub);
  const success = await confirmMfaSetup(user, code);

  if (!success) {
    throw new HttpError(401, "Invalid verification code. Please try again.");
  }

  return res.status(200).json({ success: true });
});

export const removeMfa = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) throw new HttpError(400, "Verification code is required.");

  const user = await getUserOrThrow(req.user.sub);
  const success = await disableMfa(user, code);

  if (!success) {
    throw new HttpError(401, "Invalid verification code. Please try again.");
  }

  return res.status(200).json({ success: true });
});
