import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { supabase } from "../config/supabaseClient.js";
import { validateStudentImportRows } from "../utils/studentImport.js";

const findExistingRecords = async (rows) => {
  const emails = [...new Set(rows.map((row) => row.email))];
  const studentIds = [...new Set(rows.map((row) => row.student_id))];

  const [usersResult, infoResult] = await Promise.all([
    supabase.from("users").select("id, email").in("email", emails),
    supabase
      .from("student_info")
      .select("student_id, user_id")
      .in("student_id", studentIds),
  ]);

  if (usersResult.error) throw usersResult.error;
  if (infoResult.error) throw infoResult.error;

  return {
    emails: new Set(
      (usersResult.data || []).map((user) => user.email.toLowerCase()),
    ),
    studentIds: new Set(
      (infoResult.data || []).map((student) =>
        student.student_id.toLowerCase(),
      ),
    ),
  };
};

export const previewStudentImport = async (input) => {
  const validation = validateStudentImportRows(input);
  if (validation.rows.length === 0) {
    return {
      totalCount: Array.isArray(input) ? input.length : 0,
      validCount: 0,
      issues: validation.issues,
    };
  }

  const existing = await findExistingRecords(validation.rows);
  const issues = [...validation.issues];
  let databaseConflictCount = 0;

  const sourceRowByStudentId = new Map(
    input.map((row, index) => [
      String(row?.student_id ?? "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase(),
      index + 2,
    ]),
  );

  validation.rows.forEach((row) => {
    const rowNumber = sourceRowByStudentId.get(row.student_id.toLowerCase());
    const conflicts = [];
    if (existing.emails.has(row.email)) conflicts.push("email already exists");
    if (existing.studentIds.has(row.student_id.toLowerCase())) {
      conflicts.push("student_id already exists");
    }
    if (conflicts.length > 0) {
      databaseConflictCount += 1;
      issues.push({
        rowNumber,
        studentId: row.student_id,
        email: row.email,
        errors: conflicts,
      });
    }
  });

  return {
    totalCount: Array.isArray(input) ? input.length : 0,
    validCount: validation.rows.length - databaseConflictCount,
    issues,
  };
};

export const provisionStudentAccount = async (
  row,
  {
    supabaseClient = supabase,
    hashPassword = (password) => bcrypt.hash(password, 12),
    generateTemporaryPassword = () => `${randomBytes(32).toString("hex")}A1!`,
  } = {},
) => {
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  const fullName = `${row.first_name} ${row.last_name}`.trim();
  const { data: authResult, error: authError } =
    await supabaseClient.auth.admin.createUser({
      email: row.email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: "student" },
    });

  if (authError) throw new Error(authError.message);
  const userId = authResult?.user?.id;
  if (!userId) throw new Error("Supabase did not return an account ID.");

  const { error: userError } = await supabaseClient.from("users").insert({
    id: userId,
    email: row.email,
    password_hash: passwordHash,
    full_name: fullName,
    role: "student",
    year_level: row.year_level,
    program: row.program,
  });

  if (userError) {
    const { error: authCleanupError } =
      await supabaseClient.auth.admin.deleteUser(userId);
    if (authCleanupError) {
      throw new Error(
        `Student profile creation failed and cleanup needs review for account ${userId}.`,
      );
    }
    throw new Error(userError.message);
  }

  const { error: infoError } = await supabaseClient.from("student_info").upsert(
    {
      user_id: userId,
      student_id: row.student_id,
      department: row.department,
      program: row.program,
      section: row.section,
      year_level: row.year_level,
      risk_level: "Low",
    },
    { onConflict: "user_id" },
  );

  if (infoError) {
    const { error: profileCleanupError } = await supabaseClient
      .from("users")
      .delete()
      .eq("id", userId);
    const { error: authCleanupError } =
      await supabaseClient.auth.admin.deleteUser(userId);
    if (profileCleanupError || authCleanupError) {
      throw new Error(
        `Student profile creation failed and cleanup needs review for account ${userId}.`,
      );
    }
    throw new Error(infoError.message);
  }

  return { student_id: row.student_id, email: row.email };
};

export const importStudentAccounts = async (input) => {
  const validation = validateStudentImportRows(input);
  if (validation.issues.length > 0) {
    return {
      created: [],
      failed: validation.issues.map((issue) => ({
        student_id: issue.studentId || null,
        email: issue.email || null,
        row: issue.rowNumber,
        errors: issue.errors,
      })),
    };
  }

  const preview = await previewStudentImport(input);
  if (preview.issues.length > 0) {
    return {
      created: [],
      failed: preview.issues.map((issue) => ({
        student_id: issue.studentId || null,
        email: issue.email || null,
        row: issue.rowNumber,
        errors: issue.errors,
      })),
    };
  }

  const created = [];
  const failed = [];
  for (const [index, row] of validation.rows.entries()) {
    try {
      created.push(await provisionStudentAccount(row));
    } catch (error) {
      failed.push({
        student_id: row.student_id,
        email: row.email,
        row: index + 2,
        errors: [error.message || "Unable to create student account."],
      });
    }
  }

  return { created, failed };
};
