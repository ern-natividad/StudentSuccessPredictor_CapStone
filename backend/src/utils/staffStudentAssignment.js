const PLACEHOLDER_SECTIONS = new Set([
  "unassigned",
  "n/a",
  "na",
  "none",
  "null",
  "undefined",
  "-",
  "--",
]);

const normalize = (value) => String(value || "").trim().toLowerCase();

const parseAssignedSections = (value) => {
  const sections = Array.isArray(value) ? value : String(value || "").split(/[,|]/);
  return [...new Set(
    sections
      .map((section) => String(section).trim())
      .filter((section) => {
        const normalized = normalize(section);
        return normalized && !PLACEHOLDER_SECTIONS.has(normalized);
      }),
  )].slice(0, 3);
};

const sectionMatchValues = (section) => {
  const normalized = normalize(section);
  if (!normalized || PLACEHOLDER_SECTIONS.has(normalized)) return [];

  const values = new Set([normalized]);
  const suffix = normalized
    .split(/[-\s]+/)
    .at(-1)
    ?.match(/^\d*([a-z])$/i)?.[1];
  if (suffix) values.add(suffix.toLowerCase());
  return [...values];
};

export const isStudentAssignedToStaff = (student, adviser) => {
  const assignedSections = parseAssignedSections(adviser?.assigned_section);
  const adviserYear = normalize(adviser?.year_level);
  if (assignedSections.length === 0 || !adviserYear) return false;

  const studentSections = sectionMatchValues(student?.section);
  const sectionMatches = assignedSections.some((section) =>
    sectionMatchValues(section).some((value) => studentSections.includes(value)),
  );
  if (!sectionMatches || normalize(student?.year_level) !== adviserYear) {
    return false;
  }

  const adviserProgram = normalize(adviser?.program);
  if (!adviserProgram || adviserProgram === "all programs") return true;

  const studentProgram = normalize(student?.program || student?.department);
  return studentProgram === adviserProgram;
};
