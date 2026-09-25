import { supabase } from "../config/supabaseClient.js";
import { env } from "../config/env.js";
import { HttpError } from "../middleware/errorHandler.js";

const GRADE_SELECT_COLUMNS =
  "id, user_id, subject_code, subject_name, semester, school_year, grade, remarks, created_at";

const parseGrade = (value) => {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();

  if (raw === "INC") return "INC";

  const allowed = [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 5];
  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) {
    throw new HttpError(
      400,
      "Grade must be 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, INC, or 5.",
    );
  }

  const matched = allowed.find((grade) => Math.abs(grade - numeric) < 0.001);
  if (matched === undefined) {
    throw new HttpError(
      400,
      "Grade must be 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, INC, or 5.",
    );
  }

  return String(matched);
};

const normalizeSemester = (value) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  if (normalized === "1" || normalized === "1S") return "1";
  if (normalized === "2" || normalized === "2S") return "2";
  if (normalized === "S" || normalized === "SUMMER") return "S";

  throw new HttpError(400, "Semester must be 1, 2, or S.");
};

const normalizeSchoolYear = (value) => {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{4})\s*[-–/]\s*(\d{4})$/);
  if (!match) {
    throw new HttpError(400, "School year must use the format YYYY-YYYY (e.g. 2025-2026).");
  }

  const start = Number(match[1]);
  const end = Number(match[2]);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end !== start + 1) {
    throw new HttpError(400, "School year end must be one year after the start (e.g. 2025-2026).");
  }

  return `${start}-${end}`;
};

const validateGradePayload = (payload) => {
  const subject_code = String(
    payload.subject_code ?? payload.subjectCode ?? payload.code ?? "",
  ).trim();
  const subject_name = String(
    payload.subject_name ?? payload.subjectName ?? payload.subject ?? "",
  ).trim();
  const semester = payload.semester?.trim();
  const school_year = String(
    payload.school_year ?? payload.schoolYear ?? "",
  ).trim();

  if (!subject_code || !subject_name || !semester || !school_year) {
    throw new HttpError(
      400,
      "Subject code, subject name, semester, and school year are required.",
    );
  }

  return {
    subject_code,
    subject_name,
    semester: normalizeSemester(semester),
    school_year: normalizeSchoolYear(school_year),
    grade: parseGrade(payload.grade),
    remarks: payload.remarks?.trim() || null,
  };
};

const validateImportRow = (row, index) => {
  const userId = String(row.user_id ?? row.userId ?? "").trim();
  if (!userId) throw new HttpError(400, `Row ${index + 1}: user_id is required.`);

  try {
    return {
      user_id: userId,
      ...validateGradePayload(row),
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw new HttpError(error.status, `Row ${index + 1}: ${error.message}`);
    }
    throw error;
  }
};

const requestPredictions = async (userIds) => {
  if (!env.predictionServiceUrl) return { requested: false };

  const response = await fetch(`${env.predictionServiceUrl.replace(/\/$/, "")}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(env.predictionServiceSecret
        ? { "X-Prediction-Service-Key": env.predictionServiceSecret }
        : {}),
    },
    body: JSON.stringify({ user_ids: userIds }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new HttpError(502, payload.detail || "Prediction service could not process the uploaded grades.");
  }
  return { requested: true, ...payload };
};

const saveGradeRows = async (rows) => {
  const result = await supabase
    .from("student_grades")
    .upsert(rows, { onConflict: "user_id,subject_code,school_year,semester" })
    .select(GRADE_SELECT_COLUMNS);

  if (!result.error || result.error.code !== "42P10") {
    if (result.error) throw result.error;
    return result.data || [];
  }

  // Older deployments may not have applied 012_grade_predictions.sql yet.
  // Reconcile rows individually until the composite unique index is installed.
  const savedRows = [];
  for (const row of rows) {
    const keyQuery = supabase
      .from("student_grades")
      .select("id")
      .eq("user_id", row.user_id)
      .eq("subject_code", row.subject_code)
      .eq("school_year", row.school_year)
      .eq("semester", row.semester)
      .order("created_at", { ascending: true })
      .limit(1);
    const { data: existingRows, error: lookupError } = await keyQuery;
    if (lookupError) throw lookupError;
    const existing = existingRows?.[0];

    const response = existing?.id
      ? await supabase
          .from("student_grades")
          .update(row)
          .eq("id", existing.id)
          .select(GRADE_SELECT_COLUMNS)
          .single()
      : await supabase
          .from("student_grades")
          .insert(row)
          .select(GRADE_SELECT_COLUMNS)
          .single();
    if (response.error) throw response.error;
    savedRows.push(response.data);
  }
  return savedRows;
};

export const importStudentGrades = async (req, res) => {
  const { grades } = req.body || {};
  if (!Array.isArray(grades) || grades.length === 0) {
    throw new HttpError(400, "Provide at least one grade row.");
  }
  if (grades.length > 5000) {
    throw new HttpError(400, "You can import at most 5,000 grade rows at once.");
  }

  const rows = grades.map(validateImportRow);
  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const { data: students, error: studentError } = await supabase
    .from("users")
    .select("id, role")
    .in("id", userIds);
  if (studentError) throw studentError;

  const studentIds = new Set(
    (students || []).filter((student) => student.role === "student").map((student) => student.id),
  );
  const missingUserIds = userIds.filter((userId) => !studentIds.has(userId));
  if (missingUserIds.length > 0) {
    throw new HttpError(404, `Student account not found for user_id ${missingUserIds[0]}.`);
  }

  const savedGrades = await saveGradeRows(rows);

  const predictions = await requestPredictions(userIds);
  res.status(200).json({
    grades: savedGrades || [],
    count: savedGrades.length,
    user_ids: userIds,
    predictions,
  });
};

export const getStudentGrades = async (req, res) => {
  const { userId } = req.params;
  if (req.user.role === "student" && req.user.sub !== userId) {
    throw new HttpError(403, "You can only view your own grades.");
  }

  const { data, error } = await supabase
    .from("student_grades")
    .select(GRADE_SELECT_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  res.status(200).json({ grades: data || [] });
};

export const createStudentGrade = async (req, res) => {
  const { user_id: userId } = req.body;
  if (!userId) throw new HttpError(400, "Student user_id is required.");
  const grade = validateGradePayload(req.body);

  const { data: student, error: studentError } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();
  if (studentError) throw studentError;
  if (!student || student.role !== "student") {
    throw new HttpError(404, "Student account not found.");
  }

  const insertRow = {
    user_id: userId,
    subject_code: grade.subject_code,
    subject_name: grade.subject_name,
    semester: grade.semester,
    school_year: grade.school_year,
    grade: grade.grade,
    remarks: grade.remarks,
  };

  const { data, error } = await supabase
    .from("student_grades")
    .insert(insertRow)
    .select(GRADE_SELECT_COLUMNS)
    .single();
  if (error) throw error;
  res.status(201).json({ grade: data });
};

/** Create multiple grade rows for one student in a single request. */
export const createStudentGradesBulk = async (req, res) => {
  const { user_id: userId, grades } = req.body || {};
  if (!userId) throw new HttpError(400, "Student user_id is required.");
  if (!Array.isArray(grades) || grades.length === 0) {
    throw new HttpError(400, "Provide at least one grade entry.");
  }
  if (grades.length > 20) {
    throw new HttpError(400, "You can add at most 20 grades at once.");
  }

  const { data: student, error: studentError } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();
  if (studentError) throw studentError;
  if (!student || student.role !== "student") {
    throw new HttpError(404, "Student account not found.");
  }

  const insertRows = grades.map((entry, index) => {
    try {
      const grade = validateGradePayload(entry);
      return {
        user_id: userId,
        subject_code: grade.subject_code,
        subject_name: grade.subject_name,
        semester: grade.semester,
        school_year: grade.school_year,
        grade: grade.grade,
        remarks: grade.remarks,
      };
    } catch (error) {
      if (error instanceof HttpError) {
        throw new HttpError(
          error.status,
          `Row ${index + 1}: ${error.message}`,
        );
      }
      throw error;
    }
  });

  const { data, error } = await supabase
    .from("student_grades")
    .insert(insertRows)
    .select(GRADE_SELECT_COLUMNS);
  if (error) throw error;

  res.status(201).json({ grades: data || [], count: data?.length || 0 });
};

export const updateStudentGrade = async (req, res) => {
  const grade = validateGradePayload(req.body);
  const updateRow = {
    subject_code: grade.subject_code,
    subject_name: grade.subject_name,
    semester: grade.semester,
    school_year: grade.school_year,
    grade: grade.grade,
    remarks: grade.remarks,
  };

  const { data, error } = await supabase
    .from("student_grades")
    .update(updateRow)
    .eq("id", req.params.id)
    .select(GRADE_SELECT_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "Grade record not found.");
  res.status(200).json({ grade: data });
};

export const getMyGrades = async (req, res) => {
  const studentId = req.user.sub;
  const { data, error } = await supabase
    .from("student_grades")
    .select(GRADE_SELECT_COLUMNS)
    .eq("user_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  res.status(200).json({ grades: data || [] });
};

export const deleteStudentGrade = async (req, res) => {
  const { data, error } = await supabase
    .from("student_grades")
    .delete()
    .eq("id", req.params.id)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "Grade record not found.");
  res.status(200).json({ success: true });
};
