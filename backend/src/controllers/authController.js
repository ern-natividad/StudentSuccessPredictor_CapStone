import { asyncHandler } from "../utils/asyncHandler.js";
import { randomUUID } from "node:crypto";
import { getRequestMeta } from "../utils/requestMeta.js";
import { supabase } from '../config/supabaseClient.js';
import {
  loginWithPassword,
  verifyMfaAndIssueToken,
  logout,
  recordSessionTimeout,
  registerUser,
  getCurrentUser,
  updateUserProfile,
  initiatePasswordReset,
  verifyPasswordOtp,
  completePasswordReset,
  changeUserPassword,
} from "../services/authService.js";

export const login = asyncHandler(async (req, res) => {
  const { email, password, accessCode, role } = req.body;
  const meta = getRequestMeta(req);

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const result = await loginWithPassword(
    email,
    password,
    accessCode,
    meta,
    role,
  );

  if (result.requiresMfa) {
    return res.status(200).json({
      requiresMfa: true,
      pendingToken: result.pendingToken,
      userId: result.pendingToken,
    });
  }

  return res.status(200).json(result);
});

export const verifyMfaLogin = asyncHandler(async (req, res) => {
  const { pendingToken, code } = req.body;
  const meta = getRequestMeta(req);

  if (!pendingToken) {
    return res.status(400).json({ error: "Missing session reference." });
  }

  const result = await verifyMfaAndIssueToken(pendingToken, code, meta);
  return res.status(200).json(result);
});

export const me = asyncHandler(async (req, res) => {
  const profile = await getCurrentUser(req.user);
  return res.status(200).json(profile);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await updateUserProfile(req.user, req.body);
  return res.status(200).json(profile);
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const meta = getRequestMeta(req);
  const result = await changeUserPassword(
    req.user,
    { currentPassword, newPassword },
    meta,
  );
  return res.status(200).json(result);
});

export const logoutHandler = asyncHandler(async (req, res) => {
  const meta = getRequestMeta(req);
  await logout(req.user, meta);
  return res.status(200).json({ success: true });
});

export const sessionTimeoutHandler = asyncHandler(async (req, res) => {
  const meta = getRequestMeta(req);
  await recordSessionTimeout(req.user, meta);
  return res.status(200).json({ success: true });
});

export const signup = asyncHandler(async (req, res) => {
  const meta = getRequestMeta(req);
  const { year_level: yearLevel, ...rest } = req.body;

  console.log("authController -> req.body:", req.body);
  console.log("authController -> year_level:", yearLevel);

  const result = await registerUser(
    {
      ...rest,
      year_level: yearLevel,
    },
    meta,
  );

  return res.status(201).json(result);
});

/**
 * POST /forgot-password/request
 * Initiates a 6-digit OTP token request.
 */
export const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const email = req.body.email || req.body.identifier;
  const meta = getRequestMeta(req);

  if (!email || !email.trim()) {
    return res.status(400).json({ error: "Email address is required." });
  }

  const result = await initiatePasswordReset(email, meta);
  return res.status(200).json(result);
});

/**
 * POST /forgot-password/verify
 * Validates the 6-digit numeric OTP text code typed into the UI.
 */
export const verifyForgotPasswordCode = asyncHandler(async (req, res) => {
  const email = req.body.email || req.body.identifier;
  const { code } = req.body;
  const meta = getRequestMeta(req);

  if (!email || !code) {
    return res
      .status(400)
      .json({ error: "Email address and verification code are required." });
  }

  const result = await verifyPasswordOtp(email, code, meta);
  return res.status(200).json(result);
});

/**
 * POST /forgot-password/reset
 * Updates the password in Supabase Auth using the validated user context.
 */
export const forgotPasswordReset = asyncHandler(async (req, res) => {
  const { userId, email, identifier, newPassword } = req.body;
  const meta = getRequestMeta(req);

  if (!newPassword) {
    return res.status(400).json({ error: "New password is required." });
  }

  let targetId = userId;

  if (!targetId && (email || identifier)) {
    const fallbackEmail = (email || identifier).trim().toLowerCase();

    const { data: foundUser, error: fetchError } = await supabase
      .from("users")
      .select("id")
      .eq("email", fallbackEmail)
      .maybeSingle();

    if (fetchError) {
      return res
        .status(500)
        .json({ error: "Database error resolving account context." });
    }

    if (foundUser) {
      targetId = foundUser.id;
    } else {
      const { data: authUsersData, error: authListError } =
        await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });

      if (!authListError) {
        const authUser = authUsersData?.users?.find(
          (user) => user.email?.toLowerCase() === fallbackEmail,
        );
        if (authUser) {
          targetId = authUser.id;
        }
      }
    }
  }

  if (!targetId) {
    return res
      .status(404)
      .json({ error: "Target account identifier not found." });
  }

  const user = await completePasswordReset(
    targetId,
    newPassword,
    meta,
    email || identifier,
  );

  return res.status(200).json({
    success: true,
    role: user.role,
    message: "Password updated successfully.",
  });
});

/**
 * GET /api/auth/users
 * Returns list of user accounts to display in administration/removal UI.
 */
export const getManageableUsers = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  let query = supabase
    .from("users")
    .select(
      "id, email, full_name, role, created_at, year_level, current_gpa, predicted_gpa, confidence_score, risk_level, title, assignedSectionId, assignedStaffId, grade_records",
    )
    .order("created_at", { ascending: false });

  if (currentUser?.role === "student") {
    query = query.eq("id", currentUser.id || currentUser.sub);
  }

  const { data: users, error } = await query;

  if (error) {
    console.error("Supabase error in getManageableUsers:", error.message);
    return res.status(500).json({ error: "Database error: " + error.message });
  }

  // Respond with full users array or structured payload depending on route expectation
  return res.status(200).json({
    success: true,
    users: users || [],
  });
});

/**
 * DELETE /api/auth/users/:id
 * Removes a user account from Supabase database & auth
 */
export const deleteUserAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUser = req.user;

  // Prevent self-deletion if current user context exists
  if (currentUser && (currentUser.id === id || currentUser.sub === id)) {
    return res.status(400).json({ error: "You cannot delete your own account." });
  }

  // Fetch target user to verify existence
  const { data: targetUser, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !targetUser) {
    return res.status(404).json({ error: "Target account not found." });
  }

  // Delete record from Supabase 'users' table
  const { error: dbDeleteError } = await supabase
    .from("users")
    .delete()
    .eq("id", id);

  if (dbDeleteError) {
    console.error("DB deletion error:", dbDeleteError.message);
    return res.status(500).json({ error: "Failed to remove user database record: " + dbDeleteError.message });
  }

  // Delete from Supabase Auth service if available
  if (supabase.auth?.admin?.deleteUser) {
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id);
    if (authDeleteError) {
      console.warn("Auth deletion note:", authDeleteError.message);
    }
  }

  return res.status(200).json({
    success: true,
    message: `Account (${targetUser.email}) removed successfully.`,
  });
});

/** Adds a grade record for a student. Staff and administrators only. */
export const addStudentGrade = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { gradeRecord } = req.body;
  const subject = gradeRecord?.subject?.trim();
  const rawGrade = String(gradeRecord?.grade ?? "")
    .trim()
    .toUpperCase();
  const isInc = rawGrade === "INC";
  const allowedNumeric = [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 5];
  const numeric = Number(rawGrade);
  const matched = allowedNumeric.find(
    (g) => Number.isFinite(numeric) && Math.abs(g - numeric) < 0.001,
  );
  const grade = isInc ? "INC" : matched !== undefined ? String(matched) : null;

  if (!subject || grade === null) {
    return res.status(400).json({
      error:
        "A subject and a grade of 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, INC, or 5 are required.",
    });
  }

  const { data: student, error: fetchError } = await supabase
    .from("users")
    .select("id, role, grade_records")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!student || student.role !== "student") {
    return res.status(404).json({ error: "Student account not found." });
  }

  const newRecord = {
    id: randomUUID(),
    subject,
    subject_code: subject,
    subject_description: gradeRecord.description?.trim() || subject,
    semester: gradeRecord.semester || "1",
    grade,
    remarks: gradeRecord.remarks?.trim() || "",
    recorded_at: new Date().toISOString(),
    recorded_by: req.user.sub,
  };
  const gradeRecords = [...(Array.isArray(student.grade_records) ? student.grade_records : []), newRecord];

  const { data: updatedStudent, error: updateError } = await supabase
    .from("users")
    .update({ grade_records: gradeRecords })
    .eq("id", id)
    .select("id, grade_records")
    .single();

  if (updateError) throw updateError;
  return res.status(201).json({ success: true, user: updatedStudent });
});
