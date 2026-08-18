/**
 * Canonical engineering program catalog for pre-enrollment recommendations.
 * Each program defines CET subtest weights and optional fallback curriculum.
 */

export const ENGINEERING_PROGRAMS = [
  {
    id: "BSCE",
    name: "BS Civil Engineering",
    programKeys: ["BSCE", "BS-CE", "BS Civil Engineering", "Civil Engineering"],
    weights: { math: 0.45, science: 0.35, abstract: 0.2 },
    skillKeywords: ["cad", "autocad", "structural", "survey", "construction"],
  },
  {
    id: "BSEE",
    name: "BS Electrical Engineering",
    programKeys: ["BSEE", "BS-EE", "BS Electrical Engineering", "Electrical Engineering"],
    weights: { math: 0.4, science: 0.4, abstract: 0.2 },
    skillKeywords: ["electronics", "circuit", "electrical", "arduino", "wiring"],
  },
  {
    id: "BSCPE",
    name: "BS Computer Engineering",
    programKeys: ["BSCPE", "BS-CPE", "BS Computer Engineering", "Computer Engineering"],
    weights: { math: 0.4, abstract: 0.35, science: 0.25 },
    skillKeywords: ["python", "coding", "programming", "c++", "java", "embedded"],
  },
  {
    id: "BSIE",
    name: "BS Industrial Engineering",
    programKeys: ["BSIE", "BS-IE", "BS Industrial Engineering", "Industrial Engineering"],
    weights: { math: 0.3, english: 0.25, reading: 0.2, abstract: 0.25 },
    skillKeywords: ["lean", "process", "optimization", "statistics", "excel"],
  },
  {
    id: "BSME",
    name: "BS Mechanical Engineering",
    programKeys: ["BSME", "BS-ME", "BS Mechanical Engineering", "Mechanical Engineering"],
    weights: { math: 0.4, science: 0.35, abstract: 0.25 },
    skillKeywords: ["cad", "thermodynamics", "machining", "solidworks", "automotive"],
  },
];

export const VALID_STRANDS = ["STEM", "ABM", "HUMSS", "GAS"];

export const RECOMMENDATION_STATUSES = {
  STRONGLY_RECOMMENDED: "Strongly Recommended",
  RECOMMENDED_WITH_ADVISING: "Recommended with Advising",
  ALTERNATIVE_TRACKS: "Alternative Tracks Suggested",
};

/**
 * Fallback first-year first-semester courses when no published curriculum exists.
 */
export const FALLBACK_FIRST_YEAR_COURSES = {
  BSCE: [
    { code: "MATH 101", title: "Calculus I", units: 3, semester: "1", yearLevel: "1Y", prerequisites: [] },
    { code: "CHEM 101", title: "General Chemistry", units: 3, semester: "1", yearLevel: "1Y", prerequisites: [] },
    { code: "ENG 101", title: "Engineering Drawing", units: 3, semester: "1", yearLevel: "1Y", prerequisites: [] },
    { code: "GE 101", title: "Understanding the Self", units: 3, semester: "1", yearLevel: "1Y", prerequisites: [] },
    { code: "PE 101", title: "Physical Education 1", units: 2, semester: "1", yearLevel: "1Y", prerequisites: [] },
  ],
  BSEE: [
    { code: "MATH 101", title: "Calculus I", units: 3, semester: "1", yearLevel: "1Y", prerequisites: [] },
    { code: "PHYS 101", title: "Physics for Engineers", units: 3, semester: "1", yearLevel: "1Y", prerequisites: [] },
    { code: "EE 101", title: "Introduction to Electrical Engineering", units: 3, semester: "1", yearLevel: "1Y", prerequisites: [] },
    { code: "GE 101", title: "Understanding the Self", units: 3, semester: "1", yearLevel: "1Y", prerequisites: [] },
    { code: "PE 101", title: "Physical Education 1", units: 2, semester: "1", yearLevel: "1Y", prerequisites: [] },
  ],
  BSCPE: [
    { code: "MATH 101", title: "Calculus I", units: 3, semester: "1", yearLevel: "1Y", prerequisites: [] },
    { code: "CPE 101", title: "Introduction to Computer Engineering", units: 3, semester: "1", yearLevel: "1Y", prerequisites: [] },
    { code: "PROG 101", title: "Programming Fundamentals", units: 3, semester: "1", yearLevel: "1Y", prerequisites: [] },
    { code: "GE 101", title: "Understanding the Self", units: 3, semester: "1", yearLevel: "1Y", prerequisites: [] },
    { code: "PE 101", title: "Physical Education 1", units: 2, semester: "1", yearLevel: "1Y", prerequisites: [] },
  ],
  BSIE: [
    { code: "MATH 101", title: "Calculus I", units: 3, semester: "1", yearLevel: "1Y", prerequisites: [] },
    { code: "IE 101", title: "Introduction to Industrial Engineering", units: 3, semester: "1", yearLevel: "1Y", prerequisites: [] },
    { code: "STAT 101", title: "Engineering Statistics", units: 3, semester: "1", yearLevel: "1Y", prerequisites: [] },
    { code: "GE 101", title: "Understanding the Self", units: 3, semester: "1", yearLevel: "1Y", prerequisites: [] },
    { code: "PE 101", title: "Physical Education 1", units: 2, semester: "1", yearLevel: "1Y", prerequisites: [] },
  ],
  BSME: [
    { code: "MATH 101", title: "Calculus I", units: 3, semester: "1", yearLevel: "1Y", prerequisites: [] },
    { code: "ME 101", title: "Introduction to Mechanical Engineering", units: 3, semester: "1", yearLevel: "1Y", prerequisites: [] },
    { code: "CHEM 101", title: "General Chemistry", units: 3, semester: "1", yearLevel: "1Y", prerequisites: [] },
    { code: "GE 101", title: "Understanding the Self", units: 3, semester: "1", yearLevel: "1Y", prerequisites: [] },
    { code: "PE 101", title: "Physical Education 1", units: 2, semester: "1", yearLevel: "1Y", prerequisites: [] },
  ],
};

export const resolveProgramById = (programId) => {
  const normalized = String(programId || "").trim().toUpperCase();
  return (
    ENGINEERING_PROGRAMS.find((program) =>
      program.programKeys.some((key) => key.toUpperCase() === normalized),
    ) || null
  );
};
