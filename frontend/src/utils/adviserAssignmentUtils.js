export const MAX_ADVISER_SECTIONS = 3;

export const normalizeMatchValue = (value) =>
  String(value || "").trim().toLowerCase();

export const parseAssignedSections = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return [...new Set(value.map((section) => String(section).trim()).filter(Boolean))].slice(
      0,
      MAX_ADVISER_SECTIONS,
    );
  }

  return [
    ...new Set(
      String(value)
        .split(/[,|]/)
        .map((section) => section.trim())
        .filter(Boolean),
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

export const getStudentSectionValue = (student) =>
  student.section || student.assignedSectionId || "";

export const isStudentAssignedToAdviser = (
  student,
  adviserSection,
  adviserYearLevel,
) => {
  const normalizedAdviserSection = normalizeMatchValue(adviserSection);
  const normalizedAdviserYear = normalizeMatchValue(adviserYearLevel);
  const normalizedStudentSection = normalizeMatchValue(
    getStudentSectionValue(student),
  );
  const normalizedStudentYear = normalizeMatchValue(
    student.yearLevel || student.year_level,
  );

  if (!normalizedAdviserSection || !normalizedAdviserYear) {
    return false;
  }

  return (
    normalizedStudentSection === normalizedAdviserSection &&
    normalizedStudentYear === normalizedAdviserYear
  );
};

export const filterStudentsForAdviser = (
  studentList,
  adviserSections,
  adviserYearLevel,
) => {
  const sections = parseAssignedSections(adviserSections);

  if (sections.length === 0 || !adviserYearLevel) {
    return [];
  }

  return studentList.filter((student) =>
    sections.some((section) =>
      isStudentAssignedToAdviser(student, section, adviserYearLevel),
    ),
  );
};

export const getStaffSectionLabel = (assignedSection, getSectionById) => {
  if (!assignedSection) return "Unassigned";
  return getSectionById(assignedSection)?.name || assignedSection;
};

export const getStaffSectionsLabel = (assignedSections, getSectionById) => {
  const sections = parseAssignedSections(assignedSections);

  if (sections.length === 0) return "Unassigned";

  return sections
    .map((section) => getStaffSectionLabel(section, getSectionById))
    .join(", ");
};
