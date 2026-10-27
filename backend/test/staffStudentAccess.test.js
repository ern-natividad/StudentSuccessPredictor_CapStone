import test from "node:test";
import assert from "node:assert/strict";

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
process.env.JWT_SECRET = "jwt-secret";
process.env.GEMINI_API_KEY = "gemini-api-key";
process.env.BREVO_API_KEY = "brevo-api-key";
process.env.BREVO_SENDER_EMAIL = "sender@example.com";

test("staff access checks assignment records before permitting student access", async () => {
  const [
    { supabase },
    {
      assertStaffCanAccessStudents,
      getStaffAccessibleStudentUserIds,
    },
    { getStudentGrades },
    { getStudentPrediction, generateStudentPythonForecast },
  ] = await Promise.all([
    import("../src/config/supabaseClient.js"),
    import("../src/services/staffStudentAccessService.js"),
    import("../src/controllers/gradeController.js"),
    import("../src/controllers/predictionController.js"),
  ]);
  const originalFrom = supabase.from;
  const queriedTables = [];

  supabase.from = (table) => {
    queriedTables.push(table);
    const query = {
      select() {
        return this;
      },
      eq() {
        return this;
      },
      then(resolve, reject) {
        return Promise.resolve({
          data:
            table === "adviser_assignments"
              ? [
                  {
                    school_year: "2025-2026",
                    section: "2A",
                    year_level: "2nd Year",
                    program: "Computer Engineering",
                    is_active: true,
                  },
                ]
              : [],
          error: null,
        }).then(resolve, reject);
      },
      in: async () => ({
        data:
          table === "adviser_assignments"
            ? [
                {
                  school_year: "2025-2026",
                  section: "2A",
                  year_level: "2nd Year",
                  program: "Computer Engineering",
                  is_active: true,
                },
              ]
            : table === "student_info"
            ? [
                {
                  user_id: "assigned-student",
                  section: "2A",
                  year_level: "2",
                  program: "Computer Engineering",
                  school_year: "2025-2026",
                },
                {
                  user_id: "other-student",
                  section: "2B",
                  year_level: "2",
                  program: "Computer Engineering",
                  school_year: "2025-2026",
                },
              ]
            : [],
        error: null,
      }),
    };
    return query;
  };

  try {
    await assertStaffCanAccessStudents(
      { sub: "staff-1", role: "staff" },
      ["assigned-student"],
    );
    assert.deepEqual(
      [
        ...(await getStaffAccessibleStudentUserIds(
          { sub: "staff-1", role: "staff" },
          ["assigned-student", "other-student"],
        )),
      ],
      ["assigned-student"],
    );
    await assert.rejects(
      assertStaffCanAccessStudents(
        { sub: "staff-1", role: "staff" },
        ["assigned-student", "other-student"],
      ),
      (error) => error.status === 403,
    );
    await assertStaffCanAccessStudents(
      { sub: "admin-1", role: "admin" },
      ["other-student"],
    );
    await assert.rejects(
      getStudentGrades(
        { user: { sub: "staff-1", role: "staff" }, params: { userId: "other-student" } },
        {},
      ),
      (error) => error.status === 403,
    );
    await assert.rejects(
      getStudentPrediction(
        { user: { sub: "staff-1", role: "staff" }, params: { userId: "other-student" } },
        {},
      ),
      (error) => error.status === 403,
    );
    await assert.rejects(
      generateStudentPythonForecast(
        { user: { sub: "staff-1", role: "staff" }, params: { userId: "other-student" } },
        {},
      ),
      (error) => error.status === 403,
    );
    assert.deepEqual(queriedTables, [
      "adviser_assignments",
      "student_info",
      "adviser_assignments",
      "student_info",
      "adviser_assignments",
      "student_info",
      "adviser_assignments",
      "student_info",
      "adviser_assignments",
      "student_info",
      "adviser_assignments",
      "student_info",
    ]);
  } finally {
    supabase.from = originalFrom;
  }
});
