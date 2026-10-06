import { HttpError } from "../middleware/errorHandler.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const normalizeText = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const normalizeCode = (value) => normalizeText(value).toUpperCase();

const normalizeScope = (scope) => {
  const type = normalizeText(scope?.type).toLowerCase();

  if (type === "shared") {
    return { scope_type: "shared", department: null, program_id: null };
  }

  if (type === "department") {
    const department = normalizeText(scope?.department);
    if (!department)
      throw new HttpError(400, "Department scope requires a department.");
    return { scope_type: "department", department, program_id: null };
  }

  if (type === "program") {
    const programId = normalizeText(scope?.programId || scope?.program_id);
    if (!UUID_PATTERN.test(programId)) {
      throw new HttpError(400, "Program scope requires a valid program.");
    }
    return { scope_type: "program", department: null, program_id: programId };
  }

  throw new HttpError(
    400,
    "Course scope must be shared, department, or program.",
  );
};

export const normalizeCourseScopes = (scopes) => {
  if (!Array.isArray(scopes) || scopes.length === 0) {
    throw new HttpError(400, "At least one course scope is required.");
  }

  const normalized = scopes.map(normalizeScope);
  const unique = new Map();
  normalized.forEach((scope) => {
    const key = `${scope.scope_type}:${scope.department?.toLowerCase() || scope.program_id || ""}`;
    if (!unique.has(key)) unique.set(key, scope);
  });
  return Array.from(unique.values());
};

const normalizeNumber = (value, field) => {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number) || number < 0) {
    throw new HttpError(400, `${field} must be a non-negative number.`);
  }
  return number;
};

export const normalizeCoursePayload = (payload = {}) => {
  const code = normalizeText(payload.code);
  const title = normalizeText(payload.title);
  if (!title) {
    throw new HttpError(400, "Course title is required.");
  }

  return {
    code,
    title,
    units: normalizeNumber(payload.units, "Units"),
    lec: normalizeNumber(payload.lec, "Lecture units"),
    lab: normalizeNumber(payload.lab, "Lab units"),
    type: normalizeText(payload.type) || "Professional",
    prerequisites: normalizeText(payload.prerequisites) || "None",
    description: normalizeText(payload.description),
  };
};

const normalizedScopeKey = (scope) => {
  if (scope.scope_type === "shared" || scope.type === "shared")
    return "shared:";
  if (scope.scope_type === "department" || scope.type === "department") {
    const department = scope.department || "";
    return `department:${normalizeText(department).toLowerCase()}`;
  }
  return `program:${scope.program_id || scope.programId || ""}`.toLowerCase();
};

export const hasDuplicateCourseScope = (
  existingCourses,
  code,
  scopes,
  title = "",
  excludedCourseId = null,
) => {
  const requestedCode = normalizeCode(code);
  const requestedTitle = normalizeText(title).toLowerCase();
  const requestedScopes = new Set(scopes.map(normalizedScopeKey));

  return existingCourses.some((course) => {
    if (course.id === excludedCourseId) {
      return false;
    }
    const courseCode = normalizeCode(course.code);
    const sameCourse = requestedCode
      ? courseCode === requestedCode
      : !courseCode &&
        normalizeText(course.title).toLowerCase() === requestedTitle;
    if (!sameCourse) return false;

    return (course.course_catalog_scopes || []).some((scope) =>
      requestedScopes.has(normalizedScopeKey(scope)),
    );
  });
};
