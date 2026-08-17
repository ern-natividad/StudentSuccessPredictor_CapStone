export const normalizeMatchValue = (value) =>
  String(value || "").trim().toLowerCase();

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
  adviserSection,
  adviserYearLevel,
) =>
  studentList.filter((student) =>
    isStudentAssignedToAdviser(student, adviserSection, adviserYearLevel),
  );

export const getStaffSectionLabel = (assignedSection, getSectionById) => {
  if (!assignedSection) return "Unassigned";
  return getSectionById(assignedSection)?.name || assignedSection;
};
