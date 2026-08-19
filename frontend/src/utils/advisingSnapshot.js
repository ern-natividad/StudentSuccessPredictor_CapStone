import { formatSemesterCode, getAcademicYearFromDate } from "./gradeSemesterUtils";

export const ROLE_QUICK_PROMPTS = {
  student: [
    "Summarize my current risk level",
    "What should I improve first based on my grades?",
    "Create a weekly study plan for me",
  ],
  staff: [
    "Summarize this student's risk level",
    "What should this student improve first?",
    "Create a weekly advising plan for this student",
  ],
  admin: [
    "Summarize this student's risk level",
    "What interventions would you recommend?",
    "Create a weekly advising plan for this student",
  ],
};

export const buildGradesSummary = (grades = []) =>
  grades.map((record) => ({
    subject: record.subject_name,
    semester: formatSemesterCode(record.semester),
    academicYear: getAcademicYearFromDate(record.created_at),
    grade: record.grade,
    remarks: record.remarks || "",
  }));

export const buildAdvisingSnapshot = ({
  role,
  viewerName,
  student,
  prediction,
  grades = [],
}) => {
  const gradeSummaries = buildGradesSummary(grades);
  const weakSubjects = gradeSummaries
    .filter((record) => Number(record.grade) >= 3)
    .map((record) => record.subject);

  const trendLabel =
    prediction?.trend > 0
      ? "Declining"
      : prediction?.trend < 0
        ? "Improving"
        : prediction?.trend === 0
          ? "Stable"
          : "Unknown";

  return {
    role,
    viewerName,
    studentId: student?.student_id || "N/A",
    studentUserId: student?.user_id || student?.id || null,
    studentName: student?.full_name || viewerName || "Student",
    yearLevel: student?.yearLevel || student?.year_level || "N/A",
    section: student?.section || student?.assignedSectionId || "N/A",
    department: student?.department || "N/A",
    riskLevel: prediction?.risk_level || student?.risk_level || "Not assessed",
    currentGpa: prediction?.current_gpa ?? null,
    predictedGpa: prediction?.predicted_gpa ?? null,
    successProbability: prediction?.success_probability ?? null,
    confidenceScore: prediction?.confidence_score ?? null,
    gradeCount: prediction?.grade_count ?? gradeSummaries.length,
    trend: trendLabel,
    focusAreas:
      weakSubjects.length > 0
        ? weakSubjects.join(", ")
        : gradeSummaries.length > 0
          ? "Maintain performance across recorded subjects"
          : "No grade records yet — focus on building foundational study habits",
    grades: gradeSummaries,
    hasPrediction: Boolean(prediction),
    hasGrades: gradeSummaries.length > 0,
    predictionMessage: prediction?.message || null,
  };
};

export const buildWelcomeMessage = (snapshot, role) => {
  if (!snapshot) {
    return "Welcome. I can help you review academic performance and build an advising plan once student data is loaded.";
  }

  if (role === "student") {
    if (!snapshot.hasGrades && !snapshot.hasPrediction) {
      return "Welcome. I do not see any grades or predictions on your record yet. I can still help you plan ahead, but advice will be general until staff record your grades.";
    }

    return `Welcome back, ${snapshot.studentName}. I loaded your prediction (${snapshot.riskLevel} risk) and ${snapshot.gradeCount} grade record(s). Ask me how to improve or for a weekly plan.`;
  }

  return `Advising view for ${snapshot.studentName} (${snapshot.studentId}). Risk: ${snapshot.riskLevel}. Loaded ${snapshot.gradeCount} grade record(s) and ${snapshot.hasPrediction ? "a program prediction" : "no prediction yet"}.`;
};
