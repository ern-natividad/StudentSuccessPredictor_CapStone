import {
  ENGINEERING_PROGRAMS,
  RECOMMENDATION_STATUSES,
} from "../data/engineeringPrograms.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Computes the weighted CET subtest correlation score for a single program (0–100).
 */
export const computeProgramSubtestScore = (cetScores, weights) => {
  const entries = Object.entries(weights);
  if (entries.length === 0) return 0;

  const score = entries.reduce(
    (total, [subtest, weight]) => total + (Number(cetScores[subtest]) || 0) * weight,
    0,
  );

  return clamp(Math.round(score), 0, 100);
};

/**
 * Academic foundation index: GWA, EAT, and screening with optional STEM strand bonus.
 */
export const computeAcademicIndex = ({ gwa, eatScore, screeningScore, strand }) => {
  const academicBase =
    Number(gwa) * 0.4 + Number(eatScore) * 0.35 + Number(screeningScore) * 0.25;

  const strandBonus = String(strand || "").trim().toUpperCase() === "STEM" ? 5 : 0;

  return clamp(Math.round(academicBase + strandBonus), 0, 100);
};

/**
 * Leadership role bonus (percentage points added to non-academic score).
 */
const computeLeadershipBonus = (leadershipRole = "") => {
  const role = leadershipRole.toLowerCase();

  if (role.includes("president") || role.includes("student head") || role.includes("head")) {
    return 5;
  }
  if (role.includes("officer") || role.includes("vice")) {
    return 3;
  }
  if (role.includes("committee") || role.includes("member")) {
    return 1;
  }

  return 0;
};

/**
 * Extracurricular relevance bonus.
 */
const computeExtracurricularBonus = (extracurriculars = "") => {
  const activity = extracurriculars.toLowerCase();

  if (
    activity.includes("robotics") ||
    activity.includes("science") ||
    activity.includes("math club")
  ) {
    return 5;
  }
  if (activity.includes("student council") || activity.includes("council")) {
    return 3;
  }

  return 0;
};

/**
 * Special skills keyword match bonus against program-relevant and global keywords.
 */
const computeSkillsBonus = (specialSkills = "", programSkillKeywords = []) => {
  const skills = specialSkills.toLowerCase();
  const globalKeywords = ["cad", "python", "electronics", "coding", "programming"];
  const keywords = [...new Set([...globalKeywords, ...programSkillKeywords])];

  const hasMatch = keywords.some((keyword) => skills.includes(keyword));
  return hasMatch ? 5 : 0;
};

/**
 * Non-academic alignment score on a 0–100 scale (15% weight in final formula).
 */
export const computeNonAcademicScore = (nonAcademic = {}, programSkillKeywords = []) => {
  const baseline = 55;
  const bonus =
    computeLeadershipBonus(nonAcademic.leadershipRole) +
    computeExtracurricularBonus(nonAcademic.extracurriculars) +
    computeSkillsBonus(nonAcademic.specialSkills, programSkillKeywords);

  return clamp(baseline + bonus, 0, 100);
};

/**
 * Final combined confidence using the specification weighting model.
 */
export const computeMatchConfidence = (
  programSubtestScore,
  academicIndex,
  nonAcademicScore,
) =>
  clamp(
    Math.round(programSubtestScore * 0.6 + academicIndex * 0.25 + nonAcademicScore * 0.15),
    0,
    99,
  );

export const mapConfidenceToStatus = (confidence) => {
  if (confidence >= 85) return RECOMMENDATION_STATUSES.STRONGLY_RECOMMENDED;
  if (confidence >= 70) return RECOMMENDATION_STATUSES.RECOMMENDED_WITH_ADVISING;
  return RECOMMENDATION_STATUSES.ALTERNATIVE_TRACKS;
};

export const computeOverallCet = (cetScores) => {
  const values = Object.values(cetScores).map(Number).filter(Number.isFinite);
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

/**
 * Builds dynamic profile insights from applicant metrics.
 */
export const buildProfileInsights = (applicant, topProgramName) => {
  const { cetScores, nonAcademic, gwa, eatScore, screeningScore } = applicant;
  const strengths = [];
  const improvementAreas = [];

  if (Number(cetScores.math) >= 80) strengths.push("High Mathematics Proficiency");
  else improvementAreas.push("Mathematics Fundamentals");

  if (Number(cetScores.science) >= 80) strengths.push("Strong Science Core");
  else improvementAreas.push("Science Core Competency");

  if (Number(cetScores.english) >= 75 && Number(cetScores.reading) >= 75) {
    strengths.push("Effective Communication Skills");
  } else {
    improvementAreas.push("Technical Communication Skills");
  }

  if (Number(cetScores.abstract) >= 80) strengths.push("Strong Abstract Reasoning");
  else improvementAreas.push("Analytical Reasoning Development");

  if (nonAcademic?.leadershipRole && !/none/i.test(nonAcademic.leadershipRole)) {
    strengths.push("Demonstrated Leadership");
  } else {
    improvementAreas.push("Leadership & Team Engagement");
  }

  if (Number(gwa) >= 90) strengths.push("Excellent Academic Foundation");
  if (Number(eatScore) >= 85) strengths.push("Strong Engineering Aptitude");
  if (Number(screeningScore) >= 85) strengths.push("Positive Screening Performance");

  if (!improvementAreas.includes("Research & Hardware Exposure")) {
    improvementAreas.push("Research & Hardware Exposure");
  }

  const uniqueStrengths = [...new Set(strengths)].slice(0, 4);
  const uniqueImprovements = [...new Set(improvementAreas)].slice(0, 4);

  const remarks =
    `Applicant demonstrates ${uniqueStrengths.length > 0 ? "notable" : "developing"} alignment with ` +
    `${topProgramName || "engineering programs"}, combining quantitative CET performance with ` +
    `${nonAcademic?.extracurriculars ? "active extracurricular involvement" : "emerging co-curricular engagement"}.`;

  return {
    strengths: uniqueStrengths,
    improvementAreas: uniqueImprovements,
    remarks,
  };
};

/**
 * Runs the full recommendation matrix for all engineering programs.
 */
export const generateProgramRecommendations = (applicant) => {
  const academicIndex = computeAcademicIndex(applicant);
  const overallCET = computeOverallCet(applicant.cetScores);

  const rankedPrograms = ENGINEERING_PROGRAMS.map((program) => {
    const programSubtestScore = computeProgramSubtestScore(
      applicant.cetScores,
      program.weights,
    );
    const nonAcademicScore = computeNonAcademicScore(
      applicant.nonAcademic,
      program.skillKeywords,
    );
    const confidence = computeMatchConfidence(
      programSubtestScore,
      academicIndex,
      nonAcademicScore,
    );

    return {
      programId: program.id,
      name: program.name,
      confidence,
      status: mapConfidenceToStatus(confidence),
      breakdown: {
        programSubtestScore,
        academicIndex,
        nonAcademicScore,
      },
    };
  }).sort((left, right) => right.confidence - left.confidence);

  const insights = buildProfileInsights(applicant, rankedPrograms[0]?.name);

  return {
    applicantId: applicant.applicantId,
    fullName: applicant.fullName,
    overallCET,
    academicIndex,
    programs: rankedPrograms.map(({ breakdown, ...program }) => program),
    explanation:
      "Top engineering program recommendations are calculated by combining academic/CET subtest correlations with student background and non-academic profile metrics.",
    strengths: insights.strengths,
    improvementAreas: insights.improvementAreas,
    remarks: insights.remarks,
  };
};
