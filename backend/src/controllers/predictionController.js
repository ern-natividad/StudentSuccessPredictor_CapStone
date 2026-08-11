import { supabase } from "../config/supabaseClient.js";
import { HttpError } from "../middleware/errorHandler.js";

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

const getRiskLevel = (predictedGpa) => {
  if (predictedGpa <= 2.25) return "Low";
  if (predictedGpa <= 3) return "Medium";
  if (predictedGpa <= 3.5) return "High";
  return "Critical";
};

const buildPrediction = (grades) => {
  const orderedGrades = [...grades].sort(
    (left, right) => new Date(left.created_at) - new Date(right.created_at),
  );
  const values = orderedGrades.map((record) => Number(record.grade));
  const currentGpa = values.reduce((total, grade) => total + grade, 0) / values.length;

  const meanIndex = (values.length - 1) / 2;
  const numerator = values.reduce(
    (total, grade, index) => total + (index - meanIndex) * (grade - currentGpa),
    0,
  );
  const denominator = values.reduce(
    (total, _grade, index) => total + (index - meanIndex) ** 2,
    0,
  );
  const trend = denominator ? numerator / denominator : 0;
  const predictedGpa = clamp(currentGpa + trend, 1, 5);
  const meanAbsoluteDeviation =
    values.reduce((total, grade) => total + Math.abs(grade - currentGpa), 0) /
    values.length;
  const confidenceScore = Math.round(
    clamp(50 + values.length * 7 + (1 - clamp(meanAbsoluteDeviation / 2, 0, 1)) * 20, 50, 95),
  );
  const riskLevel = getRiskLevel(predictedGpa);

  return {
    current_gpa: Number(currentGpa.toFixed(2)),
    predicted_gpa: Number(predictedGpa.toFixed(2)),
    confidence_score: confidenceScore,
    risk_level: riskLevel,
    success_probability: Math.round(clamp(100 - ((predictedGpa - 1) / 4) * 60, 40, 99)),
    grade_count: values.length,
    trend: Number(trend.toFixed(2)),
    method: "grade-trend",
    message:
      "Prediction is calculated from the student's recorded grades and their performance trend.",
  };
};

export const getStudentPrediction = async (req, res) => {
  const { userId } = req.params;
  const requesterId = req.user.id || req.user.sub;

  if (req.user.role === "student" && requesterId !== userId) {
    throw new HttpError(403, "You can only view your own prediction.");
  }

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
    throw new HttpError(404, "Add at least one grade before requesting a prediction.");
  }

  return res.status(200).json({
    student: { id: student.id, full_name: student.full_name },
    prediction: buildPrediction(grades),
  });
};

export const getMyPrediction = (req, res) => {
  req.params.userId = req.user.id || req.user.sub;
  return getStudentPrediction(req, res);
};
