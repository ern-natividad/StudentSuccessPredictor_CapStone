import React, { useMemo } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useDashboard } from "../../../hooks/useDashboard";
import styles from "../../../styles/Dashboard.module.css";
import commonStyles from "../../../styles/Common.module.css";

const MyGradesPage = () => {
  const { user } = useAuth();
  const { students } = useDashboard();

  const currentStudent = useMemo(() => {
    return (
      students.find((student) =>
        user.name
          .toLowerCase()
          .startsWith(student.full_name.toLowerCase().split(" ")[0]),
      ) || students[0]
    );
  }, [students, user]);

  // Mock curriculum data organized by semester
  const curriculumData = [
    {
      year: "SY 2025-2026 (Summer)",
      semesters: [
        {
          semesterLabel: "Summer",
          subjects: [
            {
              code: "IT 331",
              description: "CAPSTONE PROJECT AND RESEARCH I",
              grade: currentStudent?.grade_records?.[0]?.grade || 1,
            },
            {
              code: "IT 332",
              description: "INFORMATION ASSURANCE AND SECURITY",
              grade: 2,
            },
          ],
        },
      ],
    },
    {
      year: "SY 2025-2026 (First Semester)",
      semesters: [
        {
          semesterLabel: "First Semester",
          subjects: [
            {
              code: "CS 405",
              description: "APPLICATION DEVELOPMENT AND",
              grade: 3,
            },
            {
              code: "ENC1",
              description: "EMERGING TECHNOLO",
              grade: 1.75,
            },
            {
              code: "IT 311",
              description: "NETWORKING 1",
              grade: 2.25,
            },
            {
              code: "IT 311",
              description: "NETWORKING 2",
              grade: 2.5,
            },
            {
              code: "IT 312",
              description: "SYSTEMS INTEGRATION AND ARCHITECTURE",
              grade: 3.0,
            },
            {
              code: "IT 313",
              description: "IT ELECTIVE 3",
              grade: 1.75,
            },
            {
              code: "IT 314",
              description: "DATA ANALYTICS",
              grade: 2.0,
            },
          ],
        },
      ],
    },
    {
      year: "SY 2024-2025 (Second Semester)",
      semesters: [
        {
          semesterLabel: "Second Semester",
          subjects: [
            {
              code: "EPIC 2-B",
              description: "EPIC START 2-B",
              grade: 2.25,
            },
            {
              code: "EPIC 2",
              description: "EPIC START 2-B",
              grade: 2.5,
            },
            {
              code: "ETIC 3",
              description: "ETHICS",
              grade: 2.0,
            },
            {
              code: "IT 221",
              description: "INTEGRATIVE PROGRAMMING AND TECHNOLOGIES",
              grade: 1.75,
            },
            {
              code: "IT 222",
              description: "MOBILE COMPUTING",
              grade: 2.25,
            },
            {
              code: "IT 223",
              description: "IT ELECTIVE 2",
              grade: 2.5,
            },
            {
              code: "IT 225",
              description: "ADVANCED DATABASE SYSTEMS",
              grade: 3.0,
            },
            {
              code: "PATH FIT 4",
              description: "OUTDOOR AND ADVENTURE ACTIVITIES",
              grade: 1.25,
            },
          ],
        },
      ],
    },
  ];

  return (
    <div className={styles.pageShell}>
      <div className={styles.pageHeaderCard}>
        <div>
          <h1 className={styles.pageTitle}>My Grades</h1>
          <p className={styles.pageSubtitle}>
            Track your academic progress and review your grade history across
            each semester.
          </p>
        </div>
        <div className={styles.pageHeaderBadge}>Student Record</div>
      </div>

      {curriculumData.map((academicYear, yearIdx) => (
        <div
          key={yearIdx}
          className={styles.contentCard}
          style={{ padding: 0, overflow: "hidden" }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #8b0000 0%, #b91c1c 100%)",
              color: "#fff",
              padding: "14px 18px",
              fontWeight: 700,
              fontSize: "15px",
            }}
          >
            {academicYear.year}
          </div>

          {academicYear.semesters.map((semester, semIdx) => (
            <div key={semIdx} style={{ padding: "16px 18px 18px" }}>
              <div
                style={{
                  marginBottom: "10px",
                  fontWeight: 700,
                  color: "#1f2937",
                }}
              >
                {semester.semesterLabel}
              </div>
              <div className={commonStyles.tableWrapper}>
                <table className={commonStyles.table}>
                  <thead className={commonStyles.tableHead}>
                    <tr>
                      <th style={{ width: "15%" }}>Subject Code</th>
                      <th style={{ width: "60%" }}>Description</th>
                      <th style={{ width: "25%" }}>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semester.subjects.map((subject, subjIdx) => (
                      <tr key={subjIdx} className={commonStyles.tableRow}>
                        <td>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: "13px",
                              color: "#8b0000",
                            }}
                          >
                            {subject.code}
                          </span>
                        </td>
                        <td style={{ fontSize: "13px", color: "#334155" }}>
                          {subject.description}
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, fontSize: "13px" }}>
                            {subject.grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default MyGradesPage;
