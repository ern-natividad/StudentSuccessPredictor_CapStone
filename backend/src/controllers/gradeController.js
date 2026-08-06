import { supabase } from "../config/supabaseClient.js";
import { HttpError } from "../middleware/errorHandler.js";

const parseGrade = (value) => {
  const grade = Number(value);
  if (!Number.isFinite(grade) || grade < 1 || grade > 5) {
    throw new HttpError(400, "Grade must be a number from 1 to 5.");
  }
  return grade;
};

const validateGradePayload = (payload) => {
  const subject_name = payload.subject_name?.trim();
  const semester = payload.semester?.trim();
  if (!subject_name || !semester) {
    throw new HttpError(400, "Subject name and semester are required.");
  }
  return {
    subject_name,
    semester,
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
    .select("id, user_id, subject_name, semester, grade, remarks, created_at")
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
    .select("id, user_id, subject_name, semester, grade, remarks, created_at")
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
    .select("id, user_id, subject_name, semester, grade, remarks, created_at")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "Grade record not found.");
  res.status(200).json({ grade: data });
};

export const getMyGrades = async (req, res) => {
  const studentId = req.user.sub;
  const { data, error } = await supabase
    .from("student_grades")
    .select("id, user_id, subject_name, semester, grade, remarks, created_at")
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
