import { supabase } from "../config/supabaseClient.js";
import { env } from "../config/env.js";
import { HttpError } from "../middleware/errorHandler.js";
import {
  buildPredictionFromGrades,
  getRiskLevel,
} from "../utils/predictionEngine.js";
import { getResolvedStudentUserIds } from "../services/studentRiskService.js";
import {
  assertStaffCanAccessStudents,
  getStaffAccessibleStudentUserIds,
} from "../services/staffStudentAccessService.js";

const requestGwaForecast = async (userId) => {
  if (!env.predictionServiceUrl) return null;

  const response = await fetch(
    `${env.predictionServiceUrl.replace(/\/$/, "")}/forecast`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(env.predictionServiceSecret
          ? { "X-Prediction-Service-Key": env.predictionServiceSecret }
          : {}),
      },
      body: JSON.stringify({ user_ids: [userId] }),
    },
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new HttpError(
      502,
      payload.detail || "HawkPredict could not generate a next-term GWA forecast.",
    );
  }

  const result = payload.results?.find((item) => item.user_id === userId);
  if (!result || result.status !== "updated") {
    return {
      prediction: null,
      message:
        result?.reason ||
        "A next-term GWA forecast is not available for this student's grade history.",
    };
  }

  const forecast = result.prediction;
  return { prediction: normalizeGwaForecast(forecast) };
};

export const getPredictionModelInfo = async (_req, res) => {
  if (!env.predictionServiceUrl) {
    throw new HttpError(503, "HawkPredict model service is not configured.");
  }
  const response = await fetch(
    `${env.predictionServiceUrl.replace(/\/$/, "")}/model-info`,
    {
      headers: env.predictionServiceSecret
        ? { "X-Prediction-Service-Key": env.predictionServiceSecret }
        : {},
    },
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new HttpError(
      502,
      payload.detail || "Unable to load HawkPredict model evaluation details.",
    );
  }
  return res.status(200).json(payload);
};

const requestGwaForecasts = async (userIds) => {
  if (!env.predictionServiceUrl) return null;

  const response = await fetch(
    `${env.predictionServiceUrl.replace(/\/$/, "")}/forecast`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(env.predictionServiceSecret
          ? { "X-Prediction-Service-Key": env.predictionServiceSecret }
          : {}),
      },
      body: JSON.stringify({ user_ids: userIds }),
    },
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new HttpError(
      502,
      payload.detail || "HawkPredict could not generate the requested forecasts.",
    );
  }
  if (!Array.isArray(payload.results)) {
    throw new HttpError(502, "HawkPredict returned an invalid bulk forecast response.");
  }
  return payload.results || [];
};

const normalizeGwaForecast = (forecast) => {
  const predictedGpa = Number(forecast.predicted_gwa ?? forecast.predicted_gpa);
  return {
    ...forecast,
    current_gpa: forecast.current_gpa ?? forecast.current_gwa ?? null,
    predicted_gpa: Number.isFinite(predictedGpa) ? predictedGpa : null,
    risk_level:
      forecast.risk_level ||
      (Number.isFinite(predictedGpa) ? getRiskLevel(predictedGpa) : null),
    confidence_score: forecast.confidence_score ?? null,
  };
};

export const getStudentPrediction = async (req, res) => {
  const { userId } = req.params;
  const requesterId = req.user.id || req.user.sub;

  if (req.user.role === "student" && requesterId !== userId) {
    throw new HttpError(403, "You can only view your own prediction.");
  }
  await assertStaffCanAccessStudents(req.user, [userId]);

  const { data: student, error: studentError } = await supabase
    .from("users")
    .select("id, full_name, role")
    .eq("id", userId)
    .maybeSingle();
  if (studentError) throw studentError;
  if (!student || student.role !== "student") {
    throw new HttpError(404, "Student account not found.");
  }

  const { data: grades, error: gradesError } = await supabase
    .from("student_grades")
    .select("id, grade, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (gradesError) throw gradesError;
  if (!grades?.length) {
    return res.status(200).json({
      student: { id: student.id, full_name: student.full_name },
      prediction: null,
      message: "No prediction yet. Your forecast will appear once academic staff record your grades.",
    });
  }

  const gwaForecast = await requestGwaForecast(userId);
  if (gwaForecast) {
    return res.status(200).json({
      student: { id: student.id, full_name: student.full_name },
      prediction: gwaForecast.prediction,
      ...(gwaForecast.message ? { message: gwaForecast.message } : {}),
    });
  }

  const prediction = buildPredictionFromGrades(grades);
  prediction.method = "grade-trend";
  prediction.message =
    "This is the existing grade-trend estimate, not a HawkPredict model forecast. Configure the prediction service to show the three trained models.";
  const resolvedStudentIds = await getResolvedStudentUserIds([userId]);
  if (resolvedStudentIds.has(userId)) {
    prediction.risk_level = "Low";
  }

  return res.status(200).json({
    student: { id: student.id, full_name: student.full_name },
    prediction,
  });
};

export const getStudentPredictionsBulk = async (req, res) => {
  const requestedIds = req.body?.user_ids;
  if (
    !Array.isArray(requestedIds) ||
    requestedIds.length === 0 ||
    requestedIds.length > 5000
  ) {
    throw new HttpError(400, "Provide between 1 and 5,000 student user_ids.");
  }
  const userIds = [...new Set(
    requestedIds.map((userId) => String(userId || "").trim()).filter(Boolean),
  )];
  if (userIds.length === 0) {
    throw new HttpError(400, "Provide at least one valid student user_id.");
  }

  const { data: students, error: studentError } = await supabase
    .from("users")
    .select("id")
    .eq("role", "student")
    .in("id", userIds);
  if (studentError) throw studentError;
  const existingUserIds = new Set((students || []).map((student) => student.id));
  const accessibleUserIds = await getStaffAccessibleStudentUserIds(
    req.user,
    [...existingUserIds],
  );
  const validUserIds = new Set(
    [...existingUserIds].filter((userId) => accessibleUserIds.has(userId)),
  );

  let forecastResults = null;
  if (env.predictionServiceUrl && validUserIds.size > 0) {
    forecastResults = await requestGwaForecasts([...validUserIds]);
  }

  let gradeRowsByUser = new Map();
  if (forecastResults === null && validUserIds.size > 0) {
    gradeRowsByUser = new Map([...validUserIds].map((userId) => [userId, []]));
    for (let offset = 0; offset < 100000; offset += 1000) {
      const { data, error } = await supabase
        .from("student_grades")
        .select("id, user_id, grade, created_at")
        .in("user_id", [...validUserIds])
        .order("created_at", { ascending: true })
        .range(offset, offset + 999);
      if (error) throw error;
      for (const grade of data || []) {
        gradeRowsByUser.get(grade.user_id)?.push(grade);
      }
      if ((data || []).length < 1000) break;
      if (offset === 99000) {
        throw new HttpError(500, "Student grade history exceeded the bulk-read limit.");
      }
    }
  }

  const resolvedUserIds =
    validUserIds.size > 0
      ? await getResolvedStudentUserIds([...validUserIds])
      : new Set();
  const forecastsByUserId = new Map(
    (forecastResults || []).map((result) => [result.user_id, result]),
  );

  const predictions = userIds.map((userId) => {
    if (!validUserIds.has(userId)) {
      return {
        user_id: userId,
        prediction: null,
        message: existingUserIds.has(userId)
          ? "Prediction is unavailable for this student."
          : "Student account not found.",
      };
    }

    if (forecastResults !== null) {
      const forecastResult = forecastsByUserId.get(userId);
      if (forecastResult?.status === "updated" && forecastResult.prediction) {
        return {
          user_id: userId,
          prediction: normalizeGwaForecast(forecastResult.prediction),
        };
      }
      return {
        user_id: userId,
        prediction: null,
        message:
          forecastResult?.reason ||
          "A next-term GWA forecast is not available for this student's grade history.",
      };
    }

    const grades = gradeRowsByUser.get(userId) || [];
    if (grades.length === 0) {
      return {
        user_id: userId,
        prediction: null,
        message: "No prediction yet. Record grades to generate a forecast.",
      };
    }
    const prediction = buildPredictionFromGrades(grades);
    prediction.method = "grade-trend";
    prediction.message =
      "This is the existing grade-trend estimate, not a HawkPredict model forecast. Configure the prediction service to show the three trained models.";
    if (resolvedUserIds.has(userId)) prediction.risk_level = "Low";
    return { user_id: userId, prediction };
  });

  return res.status(200).json({ predictions });
};

export const getMyPrediction = (req, res) => {
  req.params.userId = req.user.id || req.user.sub;
  return getStudentPrediction(req, res);
};
