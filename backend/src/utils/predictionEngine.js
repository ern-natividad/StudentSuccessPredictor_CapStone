const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

export const getRiskLevel = (predictedGpa) => {
  if (predictedGpa <= 2.25) return "Low";
  if (predictedGpa <= 3) return "Medium";
  if (predictedGpa <= 3.5) return "High";
  return "Critical";
};

export const buildPredictionFromGrades = (grades) => {
  const orderedGrades = [...grades].sort(
    (left, right) => new Date(left.created_at) - new Date(right.created_at),
  );
  const values = orderedGrades
    .map((record) => Number(record.grade))
    .filter((grade) => Number.isFinite(grade));

  if (values.length === 0) {
    return {
      current_gpa: null,
      predicted_gpa: null,
      confidence_score: 0,
      risk_level: "Medium",
      success_probability: 50,
      grade_count: grades.length,
      trend: 0,
      method: "grade-trend",
      message:
        "Prediction needs numeric grades. Incomplete (INC) records are excluded from GWA calculations.",
    };
  }

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

export const buildPerformanceRecommendation = (riskLevel, currentGpa, predictedGpa) => {
  const trend = predictedGpa - currentGpa;

  if (riskLevel === "Critical") {
    return "Immediate academic intervention and adviser conference required.";
  }
  if (riskLevel === "High") {
    return "Schedule remedial support, tutoring, and weekly progress monitoring.";
  }
  if (riskLevel === "Medium") {
    return trend > 0
      ? "Review weak subjects and maintain a structured weekly study plan."
      : "Maintain current study habits and monitor midterm performance.";
  }
  return "Continue current performance and keep tracking GWA trends.";
};
