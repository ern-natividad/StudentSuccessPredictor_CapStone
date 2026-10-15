import { normalizeSemesterCode } from "./gradeSemesterUtils.js";

const normalizeCourseKey = (value) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

export const findCourseMatches = (header, courses, spreadsheetHeaders = []) => {
  const headerKey = normalizeCourseKey(header);
  if (!headerKey) return [];

  const explicitSemester = String(header)
    .trim()
    .match(/(?:_|-|\s)S([12])$/i)?.[1];
  const candidates = courses.filter((course) => {
    const codeKey = normalizeCourseKey(course.code);
    const titleKey = normalizeCourseKey(course.title);
    return (
      headerKey === codeKey ||
      headerKey === titleKey ||
      (codeKey.length >= 3 && headerKey.startsWith(codeKey))
    );
  });

  if (explicitSemester) {
    return candidates.filter(
      (course) => normalizeSemesterCode(course.semester) === explicitSemester,
    );
  }

  const exactMatches = candidates.filter((course) => {
    const codeKey = normalizeCourseKey(course.code);
    const titleKey = normalizeCourseKey(course.title);
    return headerKey === codeKey || headerKey === titleKey;
  });

  if (exactMatches.length > 1) {
    const explicitSiblingSemesters = spreadsheetHeaders
      .map((spreadsheetHeader) => {
        const suffix = String(spreadsheetHeader)
          .trim()
          .match(/(?:_|-|\s)S([12])$/i);
        if (!suffix) return null;
        const siblingBase = normalizeCourseKey(
          String(spreadsheetHeader).trim().replace(/(?:_|-|\s)S[12]$/i, ""),
        );
        return siblingBase === headerKey ? suffix[1] : null;
      })
      .filter(Boolean);
    if (explicitSiblingSemesters.length > 0) {
      const unsuffixedMatches = exactMatches.filter(
        (course) =>
          !explicitSiblingSemesters.includes(
            normalizeSemesterCode(course.semester),
          ),
      );
      if (unsuffixedMatches.length === 1) return unsuffixedMatches;
    }
  }

  return exactMatches.length > 0 ? exactMatches : candidates;
};
