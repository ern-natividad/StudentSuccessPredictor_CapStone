const REQUIRED_FIELDS = [
  "student_id",
  "first_name",
  "last_name",
  "email",
  "department",
  "program",
  "section",
  "year_level",
  "school_year",
];
const FORBIDDEN_HEADERS = new Set([
  "password",
  "passwordhash",
  "userid",
  "role",
]);
const RESERVED_EMAIL_DOMAINS = new Set([
  "example.com",
  "example.net",
  "example.org",
  "localhost",
]);

export const MAX_STUDENT_IMPORT_ROWS = 500;

const cleanText = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");

const normalizeRow = (source, index) => {
  const row = Object.fromEntries(
    REQUIRED_FIELDS.map((field) => [field, cleanText(source?.[field])]),
  );
  row.email = row.email.toLowerCase();

  const errors = REQUIRED_FIELDS.filter((field) => !row[field]).map(
    (field) => `${field} is required`,
  );

  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    errors.push("email must be a valid address");
  } else if (row.email) {
    const domain = row.email.split("@")[1];
    const allowTestEmails = process.env.ALLOW_TEST_STUDENT_EMAILS === "true";
    if (
      RESERVED_EMAIL_DOMAINS.has(domain) ||
      /\.(example|invalid|localhost)$/.test(domain) ||
      (!allowTestEmails && domain.endsWith(".test"))
    ) {
      errors.push(
        "email must use a reachable inbox, not a reserved example/test domain",
      );
    }
  }

  if (
    Object.keys(source || {}).some((header) =>
      FORBIDDEN_HEADERS.has(
        header
          .trim()
          .toLowerCase()
          .replace(/[\s_-]+/g, ""),
      ),
    )
  ) {
    errors.push("do not include password, user_id, or role columns");
  }

  if (row.year_level && !/^\d+(st|nd|rd|th) year$/i.test(row.year_level)) {
    errors.push("year_level must look like '1st Year'");
  }
  if (row.school_year) {
    const schoolYear = row.school_year.match(/^(\d{4})-(\d{4})$/);
    if (!schoolYear || Number(schoolYear[2]) !== Number(schoolYear[1]) + 1) {
      errors.push("school_year must be consecutive, like '2025-2026'");
    }
  }

  return {
    rowNumber: index + 2,
    row,
    errors,
  };
};

export const validateStudentImportRows = (input) => {
  if (!Array.isArray(input) || input.length === 0) {
    return {
      rows: [],
      issues: [{ rowNumber: null, errors: ["Add at least one student row"] }],
    };
  }

  if (input.length > MAX_STUDENT_IMPORT_ROWS) {
    return {
      rows: [],
      issues: [
        {
          rowNumber: null,
          errors: [
            `Import at most ${MAX_STUDENT_IMPORT_ROWS} students at a time`,
          ],
        },
      ],
    };
  }

  const normalized = input.map(normalizeRow);
  const issuesByRow = new Map(
    normalized
      .filter((item) => item.errors.length > 0)
      .map((item) => [item.rowNumber, [...item.errors]]),
  );

  for (const field of ["student_id", "email"]) {
    const rowNumbersByValue = new Map();
    for (const item of normalized) {
      const key = item.row[field].toLowerCase();
      if (!key) continue;
      const rowNumbers = rowNumbersByValue.get(key) || [];
      rowNumbers.push(item.rowNumber);
      rowNumbersByValue.set(key, rowNumbers);
    }

    for (const rowNumbers of rowNumbersByValue.values()) {
      if (rowNumbers.length < 2) continue;
      for (const rowNumber of rowNumbers) {
        const rowIssues = issuesByRow.get(rowNumber) || [];
        rowIssues.push(`duplicate ${field} in this file`);
        issuesByRow.set(rowNumber, rowIssues);
      }
    }
  }

  const rows = normalized
    .filter((item) => !issuesByRow.has(item.rowNumber))
    .map((item) => item.row);
  const issues = [...issuesByRow.entries()].map(([rowNumber, errors]) => ({
    rowNumber,
    studentId: normalized.find((item) => item.rowNumber === rowNumber)?.row
      .student_id,
    email: normalized.find((item) => item.rowNumber === rowNumber)?.row.email,
    errors,
  }));

  return { rows, issues };
};
