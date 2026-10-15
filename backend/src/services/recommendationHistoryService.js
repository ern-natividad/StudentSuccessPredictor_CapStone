import { supabase } from "../config/supabaseClient.js";

export const getNextApplicantId = async () => {
  const { data, error } = await supabase.rpc(
    "next_pre_enrollment_applicant_id",
  );

  if (error) throw error;
  if (typeof data !== "string" || !/^APP-\d{4}-\d{3,}$/.test(data)) {
    throw new Error("The database returned an invalid applicant ID.");
  }
  return data;
};

export const saveProgramRecommendation = async ({
  applicant,
  recommendation,
  createdBy,
}) => {
  const { data, error } = await supabase
    .from("pre_enrollment_recommendations")
    .insert({
      ...(applicant.applicantId
        ? { applicant_id: applicant.applicantId }
        : {}),
      full_name: applicant.fullName,
      applicant_data: applicant,
      recommendation_summary: recommendation,
      recommended_program: recommendation.recommendedProgram,
      composite_score: recommendation.programs[0]?.compositeScore ?? null,
      overall_cet: recommendation.overallCET,
      status: recommendation.recommendationStatus,
      created_by: createdBy,
    })
    .select(
      "id, applicant_id, full_name, recommended_program, composite_score, overall_cet, status, created_at",
    )
    .single();

  if (error) throw error;
  return data;
};

export const listProgramRecommendationHistory = async ({ limit = 500 } = {}) => {
  const { data, error } = await supabase
    .from("pre_enrollment_recommendations")
    .select(
      "id, applicant_id, full_name, recommended_program, composite_score, overall_cet, status, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};
