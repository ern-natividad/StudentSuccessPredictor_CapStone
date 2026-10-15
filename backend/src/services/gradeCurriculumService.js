import { supabase } from "../config/supabaseClient.js";
import { HttpError } from "../middleware/errorHandler.js";

const normalizeCourseCode = (value) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

const normalizeSemester = (value) => {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (
    ["1", "1S", "1STSEMESTER", "FIRSTSEMESTER"].includes(normalized)
  ) {
    return "1";
  }
  if (
    ["2", "2S", "2NDSEMESTER", "SECONDSEMESTER"].includes(normalized)
  ) {
    return "2";
  }
  if (["S", "SUMMER"].includes(normalized)) return "S";
  return "";
};

const parseAcademicYearStart = (value) => {
  const match = String(value ?? "")
    .trim()
    .match(/^(\d{4})\s*[-–/]\s*(\d{4})$/);
  if (!match || Number(match[2]) !== Number(match[1]) + 1) return null;
  return Number(match[1]);
};

const parseYearLevel = (value) => {
  const match = String(value ?? "").match(/\d+/);
  return match ? Number(match[0]) : null;
};

export const resolveEligibleCurriculumCourses = (
  profile,
  curricula,
  schoolYear,
  semester,
  cohortStartYearOverride = null,
) => {
  const yearLevel = parseYearLevel(profile?.year_level);
  const program = String(profile?.program ?? "").trim();
  const semesterCode = normalizeSemester(semester);
  const hasCohortOverride = cohortStartYearOverride !== null;
  const schoolYearStart = hasCohortOverride
    ? parseAcademicYearStart(schoolYear)
    : null;
  const cohortStart = hasCohortOverride
    ? Number(cohortStartYearOverride)
    : null;
  if (!yearLevel || !program || !semesterCode) return [];

  const targetYearLevel =
    hasCohortOverride && schoolYearStart && Number.isInteger(cohortStart)
      ? schoolYearStart - cohortStart + 1
      : yearLevel;
  if (
    targetYearLevel < 1 ||
    (hasCohortOverride &&
      (!schoolYearStart || !Number.isInteger(cohortStart) || cohortStart < 1900))
  ) {
    return [];
  }

  const eligibleCourses = new Map();
  for (const curriculum of curricula || []) {
    if (String(curriculum.program ?? "").trim().toLowerCase() !== program.toLowerCase()) {
      continue;
    }

    for (const course of Array.isArray(curriculum.courses)
      ? curriculum.courses
      : []) {
      const code = String(course.code ?? "").trim();
      const normalizedCode = normalizeCourseCode(code);
      const title = String(course.title ?? "").trim();
      if (
        !normalizedCode ||
        !title ||
        parseYearLevel(course.yearLevel) !== targetYearLevel ||
        normalizeSemester(course.semester) !== semesterCode
      ) {
        continue;
      }

      const existing = eligibleCourses.get(normalizedCode);
      if (existing && existing.title.toLowerCase() !== title.toLowerCase()) {
        throw new HttpError(
          409,
          `Published curricula contain conflicting names for course ${code}.`,
        );
      }
      eligibleCourses.set(normalizedCode, {
        code,
        title,
        yearLevel: String(course.yearLevel),
        semester: semesterCode,
      });
    }
  }

  return [...eligibleCourses.values()].sort((left, right) =>
    left.code.localeCompare(right.code),
  );
};

export const getStudentGradeProfile = async (userId) => {
  const { data, error } = await supabase
    .from("student_info")
    .select("user_id, program, year_level")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.program || !data?.year_level) {
    throw new HttpError(
      400,
      "The student needs an assigned program and year level before grades can be added.",
    );
  }
  return data;
};

export const getEligibleGradeCourses = async (
  profile,
  schoolYear,
  semester,
  cohortStartYearOverride = null,
) => {
  const { data, error } = await supabase
    .from("curricula")
    .select("program, academic_year, courses")
    .eq("status", "Published")
    .ilike("program", profile.program);
  if (error) throw error;

  return resolveEligibleCurriculumCourses(
    profile,
    data || [],
    schoolYear,
    semester,
    cohortStartYearOverride,
  );
};

export const normalizeCurriculumCourseCode = normalizeCourseCode;
