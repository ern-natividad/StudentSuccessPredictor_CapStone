/** Allowed WMSU-style grades (1.00 best → 5.00 fail) and grade statuses. */
export const ALLOWED_NUMERIC_GRADES = [
  1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 5,
];

export const GRADE_INPUT_HELP_TEXT =
  "Allowed grades: 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 5, INC, AW, or UW. INC completed or complied with a final grade (e.g. INC (Complied: 2.75)) is saved as that grade.";

const nearlyEqual = (left, right) => Math.abs(left - right) < 0.001;

export const normalizeGradeValue = (value) => {
  const raw = String(value ?? "").trim().toUpperCase();
  if (!raw) return "";

  if (["INC", "AW", "UW"].includes(raw)) return raw;

  const completedInc = raw.match(
    /^INC\s*\(\s*(?:COMPLETED|COMPLIED)\s*:\s*(.*?)\s*\)$/,
  );
  const gradeText = completedInc ? completedInc[1] : raw;

  const numeric = Number(gradeText);
  if (!Number.isFinite(numeric)) return "";

  const matched = ALLOWED_NUMERIC_GRADES.find((grade) =>
    nearlyEqual(grade, numeric),
  );
  if (matched === undefined) return "";

  // Keep compact text (1, 1.25, 1.5, …) for storage/display consistency.
  return String(matched);
};

export const isValidGradeValue = (value) => Boolean(normalizeGradeValue(value));

/** Auto remarks from grade: ≤3 Pass, INC → INC, 5 → Fail. */
export const remarksFromGrade = (value) => {
  const normalized = normalizeGradeValue(value);
  if (!normalized) return "";
  if (["INC", "AW", "UW"].includes(normalized)) return normalized;

  const numeric = Number(normalized);
  if (numeric === 5) return "Fail";
  if (numeric <= 3) return "Pass";
  return "";
};

/** True when remarks should be highlighted as incomplete/failing. */
export const isAlertRemark = (remarks) => {
  const normalized = String(remarks || "")
    .trim()
    .toLowerCase();
  return (
    normalized === "inc" ||
    normalized === "aw" ||
    normalized === "uw" ||
    normalized === "fail" ||
    normalized === "failed"
  );
};

/** True when a grade should be called out as incomplete, withdrawn, or failing. */
export const isAlertGrade = (value) => {
  const normalized = normalizeGradeValue(value);
  if (!normalized) {
    const raw = String(value ?? "").trim().toUpperCase();
    return ["INC", "AW", "UW", "5"].includes(raw);
  }
  if (["INC", "AW", "UW"].includes(normalized)) return true;
  return Number(normalized) === 5;
};
