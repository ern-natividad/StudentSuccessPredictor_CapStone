import { supabase } from "../config/supabaseClient.js";
import { HttpError } from "../middleware/errorHandler.js";

const GRADE_SELECT_COLUMNS =
  "id, user_id, subject_code, subject_name, semester, school_year, grade, remarks, created_at";

const parseGrade = (value) => {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();

  // Always store as text so INC and numeric grades share one column type.
  if (raw === "INC" || raw === "1" || raw === "2" || raw === "3" || raw === "5") {
    return raw;
  }

  throw new HttpError(400, "Grade must be 1, 2, 3, INC, or 5.");
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
  const subject_code = payload.subject_code?.trim() || null;
  const subject_name = payload.subject_name?.trim();
  const semester = payload.semester?.trim();
  const school_year = payload.school_year?.trim();
  if (!subject_name || !semester || !school_year) {
    throw new HttpError(400, "Subject name, semester, and school year are required.");
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

  const { data, error } = await supabase
    .from("student_grades")
    .insert({ user_id: userId, ...grade })
    .select(GRADE_SELECT_COLUMNS)
    .single();
  if (error) throw error;
  res.status(201).json({ grade: data });
};

export const updateStudentGrade = async (req, res) => {
  const grade = validateGradePayload(req.body);
  const { data, error } = await supabase
    .from("student_grades")
    .update(grade)
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
