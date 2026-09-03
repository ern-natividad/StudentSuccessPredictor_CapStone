import {
  buildCurriculumAppraisalSections,
  formatPrerequisite,
  getCourseLab,
  getCourseLec,
  getCourseTotalUnits,
} from "../../../utils/curriculumAppraisalUtils";
import styles from "../../../styles/CurriculumAppraisal.module.css";

const CurriculumAppraisalSheet = ({
  courses = [],
  title = "",
  program = "",
  academicYear = "",
  department = "Engineering",
  includeEmpty = true,
  showGradeColumn = true,
  showAdvisingHistory = true,
  editable = false,
  onEditCourse,
  onDeleteCourse,
  compact = false,
}) => {
  const sections = buildCurriculumAppraisalSections(courses, { includeEmpty });

  return (
    <div className={`${styles.sheet} ${compact ? styles.compact : ""}`}>
      <div className={styles.sheetHeader}>
        <div className={styles.headerBrand}>
          <div className={styles.logoMark}>WMSU</div>
          <div>
            <div className={styles.sheetTitle}>STUDENT APPRAISAL SHEET</div>
            <div className={styles.programLine}>
              {(program || title || "ENGINEERING PROGRAM").toUpperCase()}
            </div>
          </div>
        </div>
        <div className={styles.headerMeta}>
          <div>
            <strong>Department:</strong> {department || "Engineering"}
          </div>
          <div>
            <strong>School Year:</strong> {academicYear || "—"}
          </div>
          {title ? (
            <div>
              <strong>Curriculum:</strong> {title}
            </div>
          ) : null}
        </div>
      </div>

      <div className={styles.identityRow}>
        <div>
          <span>Name:</span>
          <em />
        </div>
        <div>
          <span>Student ID Number:</span>
          <em />
        </div>
        <div>
          <span>Section (A, B, or C):</span>
          <em />
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.key} className={styles.semesterBlock}>
          <div className={styles.semesterHeading}>
            <div className={styles.yearLabel}>{section.yearLabel}</div>
            <div className={styles.semesterLabel}>{section.semesterLabel}</div>
          </div>

          <div
            className={`${styles.semesterLayout} ${
              showAdvisingHistory ? "" : styles.fullWidth
            }`}
          >
            <div className={styles.coursePanel}>
              <table className={styles.appraisalTable}>
                <thead>
                  <tr>
                    {showGradeColumn ? <th rowSpan={2}>Grade</th> : null}
                    <th rowSpan={2}>Code</th>
                    <th rowSpan={2}>Description</th>
                    <th rowSpan={2}>Prereq</th>
                    <th colSpan={3}>Units</th>
                    {editable ? <th rowSpan={2}>Actions</th> : null}
                  </tr>
                  <tr>
                    <th>Lec</th>
                    <th>Lab</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {section.courses.length === 0 ? (
                    <tr>
                      <td
                        colSpan={
                          (showGradeColumn ? 4 : 3) + 3 + (editable ? 1 : 0)
                        }
                        className={styles.emptyCell}
                      >
                        No courses added for this term yet.
                      </td>
                    </tr>
                  ) : (
                    section.courses.map((course) => {
                      const originalIndex =
                        typeof course.__index === "number"
                          ? course.__index
                          : -1;

                      return (
                        <tr key={`${section.key}-${course.code}-${originalIndex}`}>
                          {showGradeColumn ? <td className={styles.gradeCell} /> : null}
                          <td className={styles.codeCell}>{course.code}</td>
                          <td className={styles.descCell}>{course.title}</td>
                          <td className={styles.prereqCell}>
                            {formatPrerequisite(course.prerequisites)}
                          </td>
                          <td className={styles.numCell}>{getCourseLec(course)}</td>
                          <td className={styles.numCell}>{getCourseLab(course)}</td>
                          <td className={styles.numCell}>
                            {getCourseTotalUnits(course)}
                          </td>
                          {editable ? (
                            <td className={styles.actionsCell}>
                              <button
                                type="button"
                                className={styles.iconBtn}
                                title="Edit course"
                                aria-label={`Edit ${course.code}`}
                                onClick={() => onEditCourse?.(originalIndex)}
                              >
                                <i className="fas fa-pen-to-square" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                className={`${styles.iconBtn} ${styles.deleteBtn}`}
                                title="Delete course"
                                aria-label={`Delete ${course.code}`}
                                onClick={() => onDeleteCourse?.(originalIndex)}
                              >
                                <i className="fas fa-trash-can" aria-hidden="true" />
                              </button>
                            </td>
                          ) : null}
                        </tr>
                      );
                    })
                  )}
                  <tr className={styles.totalRow}>
                    <td
                      colSpan={showGradeColumn ? 4 : 3}
                      className={styles.totalLabel}
                    >
                      Total
                    </td>
                    <td className={styles.numCell}>{section.lecTotal}</td>
                    <td className={styles.numCell}>{section.labTotal}</td>
                    <td className={styles.numCell}>{section.unitsTotal}</td>
                    {editable ? <td /> : null}
                  </tr>
                </tbody>
              </table>
            </div>

            {showAdvisingHistory ? (
              <div className={styles.advisingPanel}>
                <div className={styles.advisingTitle}>ADVISING HISTORY</div>
                <div className={styles.advisingMeta}>
                  <span>Level: {section.yearLevel.replace("Y", "")}</span>
                  <span>
                    Sem:{" "}
                    {section.semester === "Summer"
                      ? "Summer"
                      : section.semester.replace("S", "")}
                  </span>
                  <span>S.Y.: {academicYear || "____"}</span>
                </div>
                <table className={styles.advisingTable}>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Units</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({
                      length: Math.max(section.courses.length, 4),
                    }).map((_, idx) => {
                      const course = section.courses[idx];
                      return (
                        <tr key={`${section.key}-advise-${idx}`}>
                          <td>{course?.code || ""}</td>
                          <td>
                            {course ? getCourseTotalUnits(course) : ""}
                          </td>
                          <td />
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className={styles.adviserLine}>
                  <span>Adviser:</span>
                  <em />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CurriculumAppraisalSheet;
