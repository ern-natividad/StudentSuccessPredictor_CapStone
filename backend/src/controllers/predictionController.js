import { supabase } from "../config/supabaseClient.js";
import { HttpError } from "../middleware/errorHandler.js";
import { buildPredictionFromGrades } from "../utils/predictionEngine.js";

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
    return res.status(200).json({
      student: { id: student.id, full_name: student.full_name },
      prediction: null,
      message: "No prediction yet. Your forecast will appear once academic staff record your grades.",
    });
  }

  return res.status(200).json({
    student: { id: student.id, full_name: student.full_name },
    prediction: buildPredictionFromGrades(grades),
  });
};

export const getMyPrediction = (req, res) => {
  req.params.userId = req.user.id || req.user.sub;
  return getStudentPrediction(req, res);
};
