import { supabase } from "../config/supabaseClient.js";
import { HttpError } from "../middleware/errorHandler.js";
import {
  FALLBACK_FIRST_YEAR_COURSES,
  resolveProgramById,
} from "../data/engineeringPrograms.js";

const normalizeSemester = (value) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  if (normalized === "1" || normalized === "1S" || normalized === "1STSEM") return "1";
  if (normalized === "2" || normalized === "2S" || normalized === "2NDSEM") return "2";
  if (normalized === "S" || normalized === "SUMMER") return "S";
  return normalized;
};

const normalizeYearLevel = (value) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  if (normalized.startsWith("1")) return "1Y";
  return normalized;
};

const parsePrerequisites = (value) => {
  const raw = String(value || "").trim();
  if (!raw || /^none$/i.test(raw) || /^n\/a$/i.test(raw)) return [];

  return raw
    .split(/[,;/]+/)
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
};

const normalizeCourseRecord = (course = {}) => ({
  code: String(course.code || course.subjectCode || "").trim().toUpperCase(),
  title: String(course.title || course.subject || "Untitled Course").trim(),
  units: Number(course.units) || 0,
  semester: normalizeSemester(course.semester),
  yearLevel: normalizeYearLevel(course.yearLevel || course.year),
  prerequisites: Array.isArray(course.prerequisites)
    ? course.prerequisites.map((item) => String(item).trim().toUpperCase())
    : parsePrerequisites(course.prerequisites),
  type: course.type || "Lecture",
});

const prerequisitesMet = (course, completedCoursesSet) =>
  course.prerequisites.every((prerequisite) => completedCoursesSet.has(prerequisite));

const isFirstYearFirstSemester = (course) =>
  course.yearLevel === "1Y" && course.semester === "1";

/**
 * Loads published curriculum courses for a program from Supabase.
 * Falls back to embedded first-year templates when no record exists.
 */
const fetchProgramCourses = async (program) => {
  const { data, error } = await supabase
    .from("curricula")
    .select("id, program, courses, status")
    .eq("status", "Published")
    .ilike("program", `%${program.name}%`)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (data?.courses?.length) {
    return {
      source: "curriculum_database",
      curriculumId: data.id,
      courses: data.courses.map(normalizeCourseRecord),
    };
  }

  return {
    source: "fallback_template",
    curriculumId: null,
    courses: (FALLBACK_FIRST_YEAR_COURSES[program.id] || []).map(normalizeCourseRecord),
  };
};

/**
 * Builds an eligible first-year first-semester schedule up to maxUnitsAllowed.
 */
export const generatePreEnrollmentSchedule = async ({
  applicantId,
  programId,
  completedCourses,
  maxUnitsAllowed,
}) => {
  const program = resolveProgramById(programId);
  if (!program) {
    throw new HttpError(404, "Program not found. Use a valid engineering program ID.");
  }

  const { source, curriculumId, courses } = await fetchProgramCourses(program);
  const completedSet = new Set(completedCourses.map((code) => code.toUpperCase()));

  const eligibleCourses = courses
    .filter(isFirstYearFirstSemester)
    .filter((course) => prerequisitesMet(course, completedSet))
    .sort((left, right) => left.code.localeCompare(right.code));

  const suggestedCourses = [];
  let totalUnits = 0;

  for (const course of eligibleCourses) {
    if (totalUnits + course.units > maxUnitsAllowed) continue;
    suggestedCourses.push(course);
    totalUnits += course.units;
  }

  return {
    applicantId,
    programId: program.id,
    programName: program.name,
    curriculumSource: source,
    curriculumId,
    maxUnitsAllowed,
    totalUnitsSuggested: totalUnits,
    completedCourses,
    courses: suggestedCourses,
    message:
      suggestedCourses.length > 0
        ? "Suggested first-year first-semester load based on published curriculum and completed prerequisites."
        : "No eligible first-year first-semester courses found for the selected program and completed course history.",
  };
};
