export const MAX_ADVISER_SECTIONS = 3;
export const ALL_PROGRAMS_OPTION = "All Programs";

const PLACEHOLDER_SECTION_VALUES = new Set([
  "unassigned",
  "n/a",
  "na",
  "none",
  "null",
  "undefined",
  "-",
  "--",
]);

export const normalizeMatchValue = (value) =>
  String(value || "").trim().toLowerCase();

const isRealSectionValue = (value) => {
  const normalized = normalizeMatchValue(value);
  return Boolean(normalized) && !PLACEHOLDER_SECTION_VALUES.has(normalized);
};

export const parseAssignedSections = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return [
      ...new Set(
        value
          .map((section) => String(section).trim())
          .filter(isRealSectionValue),
      ),
    ].slice(0, MAX_ADVISER_SECTIONS);
  }

  return [
    ...new Set(
      String(value)
        .split(/[,|]/)
        .map((section) => section.trim())
        .filter(isRealSectionValue),
    ),
  ].slice(0, MAX_ADVISER_SECTIONS);
};

export const serializeAssignedSections = (sections = []) =>
  parseAssignedSections(sections).join(",") || null;

export const getStaffAssignedSections = (staff) => {
  if (staff?.assignedSections?.length) {
    return parseAssignedSections(staff.assignedSections);
  }

  return parseAssignedSections(staff?.assignedSection);
};

export const areAllSectionsSelected = (selectedSections = [], availableSections = []) => {
  const selected = parseAssignedSections(selectedSections);
  const available = parseAssignedSections(availableSections);

  if (available.length === 0) return false;

  return (
    available.length <= MAX_ADVISER_SECTIONS &&
    available.every((section) => selected.includes(section)) &&
    selected.length === available.length
  );
};

export const getStudentSectionValue = (student) =>
  student.section || student.assignedSectionId || "";

export const getStudentProgramValue = (student) =>
  student.program || student.department || "";

export const isProgramMatch = (studentProgram, adviserProgram) => {
  const normalizedAdviserProgram = normalizeMatchValue(adviserProgram);
  if (
    !normalizedAdviserProgram ||
    normalizedAdviserProgram === normalizeMatchValue(ALL_PROGRAMS_OPTION)
  ) {
    return true;
  }

  return (
    normalizeMatchValue(studentProgram) === normalizedAdviserProgram
  );
};

export const isStudentAssignedToAdviser = (
  student,
  adviserSection,
  adviserYearLevel,
  adviserProgram = ALL_PROGRAMS_OPTION,
) => {
  const normalizedAdviserSection = normalizeMatchValue(adviserSection);
  const normalizedAdviserYear = normalizeMatchValue(adviserYearLevel);
  const normalizedStudentSection = normalizeMatchValue(
    getStudentSectionValue(student),
  );
  const normalizedStudentYear = normalizeMatchValue(
    student.yearLevel || student.year_level,
  );

  if (
    !normalizedAdviserSection ||
    !normalizedAdviserYear ||
    !isRealSectionValue(adviserSection)
  ) {
    return false;
  }

  const sectionAndYearMatch =
    normalizedStudentSection === normalizedAdviserSection &&
    normalizedStudentYear === normalizedAdviserYear;

  if (!sectionAndYearMatch) return false;

  return isProgramMatch(getStudentProgramValue(student), adviserProgram);
};

export const filterStudentsForAdviser = (
  studentList,
  adviserSections,
  adviserYearLevel,
  adviserProgram = ALL_PROGRAMS_OPTION,
) => {
  const sections = parseAssignedSections(adviserSections);

  if (sections.length === 0 || !adviserYearLevel) {
    return [];
  }

  return studentList.filter((student) =>
    sections.some((section) =>
      isStudentAssignedToAdviser(
        student,
        section,
        adviserYearLevel,
        adviserProgram,
      ),
    ),
  );
};

export const getStaffSectionLabel = (assignedSection, getSectionById) => {
  if (!isRealSectionValue(assignedSection)) return "Unassigned";

  const section = getSectionById?.(assignedSection);
  const label = section?.name || assignedSection;

  if (!isRealSectionValue(label)) return "Unassigned";
  return label;
};

export const getStaffSectionsLabel = (
  assignedSections,
  getSectionById,
  availableSections = [],
) => {
  const sections = parseAssignedSections(assignedSections);

  if (sections.length === 0) return "Unassigned";

  if (
    availableSections.length > 0 &&
    areAllSectionsSelected(sections, availableSections)
  ) {
    return "All";
  }

  const labels = sections
    .map((section) => getStaffSectionLabel(section, getSectionById))
    .filter(isRealSectionValue);

  return labels.length > 0 ? labels.join(", ") : "Unassigned";
};
