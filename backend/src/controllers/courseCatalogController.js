import { supabase } from "../config/supabaseClient.js";
import { HttpError } from "../middleware/errorHandler.js";
import {
  hasDuplicateCourseScope,
  normalizeCoursePayload,
  normalizeCourseScopes,
} from "../utils/courseCatalog.js";

const COURSE_COLUMNS =
  "id, code, title, units, lec, lab, type, prerequisites, description, is_active, created_at, updated_at, course_catalog_scopes(scope_type, department, program_id)";

export const listCourseCatalog = async (req, res) => {
  const { data, error } = await supabase
    .from("course_catalog")
    .select(COURSE_COLUMNS)
    .eq("is_active", true)
    .order("code", { ascending: true });

  if (error) throw error;
  res.status(200).json({ courses: data || [] });
};

export const createCourseCatalogEntry = async (req, res) => {
  const course = normalizeCoursePayload(req.body);
  const scopes = normalizeCourseScopes(req.body.scopes);

  const { data: existing, error: existingError } = await supabase
    .from("course_catalog")
    .select(
      "id, code, title, course_catalog_scopes(scope_type, department, program_id)",
    )
    .eq("is_active", true);

  if (existingError) throw existingError;
  if (
    hasDuplicateCourseScope(existing || [], course.code, scopes, course.title)
  ) {
    throw new HttpError(
      409,
      "A course with this code already exists in that scope.",
    );
  }

  const { data, error } = await supabase
    .from("course_catalog")
    .insert(course)
    .select(
      "id, code, title, units, lec, lab, type, prerequisites, description, is_active, created_at, updated_at",
    )
    .single();

  if (error) throw error;

  const scopeRows = scopes.map((scope) => ({ ...scope, course_id: data.id }));
  const { error: scopeError } = await supabase
    .from("course_catalog_scopes")
    .insert(scopeRows);

  if (scopeError) {
    await supabase.from("course_catalog").delete().eq("id", data.id);
    throw scopeError;
  }

  res.status(201).json({ course: { ...data, course_catalog_scopes: scopes } });
};

export const updateCourseCatalogEntry = async (req, res) => {
  const { id } = req.params;
  const course = normalizeCoursePayload(req.body);
  const scopes = normalizeCourseScopes(req.body.scopes);

  const { data: current, error: currentError } = await supabase
    .from("course_catalog")
    .select("id")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (currentError) throw currentError;
  if (!current) throw new HttpError(404, "Course catalog entry not found.");

  const { data: existing, error: existingError } = await supabase
    .from("course_catalog")
    .select(
      "id, code, title, course_catalog_scopes(scope_type, department, program_id)",
    )
    .eq("is_active", true);

  if (existingError) throw existingError;
  if (
    hasDuplicateCourseScope(
      existing || [],
      course.code,
      scopes,
      course.title,
      id,
    )
  ) {
    throw new HttpError(
      409,
      "A course with this code or title already exists in one of those scopes.",
    );
  }

  const { data: updated, error: updateError } = await supabase.rpc(
    "update_course_catalog_entry",
    {
      p_course_id: id,
      p_course: course,
      p_scopes: scopes,
    },
  );

  if (updateError) {
    if (updateError.code === "23505") {
      throw new HttpError(
        409,
        "A course with this code or title already exists in one of those scopes.",
      );
    }
    throw updateError;
  }
  if (updated === false) {
    throw new HttpError(404, "Course catalog entry not found.");
  }

  const { data, error } = await supabase
    .from("course_catalog")
    .select(COURSE_COLUMNS)
    .eq("id", id)
    .single();

  if (error) throw error;
  res.status(200).json({ course: data });
};

export const archiveCourseCatalogEntry = async (req, res) => {
  const { data, error } = await supabase
    .from("course_catalog")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .eq("is_active", true)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new HttpError(404, "Course catalog entry not found.");
  res.status(200).json({ success: true });
};
