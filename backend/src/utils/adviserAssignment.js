const normalize = (value) => String(value || "").trim().toLowerCase();

const normalizeYearLevel = (value) => {
  const normalized = normalize(value);
  const ordinal = normalized.match(/^(\d+)(?:st|nd|rd|th)?(?:\s+year)?$/);
  return ordinal ? ordinal[1] : normalized;
};

const PLACEHOLDER_SECTIONS = new Set([
  "unassigned",
  "n/a",
  "na",
  "none",
  "null",
  "-",
  "--",
]);

const isRealSection = (value) =>
  Boolean(normalize(value)) &&
  !PLACEHOLDER_SECTIONS.has(normalize(value));

const sectionMatchValues = (value) => {
  const normalized = normalize(value);
  if (!isRealSection(value)) return [];

  const values = new Set([normalized]);
  const suffix = normalized
    .split(/[-\s]+/)
    .at(-1)
    ?.match(/^\d*([a-z])$/i)?.[1];
  if (suffix) values.add(suffix.toLowerCase());
  return [...values];
};

export const isStudentAssignedToStaff = (student, assignments) => {
  const studentYear = normalizeYearLevel(student?.year_level);
  const studentSchoolYear = normalize(student?.school_year);
  const studentProgram = normalize(student?.program || student?.department);
  const studentSections = sectionMatchValues(student?.section);

  if (
    !studentYear ||
    !studentSchoolYear ||
    !studentProgram ||
    studentSections.length === 0
  ) {
    return false;
  }

  return (Array.isArray(assignments) ? assignments : [assignments]).some(
    (assignment) => {
      if (!assignment || assignment.is_active === false) return false;
      const sections = Array.isArray(assignment.sections)
        ? assignment.sections
        : [assignment.section];
      const assignmentProgram = normalize(assignment.program);
      return (
        normalize(assignment.school_year) === studentSchoolYear &&
        normalizeYearLevel(assignment.year_level) === studentYear &&
        (assignmentProgram === "all programs" ||
          assignmentProgram === studentProgram) &&
        sections.some((section) =>
          sectionMatchValues(section).some((value) =>
            studentSections.includes(value),
          ),
        )
      );
    },
  );
};
