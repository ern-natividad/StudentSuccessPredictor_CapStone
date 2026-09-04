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

export const SCHOOL_YEAR_INFO_TEXT =
  "School year format: YYYY-YYYY (e.g. 2025-2026). Academic year runs June to May.";

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

export const normalizeSchoolYear = (value) => {
  const text = String(value || "").trim();
  if (!text) return "";

  const match = text.match(/^(\d{4})\s*[-–/]\s*(\d{4})$/);
  if (!match) return text;

  const start = Number(match[1]);
  const end = Number(match[2]);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end !== start + 1) {
    return text;
  }

  return `${start}-${end}`;
};

export const formatSchoolYear = (value) => normalizeSchoolYear(value) || "—";

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

export const getCurrentAcademicYear = () => getAcademicYearFromDate(new Date());

/** Prefer stored school_year; fall back to created_at for legacy rows. */
export const getSchoolYearFromRecord = (record) => {
  const stored = normalizeSchoolYear(record?.school_year);
  if (stored) return stored;
  return getAcademicYearFromDate(record?.created_at);
};

export const matchesSchoolYearFilter = (record, filterValue) => {
  if (!filterValue) return true;
  return getSchoolYearFromRecord(record) === normalizeSchoolYear(filterValue);
};

/** Dropdown options: recent years around the current academic year. */
export const buildSchoolYearOptions = (span = 6) => {
  const current = getCurrentAcademicYear();
  const startYear = Number(String(current).split("-")[0]);
  if (!Number.isFinite(startYear)) return [current];

  const years = [];
  for (let offset = 0; offset < span; offset += 1) {
    const start = startYear - offset;
    years.push(`${start}-${start + 1}`);
  }
  return years;
};

export const getUniqueAcademicYears = (gradeRecords) =>
  [...new Set(gradeRecords.map((record) => getSchoolYearFromRecord(record)))]
    .filter((year) => year && year !== "Unknown")
    .sort((left, right) => right.localeCompare(left));

export const enrichGradeRecord = (record) => ({
  ...record,
  semesterCode: formatSemesterCode(record.semester),
  academicYear: getSchoolYearFromRecord(record),
});
