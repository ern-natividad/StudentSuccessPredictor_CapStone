export const normalizeApplicantPayload = (formData) => ({
  applicant_id: formData.applicantId,
  full_name: formData.fullName,
  sex: formData.sex,
  age: Number(formData.age),
  strand: formData.strand,
  shs_gwa: parseFloat(formData.gwa),
  cet_score: parseInt(formData.cet, 10),
  eat_score: parseInt(formData.eat, 10),
  screening_score: parseInt(formData.screening, 10),
});

export const normalizeUserPayload = (formData, roleId = "student") => ({
  first_name: formData.firstName,
  last_name: formData.lastName,
  email: formData.email.toLowerCase(),
  role: roleId,
  student_id: roleId === "student" ? formData.studentId : undefined,
  employee_id: roleId !== "student" ? formData.employeeId : undefined,
  year_level: roleId === "student" ? formData.year : undefined,
  department: roleId !== "student" ? formData.department : undefined,
  access_code: roleId !== "student" ? formData.accessCode : undefined,
  password: formData.password,
  terms_accepted: Boolean(formData.termsAccepted),
});

const getRiskLevelFromScore = (score) => {
  if (score >= 4) return "Low";
  if (score >= 3) return "Medium";
  if (score >= 2) return "High";
  return "Critical";
};

export const normalizeScreeningPayload = (responses) => {
  const attendance_rate = parseInt(responses.q1, 10);
  const assignment_submission = parseInt(responses.q2, 10);
  const participation = parseInt(responses.q3, 10);
  const academic_performance = parseInt(responses.q4, 10);
  const behavioral_conduct = parseInt(responses.q5, 10);
  const risk_score =
    (attendance_rate +
      assignment_submission +
      participation +
      academic_performance +
      behavioral_conduct) /
    5;

  return {
    attendance_rate,
    assignment_submission,
    participation,
    academic_performance,
    behavioral_conduct,
    risk_score,
    risk_level: getRiskLevelFromScore(risk_score),
  };
};

export const normalizeWhatIfPayload = (inputs) => {
  const high_school_gpa_percent = Number(inputs.hsGpa);
  const senior_high_school_gpa = Number(inputs.shsGpa);
  const cet_score = Number(inputs.cetScore);
  const screening_score = Number(inputs.screening);

  const predicted_gpa = Math.min(
    Math.max(
      1.0,
      1.5 +
        (high_school_gpa_percent / 100) * 0.6 +
        (senior_high_school_gpa / 4) * 1.0 +
        (cet_score / 100) * 0.6 +
        (screening_score / 100) * 0.7,
    ),
    4.0,
  );

  const success_probability = Number(
    Math.min(100, Math.max(0, (predicted_gpa / 4) * 100)).toFixed(0),
  );

  return {
    high_school_gpa_percent,
    senior_high_school_gpa,
    cet_score,
    screening_score,
    predicted_gpa,
    success_probability,
    model_version: "heuristic_v1",
  };
};
