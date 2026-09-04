import { supabase } from "../config/supabaseClient.js";
import { HttpError } from "../middleware/errorHandler.js";

const PROGRAM_COLUMNS = "id, name, code, is_active, created_at, updated_at";

const normalizeProgramName = (value) => String(value || "").replace(/\s+/g, " ").trim();

const normalizeProgramCode = (value) => {
  const text = String(value || "").trim();
  return text ? text.toUpperCase() : null;
};

const countProgramUsage = async (programName) => {
  const [curricula, students, advisers, users] = await Promise.all([
    supabase
      .from("curricula")
      .select("id", { count: "exact", head: true })
      .eq("program", programName),
    supabase
      .from("student_info")
      .select("user_id", { count: "exact", head: true })
      .eq("program", programName),
    supabase
      .from("adviser_info")
      .select("user_id", { count: "exact", head: true })
      .eq("program", programName),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("program", programName),
  ]);

  for (const result of [curricula, students, advisers, users]) {
    if (result.error) throw result.error;
  }

  return {
    curricula: curricula.count || 0,
    students: students.count || 0,
    advisers: advisers.count || 0,
    users: users.count || 0,
    total:
      (curricula.count || 0) +
      (students.count || 0) +
      (advisers.count || 0) +
      (users.count || 0),
  };
};

const renameProgramReferences = async (oldName, newName) => {
  const updates = await Promise.all([
    supabase.from("curricula").update({ program: newName }).eq("program", oldName),
    supabase.from("student_info").update({ program: newName }).eq("program", oldName),
    supabase.from("adviser_info").update({ program: newName }).eq("program", oldName),
    supabase.from("users").update({ program: newName }).eq("program", oldName),
  ]);

  for (const result of updates) {
    if (result.error) throw result.error;
  }
};

export const listPrograms = async (req, res) => {
  const includeInactive = String(req.query.includeInactive || "") === "true";
  let query = supabase
    .from("programs")
    .select(PROGRAM_COLUMNS)
    .order("name", { ascending: true });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  res.status(200).json({ programs: data || [] });
};

export const createProgram = async (req, res) => {
  const name = normalizeProgramName(req.body.name);
  const code = normalizeProgramCode(req.body.code);

  if (!name) {
    throw new HttpError(400, "Program name is required.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("programs")
    .select("id")
    .ilike("name", name)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    throw new HttpError(409, `Program "${name}" already exists.`);
  }

  const { data, error } = await supabase
    .from("programs")
    .insert({
      name,
      code,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .select(PROGRAM_COLUMNS)
    .single();
  if (error) throw error;

  res.status(201).json({ program: data });
};

export const updateProgram = async (req, res) => {
  const { id } = req.params;
  const name = normalizeProgramName(req.body.name);
  const code =
    req.body.code === undefined ? undefined : normalizeProgramCode(req.body.code);
  const isActive =
    req.body.is_active === undefined && req.body.isActive === undefined
      ? undefined
      : Boolean(
          req.body.is_active !== undefined ? req.body.is_active : req.body.isActive,
        );

  if (!name) {
    throw new HttpError(400, "Program name is required.");
  }

  const { data: current, error: currentError } = await supabase
    .from("programs")
    .select(PROGRAM_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (currentError) throw currentError;
  if (!current) throw new HttpError(404, "Program not found.");

  const { data: duplicate, error: duplicateError } = await supabase
    .from("programs")
    .select("id")
    .ilike("name", name)
    .neq("id", id)
    .maybeSingle();
  if (duplicateError) throw duplicateError;
  if (duplicate) {
    throw new HttpError(409, `Program "${name}" already exists.`);
  }

  const updates = {
    name,
    updated_at: new Date().toISOString(),
  };
  if (code !== undefined) updates.code = code;
  if (isActive !== undefined) updates.is_active = isActive;

  const { data, error } = await supabase
    .from("programs")
    .update(updates)
    .eq("id", id)
    .select(PROGRAM_COLUMNS)
    .single();
  if (error) throw error;

  if (current.name !== name) {
    await renameProgramReferences(current.name, name);
  }

  res.status(200).json({ program: data });
};

export const deleteProgram = async (req, res) => {
  const { id } = req.params;

  const { data: current, error: currentError } = await supabase
    .from("programs")
    .select(PROGRAM_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (currentError) throw currentError;
  if (!current) throw new HttpError(404, "Program not found.");

  const usage = await countProgramUsage(current.name);
  if (usage.total > 0) {
    throw new HttpError(
      409,
      `Cannot delete "${current.name}" because it is still used by ${usage.total} record(s) (curricula: ${usage.curricula}, students: ${usage.students}, advisers: ${usage.advisers}, profiles: ${usage.users}).`,
    );
  }

  const { data: remaining, error: remainingError } = await supabase
    .from("programs")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .neq("id", id);
  if (remainingError) throw remainingError;
  if ((remaining.count || 0) <= 0) {
    throw new HttpError(400, "At least one active program must remain available.");
  }

  const { error } = await supabase.from("programs").delete().eq("id", id);
  if (error) throw error;

  res.status(200).json({ success: true });
};
