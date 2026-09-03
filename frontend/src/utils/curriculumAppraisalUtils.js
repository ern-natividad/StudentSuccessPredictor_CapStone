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

const courseKey = (course) =>
  String(course?.code || "").trim().toUpperCase();

const courseFingerprint = (course) =>
  [
    courseKey(course),
    String(course?.title || "").trim().toLowerCase(),
    getCourseLec(course),
    getCourseLab(course),
    getCourseTotalUnits(course),
    formatPrerequisite(course?.prerequisites),
    String(course?.yearLevel || ""),
    String(course?.semester || ""),
  ].join("|");

export const compareCurriculumCourses = (currentCourses = [], versionCourses = []) => {
  const currentMap = new Map(
    (currentCourses || []).map((course) => [courseKey(course), course]),
  );
  const versionMap = new Map(
    (versionCourses || []).map((course) => [courseKey(course), course]),
  );

  const added = [];
  const removed = [];
  const changed = [];

  currentMap.forEach((course, key) => {
    if (!key) return;
    if (!versionMap.has(key)) {
      added.push(course);
      return;
    }
    if (courseFingerprint(course) !== courseFingerprint(versionMap.get(key))) {
      changed.push({ current: course, previous: versionMap.get(key) });
    }
  });

  versionMap.forEach((course, key) => {
    if (!key) return;
    if (!currentMap.has(key)) {
      removed.push(course);
    }
  });

  return { added, removed, changed };
};

export const formatVersionTimestamp = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || "Previous version");
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const getCurriculumFingerprint = (curriculumLike = {}) =>
  [
    String(curriculumLike.title || "").trim().toLowerCase(),
    String(curriculumLike.program || "").trim().toLowerCase(),
    String(curriculumLike.academicYear || "").trim().toLowerCase(),
    (curriculumLike.courses || [])
      .map((course) => courseFingerprint(course))
      .sort()
      .join("||"),
  ].join("::");

export const getUniqueCurriculumVersions = (versions = [], current = null) => {
  const currentFp = current ? getCurriculumFingerprint(current) : "";
  const seen = new Set();

  return (versions || []).filter((version) => {
    const fingerprint = getCurriculumFingerprint(version);
    if (!fingerprint || fingerprint === currentFp || seen.has(fingerprint)) {
      return false;
    }
    seen.add(fingerprint);
    return true;
  });
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const downloadCurriculumAppraisal = (curriculum = {}) => {
  const title = curriculum.title || "Curriculum";
  const program = curriculum.program || "";
  const academicYear = curriculum.academicYear || "";
  const department = curriculum.department || "Engineering";
  const sections = buildCurriculumAppraisalSections(curriculum.courses || [], {
    includeEmpty: false,
  });

  const sectionHtml = sections
    .map((section) => {
      const rows =
        section.courses.length === 0
          ? `<tr><td colspan="7" style="text-align:center;font-style:italic">No courses added for this term yet.</td></tr>`
          : section.courses
              .map(
                (course) => `
                  <tr>
                    <td></td>
                    <td style="text-align:center;font-weight:700">${escapeHtml(course.code)}</td>
                    <td>${escapeHtml(course.title)}</td>
                    <td style="text-align:center">${escapeHtml(formatPrerequisite(course.prerequisites))}</td>
                    <td style="text-align:center">${getCourseLec(course)}</td>
                    <td style="text-align:center">${getCourseLab(course)}</td>
                    <td style="text-align:center">${getCourseTotalUnits(course)}</td>
                  </tr>`,
              )
              .join("");

      const advisingRows = Array.from({
        length: Math.max(section.courses.length, 4),
      })
        .map((_, idx) => {
          const course = section.courses[idx];
          return `<tr>
            <td>${escapeHtml(course?.code || "")}</td>
            <td style="text-align:center">${course ? getCourseTotalUnits(course) : ""}</td>
            <td></td>
          </tr>`;
        })
        .join("");

      return `
        <section class="term">
          <h2>${escapeHtml(section.yearLabel)}</h2>
          <h3>${escapeHtml(section.semesterLabel)}</h3>
          <div class="layout">
            <table>
              <thead>
                <tr>
                  <th rowspan="2">Grade</th>
                  <th rowspan="2">Code</th>
                  <th rowspan="2">Description</th>
                  <th rowspan="2">Prereq</th>
                  <th colspan="3">Units</th>
                </tr>
                <tr>
                  <th>Lec</th>
                  <th>Lab</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
                <tr class="total">
                  <td colspan="4" style="text-align:right">Total</td>
                  <td style="text-align:center">${section.lecTotal}</td>
                  <td style="text-align:center">${section.labTotal}</td>
                  <td style="text-align:center">${section.unitsTotal}</td>
                </tr>
              </tbody>
            </table>
            <aside>
              <div class="advise-title">ADVISING HISTORY</div>
              <div class="advise-meta">Level: ${escapeHtml(section.yearLevel.replace("Y", ""))} · Sem: ${escapeHtml(section.semester === "Summer" ? "Summer" : section.semester.replace("S", ""))} · S.Y.: ${escapeHtml(academicYear || "____")}</div>
              <table>
                <thead>
                  <tr><th>Code</th><th>Units</th><th>Notes</th></tr>
                </thead>
                <tbody>${advisingRows}</tbody>
              </table>
              <div class="adviser">Adviser: ________________________</div>
            </aside>
          </div>
        </section>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
    h1 { margin: 0; font-size: 20px; letter-spacing: 0.04em; }
    .program { color: #800000; font-weight: 700; margin-top: 4px; }
    .meta { text-align: right; font-size: 12px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 16px; }
    .identity { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 12px; font-size: 13px; margin-bottom: 20px; }
    .term { margin-bottom: 28px; }
    .term h2 { text-align: center; text-decoration: underline; font-size: 16px; margin: 0; }
    .term h3 { text-align: center; font-style: italic; font-size: 14px; margin: 4px 0 10px; }
    .layout { display: grid; grid-template-columns: 1.7fr 0.9fr; gap: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #111; padding: 5px 6px; }
    th { background: #f4f4f4; }
    .total { font-weight: 700; background: #f8f8f8; }
    aside { border: 1px solid #111; padding: 8px; }
    .advise-title { text-align: center; font-weight: 800; font-size: 12px; margin-bottom: 6px; }
    .advise-meta { font-size: 11px; margin-bottom: 8px; }
    .adviser { margin-top: 10px; font-size: 12px; font-weight: 600; }
    @media print { body { padding: 0; } .layout { break-inside: avoid; } }
    @media (max-width: 900px) { .layout, .identity, .header { display: block; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>STUDENT APPRAISAL SHEET</h1>
      <div class="program">${escapeHtml((program || title).toUpperCase())}</div>
    </div>
    <div class="meta">
      <div><strong>Department:</strong> ${escapeHtml(department)}</div>
      <div><strong>School Year:</strong> ${escapeHtml(academicYear || "—")}</div>
      <div><strong>Curriculum:</strong> ${escapeHtml(title)}</div>
    </div>
  </div>
  <div class="identity">
    <div>Name: ________________________</div>
    <div>Student ID Number: ____________</div>
    <div>Section (A, B, or C): __________</div>
  </div>
  ${sectionHtml}
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = `${title}-${academicYear || "curriculum"}`
    .replace(/[^\w\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  link.href = url;
  link.download = `${safeName || "curriculum"}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
