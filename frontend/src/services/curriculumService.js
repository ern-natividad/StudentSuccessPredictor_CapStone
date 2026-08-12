import { supabase } from "../lib/supabaseClient";

// Shared data layer for the Curriculum Manager (admin) and Curriculum Viewer
// (staff/admin) modules so both read and write the same Supabase-backed
// records instead of each keeping its own local copy.
const CURRICULUM_COLUMNS =
  "id, title, academic_year, department, program, status, courses, attachments, versions, approved_by, approved_at, created_at, updated_at";

// approved_by stores the approving admin's users.id (uuid), so resolve it to
// a display name via a lookup map rather than a relational embed, matching
// the separate-query-then-join style already used in userDirectory.js.
const buildApproverNamesById = async (approverIds) => {
  const ids = [...new Set(approverIds.filter(Boolean))];
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email")
    .in("id", ids);

  if (error) throw error;
  return new Map((data || []).map((u) => [u.id, u.full_name || u.email]));
};

const mapRowsToCurricula = async (rows) => {
  const approverNamesById = await buildApproverNamesById(
    rows.map((row) => row.approved_by),
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    academicYear: row.academic_year,
    department: row.department,
    program: row.program,
    status: row.status,
    courses: row.courses || [],
    attachments: row.attachments || [],
    versions: row.versions || [],
    approvedBy: row.approved_by,
    approvedByName: approverNamesById.get(row.approved_by) || null,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

export const getAllCurricula = async () => {
  const { data, error } = await supabase
    .from("curricula")
    .select(CURRICULUM_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return mapRowsToCurricula(data || []);
};

export const getPublishedCurricula = async () => {
  const { data, error } = await supabase
    .from("curricula")
    .select(CURRICULUM_COLUMNS)
    .eq("status", "Published")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return mapRowsToCurricula(data || []);
};

export const createCurriculum = async ({
  title,
  academicYear,
  department,
  program,
  status,
  courses,
  attachments,
}) => {
  const { data, error } = await supabase
    .from("curricula")
    .insert({
      title,
      academic_year: academicYear,
      department,
      program,
      status,
      courses,
      attachments,
      versions: [],
    })
    .select(CURRICULUM_COLUMNS)
    .single();

  if (error) throw error;
  const [mapped] = await mapRowsToCurricula([data]);
  return mapped;
};

export const updateCurriculum = async (id, fields) => {
  const { data, error } = await supabase
    .from("curricula")
    .update({
      title: fields.title,
      academic_year: fields.academicYear,
      department: fields.department,
      program: fields.program,
      status: fields.status,
      courses: fields.courses,
      attachments: fields.attachments,
      versions: fields.versions,
    })
    .eq("id", id)
    .select(CURRICULUM_COLUMNS)
    .single();

  if (error) throw error;
  const [mapped] = await mapRowsToCurricula([data]);
  return mapped;
};

export const deleteCurriculum = async (id) => {
  const { error } = await supabase.from("curricula").delete().eq("id", id);
  if (error) throw error;
};

export const approveCurriculum = async (id, approverId) => {
  const { data, error } = await supabase
    .from("curricula")
    .update({
      status: "Published",
      approved_by: approverId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(CURRICULUM_COLUMNS)
    .single();

  if (error) throw error;
  const [mapped] = await mapRowsToCurricula([data]);
  return mapped;
};
