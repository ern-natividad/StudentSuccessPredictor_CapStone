export const YEAR_LEVEL_ORDER = ["1Y", "2Y", "3Y", "4Y"];
export const SEMESTER_ORDER = ["1S", "2S", "Summer"];

export const YEAR_LEVEL_LABELS = {
  "1Y": "FIRST YEAR",
  "2Y": "SECOND YEAR",
  "3Y": "THIRD YEAR",
  "4Y": "FOURTH YEAR",
  Summer: "SUMMER",
};

export const SEMESTER_LABELS = {
  "1S": "First Semester",
  "2S": "Second Semester",
  Summer: "Summer",
};

const normalizeYearLevel = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "1Y";
  if (/^summer$/i.test(raw)) return "Summer";
  if (/^1/.test(raw)) return "1Y";
  if (/^2/.test(raw)) return "2Y";
  if (/^3/.test(raw)) return "3Y";
  if (/^4/.test(raw)) return "4Y";
  return raw;
};

const normalizeSemester = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "1S";
  if (/summer/i.test(raw)) return "Summer";
  if (/^2|second|2nd/i.test(raw)) return "2S";
  if (/^1|first|1st/i.test(raw)) return "1S";
  return raw;
};

export const getCourseLec = (course) => Number(course?.lec ?? 0) || 0;
export const getCourseLab = (course) => Number(course?.lab ?? 0) || 0;
export const getCourseTotalUnits = (course) => {
  const explicit = Number(course?.units);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  return getCourseLec(course) + getCourseLab(course);
};

export const formatPrerequisite = (value) => {
  const text = String(value ?? "").trim();
  if (!text || /^none$/i.test(text) || text === "-" || text === "—") {
    return "---";
  }
  return text;
};

/**
 * Builds the appraisal-sheet sections from First Year through Fourth Year.
 * Summer blocks are placed after Second Year (matching the original sheet).
 */
export const buildCurriculumAppraisalSections = (
  courses = [],
  { includeEmpty = true } = {},
) => {
  const buckets = new Map();

  (courses || []).forEach((course, index) => {
    let yearLevel = normalizeYearLevel(course.yearLevel);
    let semester = normalizeSemester(course.semester);

    // Legacy rows sometimes stored Summer only on yearLevel.
    if (yearLevel === "Summer") {
      yearLevel = "2Y";
      semester = "Summer";
    }

    const key = `${yearLevel}::${semester}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push({ ...course, __index: index });
  });

  const schedule = [
    { yearLevel: "1Y", semester: "1S" },
    { yearLevel: "1Y", semester: "2S" },
    { yearLevel: "2Y", semester: "1S" },
    { yearLevel: "2Y", semester: "2S" },
    { yearLevel: "2Y", semester: "Summer" },
    { yearLevel: "3Y", semester: "1S" },
    { yearLevel: "3Y", semester: "2S" },
    { yearLevel: "4Y", semester: "1S" },
    { yearLevel: "4Y", semester: "2S" },
  ];

  return schedule
    .map((slot) => {
      const key = `${slot.yearLevel}::${slot.semester}`;
      const slotCourses = buckets.get(key) || [];
      const lecTotal = slotCourses.reduce((sum, c) => sum + getCourseLec(c), 0);
      const labTotal = slotCourses.reduce((sum, c) => sum + getCourseLab(c), 0);
      const unitsTotal = slotCourses.reduce(
        (sum, c) => sum + getCourseTotalUnits(c),
        0,
      );

      return {
        key,
        yearLevel: slot.yearLevel,
        semester: slot.semester,
        yearLabel: YEAR_LEVEL_LABELS[slot.yearLevel] || slot.yearLevel,
        semesterLabel: SEMESTER_LABELS[slot.semester] || slot.semester,
        courses: slotCourses,
        lecTotal,
        labTotal,
        unitsTotal,
      };
    })
    .filter((section) => includeEmpty || section.courses.length > 0);
};
