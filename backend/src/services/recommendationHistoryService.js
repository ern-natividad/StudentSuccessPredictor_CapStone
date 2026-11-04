import { supabase } from "../config/supabaseClient.js";

export const getNextApplicantId = async () => {
  const { data, error } = await supabase.rpc(
    "preview_pre_enrollment_applicant_id",
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
  const { data, error } = await supabase.rpc(
    "create_pre_enrollment_recommendation",
    {
      p_applicant: applicant,
      p_created_by: createdBy,
      p_recommendation: recommendation,
    },
  );

  if (error) throw error;
  if (!data?.applicant_id || !data?.id) {
    throw new Error("The database returned an invalid recommendation record.");
  }
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
