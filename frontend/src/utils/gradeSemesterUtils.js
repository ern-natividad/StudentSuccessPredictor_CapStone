export const SEMESTER_FILTER_OPTIONS = [
  { value: "", label: "All semesters" },
  { value: "1", label: "1 — 1st Semester" },
  { value: "2", label: "2 — 2nd Semester" },
  { value: "S", label: "S — Summer" },
];

export const SEMESTER_FORM_OPTIONS = [
  { value: "1", label: "1 — 1st Semester" },
  { value: "2", label: "2 — 2nd Semester" },
  { value: "S", label: "S — Summer" },
];

export const SEMESTER_INFO_TEXT =
  "Semester codes: 1 = 1st Semester, 2 = 2nd Semester, S = Summer.";

export const normalizeSemesterCode = (value) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  if (!normalized) return "";

  if (normalized === "1" || normalized === "1S" || normalized === "1STSEMESTER") {
    return "1";
  }

  if (normalized === "2" || normalized === "2S" || normalized === "2NDSEMESTER") {
    return "2";
  }

  if (normalized === "S" || normalized === "SUMMER") {
    return "S";
  }

  return normalized;
};

export const formatSemesterCode = (value) => normalizeSemesterCode(value) || "—";

export const matchesSemesterFilter = (recordSemester, filterValue) => {
  if (!filterValue) return true;
  return normalizeSemesterCode(recordSemester) === normalizeSemesterCode(filterValue);
};

export const getAcademicYearFromDate = (dateInput) => {
  if (!dateInput) return "Unknown";

  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "Unknown";

  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  // Academic year runs June to May (e.g. June 2025 → 2025-2026).
  if (month >= 6) {
    return `${year}-${year + 1}`;
  }

  return `${year - 1}-${year}`;
};

export const getUniqueAcademicYears = (gradeRecords) =>
  [...new Set(gradeRecords.map((record) => getAcademicYearFromDate(record.created_at)))]
    .filter((year) => year !== "Unknown")
    .sort((left, right) => right.localeCompare(left));

export const enrichGradeRecord = (record) => ({
  ...record,
  semesterCode: formatSemesterCode(record.semester),
  academicYear: getAcademicYearFromDate(record.created_at),
});
