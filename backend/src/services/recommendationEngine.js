import {
  ENGINEERING_PROGRAMS,
  RECOMMENDATION_STATUSES,
} from "../data/engineeringPrograms.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const mapConfidenceToStatus = (confidence) => {
  if (confidence >= 85) return RECOMMENDATION_STATUSES.STRONGLY_RECOMMENDED;
  if (confidence >= 70) return RECOMMENDATION_STATUSES.RECOMMENDED_WITH_ADVISING;
  return RECOMMENDATION_STATUSES.ALTERNATIVE_TRACKS;
};

export const computeOverallCet = (cetScores) => {
  const values = [
    cetScores.math,
    cetScores.science,
    cetScores.english,
    cetScores.reading,
    cetScores.abstract,
  ]
    .map(Number)
    .filter(Number.isFinite);
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

export const computeCompositeScore = (cetScores, eatScore, weights) => {
  const scoreParts = {
    eat: Number(eatScore),
    math: Number(cetScores.math),
    science: Number(cetScores.science),
    abstract: Number(cetScores.abstract),
  };
  const totalWeight = Object.values(weights).reduce(
    (total, weight) => total + weight,
    0,
  );
  if (totalWeight <= 0) return 0;

  const weightedScore = Object.entries(weights).reduce(
    (total, [key, weight]) => total + scoreParts[key] * weight,
    0,
  );
  return clamp(Math.round(weightedScore / totalWeight), 0, 100);
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
  const overallCET = computeOverallCet(applicant.cetScores);

  const evaluatedPrograms = ENGINEERING_PROGRAMS.map((program) => {
    const compositeScore = computeCompositeScore(
      applicant.cetScores,
      applicant.eatScore,
      program.recommendationWeights,
    );
    const eligible = overallCET >= program.minimumCetOapr;

    return {
      programId: program.id,
      name: program.name,
      confidence: compositeScore,
      compositeScore,
      minimumCetOapr: program.minimumCetOapr,
      eligible,
      status: eligible ? mapConfidenceToStatus(compositeScore) : "Not Eligible",
      breakdown: {
        eatScore: Number(applicant.eatScore),
        cetQuantitative: Number(applicant.cetScores.math),
        cetScience: Number(applicant.cetScores.science),
        cetAbstract: Number(applicant.cetScores.abstract),
        weights: program.recommendationWeights,
      },
    };
  }).sort((left, right) => {
    if (left.eligible !== right.eligible) return left.eligible ? -1 : 1;
    return right.compositeScore - left.compositeScore;
  });

  const eligiblePrograms = evaluatedPrograms.filter((program) => program.eligible);
  const recommendedProgram = eligiblePrograms[0] || null;
  const insights = buildProfileInsights(applicant, recommendedProgram?.name);

  return {
    applicantId: applicant.applicantId,
    fullName: applicant.fullName,
    overallCET,
    eatScore: Number(applicant.eatScore),
    programs: eligiblePrograms.slice(0, 3),
    evaluations: evaluatedPrograms,
    recommendedProgram: recommendedProgram?.name || null,
    recommendationStatus: recommendedProgram?.status || "No Eligible Program",
    explanation:
      "Programs are eligible when the applicant's Overall CET meets the program-specific CET-OAPR minimum. Eligible programs are ranked by their weighted composite score using EAT, CET Quantitative, CET Science, and CET Abstract scores.",
    strengths: insights.strengths,
    improvementAreas: insights.improvementAreas,
    remarks: recommendedProgram
      ? `${insights.remarks} The highest eligible composite score is ${recommendedProgram.compositeScore}% for ${recommendedProgram.name}.`
      : `The applicant's Overall CET is ${overallCET}%, below the minimum CET-OAPR for all listed engineering programs.`,
  };
};
