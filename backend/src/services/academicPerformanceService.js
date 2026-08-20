import { supabase } from "../config/supabaseClient.js";
import {
  buildPerformanceRecommendation,
  buildPredictionFromGrades,
} from "../utils/predictionEngine.js";

const DEFAULT_ACADEMIC_YEAR = "2026-2027";
const FORECAST_VIEW = "vw_academic_performance_forecasting";

const upsertPerformancePrediction = async ({
  studentId,
  academicYear,
  currentGpa,
  predictedGpa,
  riskLevel,
  recommendation,
}) => {
  const payload = {
    student_id: studentId,
    academic_year: academicYear,
    current_gpa: currentGpa,
    predicted_gpa: predictedGpa,
    risk_level: riskLevel,
    recommendation,
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: existingError } = await supabase
    .from("academic_performance_predictions")
    .select("id")
    .eq("student_id", studentId)
    .eq("academic_year", academicYear)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing?.id) {
    const { error } = await supabase
      .from("academic_performance_predictions")
      .update(payload)
      .eq("id", existing.id);
    if (error) throw error;
    return { studentId, action: "updated" };
  }

  const { error } = await supabase
    .from("academic_performance_predictions")
    .insert(payload);
  if (error) throw error;
  return { studentId, action: "created" };
};

export const syncAcademicPerformanceRecords = async (
  academicYear = DEFAULT_ACADEMIC_YEAR,
) => {
  const { data: studentRows, error: studentError } = await supabase
    .from("student_info")
    .select("student_id, user_id, department, year_level");

  if (studentError) throw studentError;

  const results = {
    synced: 0,
    skipped: 0,
    academicYear,
    details: [],
  };

  for (const student of studentRows || []) {
    if (!student.student_id || !student.user_id) {
      results.skipped += 1;
      continue;
    }

    const { data: grades, error: gradesError } = await supabase
      .from("student_grades")
      .select("id, grade, created_at")
      .eq("user_id", student.user_id)
      .order("created_at", { ascending: true });

    if (gradesError) throw gradesError;

    if (!grades?.length) {
      results.skipped += 1;
      continue;
    }

    const prediction = buildPredictionFromGrades(grades);
    const recommendation = buildPerformanceRecommendation(
      prediction.risk_level,
      prediction.current_gpa,
      prediction.predicted_gpa,
    );

    const upsertResult = await upsertPerformancePrediction({
      studentId: student.student_id,
      academicYear,
      currentGpa: prediction.current_gpa,
      predictedGpa: prediction.predicted_gpa,
      riskLevel: prediction.risk_level,
      recommendation,
    });

    results.synced += 1;
    results.details.push(upsertResult);
  }

  return results;
};

const enrichForecastRows = async (rows) => {
  const studentIds = [...new Set((rows || []).map((row) => row.student_id).filter(Boolean))];
  if (studentIds.length === 0) return rows || [];

  const { data: infoRows, error: infoError } = await supabase
    .from("student_info")
    .select("student_id, user_id, year_level, department")
    .in("student_id", studentIds);

  if (infoError) throw infoError;

  const userIds = [
    ...new Set((infoRows || []).map((row) => row.user_id).filter(Boolean)),
  ];

  let usersById = new Map();
  if (userIds.length > 0) {
    const { data: userRows, error: usersError } = await supabase
      .from("users")
      .select("id, full_name, email")
      .in("id", userIds);

    if (usersError) throw usersError;
    usersById = new Map((userRows || []).map((user) => [user.id, user]));
  }

  const infoByStudentId = new Map(
    (infoRows || []).map((row) => [row.student_id, row]),
  );

  return (rows || []).map((row) => {
    const info = infoByStudentId.get(row.student_id);
    const user = info?.user_id ? usersById.get(info.user_id) : null;
    const resolvedName =
      user?.full_name?.trim() ||
      (user?.email ? user.email.split("@")[0] : "") ||
      row.student_id ||
      "Unknown Student";

    return {
      ...row,
      full_name: resolvedName,
      year_level: info?.year_level || "N/A",
      program: row.program || info?.department || "N/A",
    };
  });
};

export const getAcademicPerformanceForecasts = async ({
  academicYear = DEFAULT_ACADEMIC_YEAR,
  riskLevel = "",
  program = "",
  search = "",
}) => {
  let query = supabase.from(FORECAST_VIEW).select("*");

  if (academicYear) {
    query = query.eq("academic_year", academicYear);
  }

  if (riskLevel && riskLevel !== "All") {
    query = query.eq("risk_level", riskLevel);
  }

  if (program && program !== "All") {
    query = query.eq("program", program);
  }

  const { data, error } = await query.order("full_name", { ascending: true });
  if (error) throw error;

  let forecasts = await enrichForecastRows(data || []);

  const normalizedSearch = search.trim().toLowerCase();
  if (normalizedSearch) {
    forecasts = forecasts.filter(
      (row) =>
        String(row.full_name || "").toLowerCase().includes(normalizedSearch) ||
        String(row.student_id || "").toLowerCase().includes(normalizedSearch) ||
        String(row.program || "").toLowerCase().includes(normalizedSearch),
    );
  }

  const mae =
    forecasts.length > 0
      ? Number(
          (
            forecasts.reduce((sum, row) => sum + Number(row.abs_error || 0), 0) /
            forecasts.length
          ).toFixed(2),
        )
      : 0;

  const summary = {
    totalStudents: forecasts.length,
    mae,
    moderateRisk: forecasts.filter((row) => row.risk_level === "Medium").length,
    highRisk: forecasts.filter(
      (row) => row.risk_level === "High" || row.risk_level === "Critical",
    ).length,
  };

  return {
    academicYear,
    forecasts,
    summary,
  };
};

export const getAcademicPerformanceDashboard = async (query = {}) => {
  const academicYear = query.academicYear || DEFAULT_ACADEMIC_YEAR;

  if (query.sync !== "false") {
    await syncAcademicPerformanceRecords(academicYear);
  }

  return getAcademicPerformanceForecasts({
    academicYear,
    riskLevel: query.riskLevel || "",
    program: query.program || "",
    search: query.search || "",
  });
};
