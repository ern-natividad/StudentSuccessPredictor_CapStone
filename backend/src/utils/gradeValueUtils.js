const ALLOWED_NUMERIC_GRADES = [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 5];

export const normalizeGradeValue = (value) => {
  const raw = String(value ?? "").trim().toUpperCase();
  if (!raw) return null;
  if (["INC", "AW", "UW"].includes(raw)) return raw;

  const completedInc = raw.match(
    /^INC\s*\(\s*(?:COMPLETED|COMPLIED)\s*:\s*(.*?)\s*\)$/,
  );
  const numeric = Number(completedInc ? completedInc[1] : raw);
  if (!Number.isFinite(numeric)) return null;

  const matched = ALLOWED_NUMERIC_GRADES.find(
    (grade) => Math.abs(grade - numeric) < 0.001,
  );
  return matched === undefined ? null : String(matched);
};
