import { supabase } from "../config/supabaseClient.js";
import { buildPredictionFromGrades } from "../utils/predictionEngine.js";

const normalizeRiskLevel = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "critical") return "Critical";
  if (normalized === "high") return "High";
  if (normalized === "medium" || normalized === "moderate") return "Medium";
  return "Low";
};

export const getCurrentStudentRiskLevel = async (userId) => {
  const [studentInfoResult, gradesResult] = await Promise.all([
    supabase
      .from("student_info")
      .select("risk_level")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("student_grades")
      .select("id, grade, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
  ]);

  if (studentInfoResult.error) throw studentInfoResult.error;
  if (gradesResult.error) throw gradesResult.error;

  if (gradesResult.data?.length) {
    return normalizeRiskLevel(
      buildPredictionFromGrades(gradesResult.data).risk_level,
    );
  }

  return normalizeRiskLevel(studentInfoResult.data?.risk_level);
};

export const getResolvedStudentUserIds = async (userIds) => {
  const uniqueUserIds = [...new Set((userIds || []).filter(Boolean))];
  if (uniqueUserIds.length === 0) return new Set();

  const { data, error } = await supabase
    .from("alert_interventions")
    .select("student_user_id")
    .eq("status", "resolved")
    .in("student_user_id", uniqueUserIds);

  if (error) throw error;
  return new Set((data || []).map((row) => row.student_user_id));
};
