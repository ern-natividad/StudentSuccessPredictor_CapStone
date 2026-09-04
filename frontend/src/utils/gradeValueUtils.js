/** Allowed WMSU-style grades (1.00 best → 5.00 fail) plus INC. */
export const ALLOWED_NUMERIC_GRADES = [
  1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 5,
];

export const GRADE_INPUT_HELP_TEXT =
  "Allowed grades: 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, INC, or 5.";

const nearlyEqual = (left, right) => Math.abs(left - right) < 0.001;

export const normalizeGradeValue = (value) => {
  const raw = String(value ?? "").trim().toUpperCase();
  if (!raw) return "";

  if (raw === "INC") return "INC";

  const numeric = Number(raw);
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
  if (normalized === "INC") return "INC";

  const numeric = Number(normalized);
  if (numeric === 5) return "Fail";
  if (numeric <= 3) return "Pass";
  return "";
};
