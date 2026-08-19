import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useDashboard } from "../../../hooks/useDashboard";
import { useToast } from "../../../components/Common/Toast";
import { api } from "../../../services/api";
import { upsertStudentInfo } from "../../../services/studentInfoService";
import { AUTH_ROLES } from "../../../utils/constants";
import {
  SEMESTER_FILTER_OPTIONS,
  SEMESTER_FORM_OPTIONS,
  SEMESTER_INFO_TEXT,
  formatSemesterCode,
  matchesSemesterFilter,
} from "../../../utils/gradeSemesterUtils";
import {
  getStaffAssignedSections,
  getStaffSectionLabel,
  getStudentSectionValue,
} from "../../../utils/adviserAssignmentUtils";
import styles from "../../../styles/Dashboard.module.css";
import commonStyles from "../../../styles/Common.module.css";

const YEAR_LEVEL_OPTIONS = AUTH_ROLES.student.groupOptions;
const RISK_LEVEL_OPTIONS = ["Low", "Medium", "High", "Critical"];

const createEmptyStudentInfoForm = () => ({
  student_id: "",
  department: "",
  section: "",
  year_level: YEAR_LEVEL_OPTIONS[0],
  risk_level: "Low",
});

const getStudentSectionLabel = (student, getSectionById) =>
  getStaffSectionLabel(getStudentSectionValue(student), getSectionById);

const StudentManagementPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const {
    students,
    staffMembers,
    getStudentsForStaff,
    getSectionById,
    updateStudentGradeRecord,
    updateStudentInfoRecord,
    directoryLoading,
    directoryError,
  } = useDashboard();

  const loggedInStaff = useMemo(() => {
    if (!user || user.role !== "staff") return null;

    return (
      staffMembers.find(
        (staff) =>
          staff.id === user.id ||
          staff.email?.toLowerCase() === (user.email || "").toLowerCase(),
      ) || null
    );
  }, [staffMembers, user]);

  const staffStudentList = useMemo(() => {
    if (!loggedInStaff) return [];
    return getStudentsForStaff(loggedInStaff.id);
  }, [getStudentsForStaff, loggedInStaff]);

  const displayStudentList = useMemo(
    () => staffStudentList,
    [staffStudentList],
  );

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [isGradeHistoryModalOpen, setIsGradeHistoryModalOpen] = useState(false);
  const [semesterFilter, setSemesterFilter] = useState("");
  const [isSavingGrade, setIsSavingGrade] = useState(false);
  const [isSavingStudentInfo, setIsSavingStudentInfo] = useState(false);
  const [gradeForm, setGradeForm] = useState({
    subject: "",
    semester: "1",
    grade: "",
    remarks: "",
  });
  const [studentInfoForm, setStudentInfoForm] = useState(createEmptyStudentInfoForm);
  const [studentGrades, setStudentGrades] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [gradesError, setGradesError] = useState("");

  const selectedStudent = useMemo(
    () =>
      displayStudentList.find(
        (student) => student.student_id === selectedStudentId,
      ) ||
      displayStudentList[0] ||
      null,
    [displayStudentList, selectedStudentId],
  );

  const filteredStudentGrades = useMemo(
    () =>
      studentGrades.filter((record) =>
        matchesSemesterFilter(record.semester, semesterFilter),
      ),
    [semesterFilter, studentGrades],
  );

  useEffect(() => {
    if (!selectedStudentId && displayStudentList.length > 0) {
      setSelectedStudentId(displayStudentList[0].student_id);
    }
  }, [displayStudentList, selectedStudentId]);

  useEffect(() => {
    if (selectedStudent) {
      setGradeForm({ subject: "", semester: "1", grade: "", remarks: "" });
    }
  }, [selectedStudent]);

  useEffect(() => {
    const loadGrades = async () => {
      if (!selectedStudent) return;
      setGradesLoading(true);
      setGradesError("");
      try {
        const result = await api.getStudentGrades(selectedStudent.user_id);
        setStudentGrades(result.grades || []);
      } catch (error) {
        setGradesError(error.message || "Unable to load student grades.");
        setStudentGrades([]);
      } finally {
        setGradesLoading(false);
      }
    };

    loadGrades();
  }, [selectedStudent]);

  const studentTableRows = useMemo(
    () =>
      displayStudentList.map((student, rowIndex) => ({
        ...student,
        rowIndex: rowIndex + 1,
        sectionName: getStudentSectionLabel(student, getSectionById),
        subjectCode: student.grade_records?.[0]?.subject || "UXD1712",
        schedule:
          [
            "MWF 8:00-9:00",
            "TTh 9:00-10:30",
            "MWF 10:00-11:00",
            "TTh 1:00-2:30",
            "MWF 2:00-3:00",
          ][rowIndex] || "TBA",
        displayGrade: student.grade_records?.[0]?.grade || "N/A",
      })),
    [displayStudentList, getSectionById],
  );

  const handleGradeChange = (field, value) => {
    const nextValue =
      field === "grade" ? (value === "" ? "" : Number(value)) : value;
    setGradeForm((prev) => ({ ...prev, [field]: nextValue }));
  };

  const openGradeModal = (studentId) => {
    setSelectedStudentId(studentId);
    setGradeForm({ subject: "", semester: "1", grade: "", remarks: "" });
    setIsGradeModalOpen(true);
  };

  const closeGradeModal = () => {
    setIsGradeModalOpen(false);
  };

  const openEditStudentModal = (studentId) => {
    const student = displayStudentList.find(
      (entry) => entry.student_id === studentId,
    );
    if (!student) return;

    setSelectedStudentId(studentId);
    setStudentInfoForm({
      student_id: student.student_id || "",
      department: student.department || "",
      section: student.section || student.assignedSectionId || "",
      year_level: student.yearLevel || student.year_level || YEAR_LEVEL_OPTIONS[0],
      risk_level: student.risk_level || "Low",
    });
    setIsEditStudentModalOpen(true);
  };

  const closeEditStudentModal = () => {
    setIsEditStudentModalOpen(false);
  };

  const handleStudentInfoChange = (field, value) => {
    setStudentInfoForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveStudentInfo = async () => {
    if (!selectedStudent) return;

    if (!studentInfoForm.student_id.trim()) {
      toast.error("Student ID is required.");
      return;
    }

    try {
      setIsSavingStudentInfo(true);
      const updatedInfo = await upsertStudentInfo(selectedStudent.user_id, {
        student_id: studentInfoForm.student_id,
        department: studentInfoForm.department,
        section: studentInfoForm.section,
        year_level: studentInfoForm.year_level,
        risk_level: studentInfoForm.risk_level,
      });

      updateStudentInfoRecord(selectedStudent.student_id, updatedInfo);

      if (updatedInfo.student_id !== selectedStudent.student_id) {
        setSelectedStudentId(updatedInfo.student_id);
      }

      setIsEditStudentModalOpen(false);
      toast.success("Student information updated.");
    } catch (error) {
      toast.error(error.message || "Unable to update student information.");
    } finally {
      setIsSavingStudentInfo(false);
    }
  };

  const openGradeHistoryModal = (studentId) => {
    setSelectedStudentId(studentId);
    setSemesterFilter("");
    setIsGradeHistoryModalOpen(true);
  };

  const closeGradeHistoryModal = () => {
    setIsGradeHistoryModalOpen(false);
  };

  const handleAddGrade = async () => {
    if (
      !selectedStudent ||
      !gradeForm.subject.trim() ||
      gradeForm.grade === "" ||
      gradeForm.grade === null
    ) {
      toast.error("Enter a subject and a grade from 1 to 5.");
      return;
    }

    try {
      setIsSavingGrade(true);
      const payload = {
        user_id: selectedStudent.user_id,
        subject_name: gradeForm.subject.trim(),
        semester: gradeForm.semester,
        grade: Number(gradeForm.grade),
        remarks: gradeForm.remarks.trim() || "",
      };
      const result = await api.createStudentGrade(payload);
      setStudentGrades((prevGrades) => [result.grade, ...prevGrades]);
      setGradeForm({ subject: "", semester: "1", grade: "", remarks: "" });
      setIsGradeModalOpen(false);
      updateStudentGradeRecord(selectedStudent.student_id, [
        result.grade,
        ...studentGrades,
      ]);
      toast.success("Grade record saved successfully.");
    } catch (error) {
      toast.error(error.message || "Unable to save the grade record.");
    } finally {
      setIsSavingGrade(false);
    }
  };

  const assignedSectionCount = useMemo(() => {
    if (!loggedInStaff) return 0;
    return getStaffAssignedSections(loggedInStaff).length;
  }, [loggedInStaff]);

  const summaryStats = useMemo(() => {
    const averageGrade =
      displayStudentList.length > 0
        ? (
            displayStudentList.reduce((sum, student) => {
              const grade = student.grade_records?.[0]?.grade;
              return sum + (typeof grade === "number" ? grade : 0);
            }, 0) / displayStudentList.length
          ).toFixed(1)
        : "0.0";

    return [
      { label: "Assigned students", value: displayStudentList.length },
      { label: "Sections covered", value: assignedSectionCount },
      { label: "Average grade", value: averageGrade },
      {
        label: "Current focus",
        value: selectedStudent ? "Selected" : "None",
      },
    ];
  }, [assignedSectionCount, displayStudentList, selectedStudent]);

  return (
    <div className={styles.pageShell}>
      <div className={styles.pageHeaderCard}>
        <div>
          <h1 className={styles.pageTitle}>Student Management</h1>
          <p className={styles.pageSubtitle}>
            Review assigned learners, manage grade entries, and keep student
            support tasks organized in one space.
          </p>
        </div>
      </div>

      {directoryError && <div className={styles.contentCard}>{directoryError}</div>}
      {directoryLoading && <div className={styles.contentCard}>Loading student directory…</div>}

      <div className={styles.summaryGrid}>
        {summaryStats.map((item) => (
          <div key={item.label} className={styles.summaryCard}>
            <div className={styles.summaryValue}>{item.value}</div>
            <div className={styles.summaryLabel}>{item.label}</div>
          </div>
        ))}
      </div>

      {selectedStudent && (
        <div className={styles.selectedStudentCard}>
          <div>
            <div className={styles.contentCardEyebrow}>Current focus</div>
            <div className={styles.contentCardTitle}>
              {selectedStudent.full_name}
            </div>
            <div className={styles.contentCardMeta}>
              {selectedStudent.student_id} • {selectedStudent.yearLevel} •{" "}
              {selectedStudent.program || "Program pending"}
            </div>
          </div>
          <div className={styles.selectedStudentTag}>
            Latest grade: {selectedStudent.grade_records?.[0]?.grade ?? "N/A"}
          </div>
        </div>
      )}

      <div className={styles.contentCard}>
        <div className={styles.contentCardHeader}>
          <div>
            <div className={styles.contentCardEyebrow}>Assigned learners</div>
            <div className={styles.contentCardTitle}>Assigned Students</div>
          </div>
          <div className={styles.contentCardHint}>
            {displayStudentList.length} students visible
          </div>
        </div>

        <div
          className={`${commonStyles.tableWrapper} ${styles.studentTableWrapper}`}
          style={{ marginTop: 16 }}
        >
          <table className={`${commonStyles.table} ${styles.studentTable}`}>
            <colgroup>
              <col style={{ width: "5%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead className={commonStyles.tableHead}>
              <tr>
                <th>#</th>
                <th>Student ID</th>
                <th>Name</th>
                <th>Section</th>
                <th>Year Level</th>
                <th>Subject Code</th>
                <th>Schedule</th>
                <th>Grade</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {studentTableRows.map((row) => (
                <tr
                  key={row.student_id}
                  className={commonStyles.tableRow}
                  style={{
                    background:
                      row.student_id === selectedStudentId
                        ? "#fef2f2"
                        : "transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => setSelectedStudentId(row.student_id)}
                >
                  <td>{row.rowIndex}</td>
                  <td>{row.student_id}</td>
                  <td>{row.full_name}</td>
                  <td>{row.sectionName}</td>
                  <td>{row.yearLevel}</td>
                  <td>{row.subjectCode}</td>
                  <td>{row.schedule}</td>
                  <td>{row.displayGrade}</td>
                  <td>
                    <div className={styles.tableActionGroup}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openGradeHistoryModal(row.student_id);
                        }}
                        className={styles.tableActionButton}
                        aria-label={`View grade history for ${row.full_name}`}
                        title="View grade history"
                      >
                        <i className="fas fa-eye" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditStudentModal(row.student_id);
                        }}
                        className={styles.tableActionButton}
                        aria-label={`Edit student info for ${row.full_name}`}
                        title="Edit student info"
                      >
                        <i className="fas fa-pen-to-square" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openGradeModal(row.student_id);
                        }}
                        className={styles.tableActionButton}
                        aria-label={`Add grade for ${row.full_name}`}
                        title="Add grade"
                      >
                        <i className="fas fa-plus" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isGradeHistoryModalOpen && selectedStudent ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 1000,
          }}
          onClick={closeGradeHistoryModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="grade-history-title"
            style={{
              width: "min(900px, 100%)",
              background: "#fff",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 24px 80px rgba(15, 23, 42, 0.16)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.contentCardHeader}>
              <div>
                <div className={styles.contentCardEyebrow}>Grade history</div>
                <h2 id="grade-history-title" style={{ margin: 0 }}>
                  {selectedStudent.full_name}'s Grades
                </h2>
              </div>
              <button
                type="button"
                onClick={closeGradeHistoryModal}
                aria-label="Close grade history"
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 22,
                  lineHeight: 1,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                marginTop: 20,
                padding: "10px 12px",
                borderRadius: 8,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                fontSize: 12,
                color: "#64748B",
              }}
            >
              {SEMESTER_INFO_TEXT}
            </div>

            <label
              style={{
                display: "grid",
                gap: 6,
                marginTop: 16,
                maxWidth: 240,
              }}
            >
              <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
                Filter by semester
              </span>
              <select
                value={semesterFilter}
                onChange={(event) => setSemesterFilter(event.target.value)}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                }}
              >
                {SEMESTER_FILTER_OPTIONS.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {gradesLoading ? (
              <p style={{ marginTop: 16 }}>Loading grade history…</p>
            ) : gradesError ? (
              <p style={{ color: "#b91c1c", marginTop: 16 }}>{gradesError}</p>
            ) : filteredStudentGrades.length === 0 ? (
              <p style={{ marginTop: 16 }}>No grade history found for this semester.</p>
            ) : (
              <div
                className={commonStyles.tableWrapper}
                style={{ marginTop: 16, overflowX: "auto" }}
              >
                <table
                  className={commonStyles.table}
                  style={{ width: "100%", borderCollapse: "collapse" }}
                >
                  <colgroup>
                    <col style={{ width: "30%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "25%" }} />
                    <col style={{ width: "18%" }} />
                  </colgroup>
                  <thead className={commonStyles.tableHead}>
                    <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                      <th style={{ padding: "12px 16px", textAlign: "left" }}>Subject</th>
                      <th style={{ padding: "12px 16px", textAlign: "center" }}>Semester</th>
                      <th style={{ padding: "12px 16px", textAlign: "center" }}>Grade</th>
                      <th style={{ padding: "12px 16px", textAlign: "left" }}>Remarks</th>
                      <th style={{ padding: "12px 16px", textAlign: "center" }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudentGrades.map((record) => (
                      <tr
                        key={record.id}
                        className={commonStyles.tableRow}
                        style={{ borderBottom: "1px solid #f1f5f9" }}
                      >
                        <td style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600" }}>
                          {record.subject_name}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          {formatSemesterCode(record.semester)}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                          {record.grade}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "left" }}>
                          {record.remarks || "-"}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          {new Date(record.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {isGradeModalOpen && selectedStudent ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "min(660px, 100%)",
              background: "#fff",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 24px 80px rgba(15, 23, 42, 0.16)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>Add Grade</h2>
                <p style={{ margin: "8px 0 0", color: "#64748B" }}>
                  Add a new grade record for {selectedStudent.full_name}.
                </p>
              </div>
              <button
                type="button"
                onClick={closeGradeModal}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 22,
                  lineHeight: 1,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <label
                  style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}
                >
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Subject"
                  value={gradeForm.subject}
                  onChange={(e) => handleGradeChange("subject", e.target.value)}
                  style={{ padding: 12, borderRadius: 12, width: "100%" }}
                />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <label
                  style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}
                >
                  Semester
                </label>
                <select
                  value={gradeForm.semester}
                  onChange={(e) =>
                    handleGradeChange("semester", e.target.value)
                  }
                  style={{ padding: 12, borderRadius: 12, width: "100%" }}
                >
                  {SEMESTER_FORM_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p style={{ margin: "6px 0 0", fontSize: 12, color: "#64748B" }}>
                  {SEMESTER_INFO_TEXT}
                </p>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <label
                  style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}
                >
                  Grade (1-5)
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  step={1}
                  placeholder="1-5"
                  value={gradeForm.grade}
                  onChange={(e) => handleGradeChange("grade", e.target.value)}
                  style={{ padding: 12, borderRadius: 12, width: "100%" }}
                />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <label
                  style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}
                >
                  Remarks
                </label>
                
                <textarea
                  placeholder="Remarks"
                  value={gradeForm.remarks}
                  onChange={(e) => handleGradeChange("remarks", e.target.value)}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    minHeight: 100,
                    width: "100%",
                  }}
                />
              </div>

              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}
              >
                <button
                  type="button"
                  onClick={closeGradeModal}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddGrade}
                  disabled={isSavingGrade}
                  className={commonStyles.primaryButton}
                  style={{ padding: "10px 16px" }}
                >
                  {isSavingGrade ? "Saving..." : "Save Grade Record"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isEditStudentModalOpen && selectedStudent ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 1000,
          }}
          onClick={closeEditStudentModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-student-title"
            style={{
              width: "min(660px, 100%)",
              background: "#fff",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 24px 80px rgba(15, 23, 42, 0.16)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <div>
                <h2 id="edit-student-title" style={{ margin: 0 }}>
                  Edit Student Info
                </h2>
                <p style={{ margin: "8px 0 0", color: "#64748B" }}>
                  Update profile details for {selectedStudent.full_name}.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditStudentModal}
                aria-label="Close edit student info"
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 22,
                  lineHeight: 1,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
                  Student ID
                </label>
                <input
                  type="text"
                  value={studentInfoForm.student_id}
                  onChange={(e) =>
                    handleStudentInfoChange("student_id", e.target.value)
                  }
                  style={{ padding: 12, borderRadius: 12, width: "100%" }}
                />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
                  Department
                </label>
                <input
                  type="text"
                  value={studentInfoForm.department}
                  onChange={(e) =>
                    handleStudentInfoChange("department", e.target.value)
                  }
                  style={{ padding: 12, borderRadius: 12, width: "100%" }}
                />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
                  Section
                </label>
                <input
                  type="text"
                  value={studentInfoForm.section}
                  onChange={(e) =>
                    handleStudentInfoChange("section", e.target.value)
                  }
                  style={{ padding: 12, borderRadius: 12, width: "100%" }}
                />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
                  Year Level
                </label>
                <select
                  value={studentInfoForm.year_level}
                  onChange={(e) =>
                    handleStudentInfoChange("year_level", e.target.value)
                  }
                  style={{ padding: 12, borderRadius: 12, width: "100%" }}
                >
                  {YEAR_LEVEL_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
                  Risk Level
                </label>
                <select
                  value={studentInfoForm.risk_level}
                  onChange={(e) =>
                    handleStudentInfoChange("risk_level", e.target.value)
                  }
                  style={{ padding: 12, borderRadius: 12, width: "100%" }}
                >
                  {RISK_LEVEL_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}
              >
                <button
                  type="button"
                  onClick={closeEditStudentModal}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveStudentInfo}
                  disabled={isSavingStudentInfo}
                  className={commonStyles.primaryButton}
                  style={{ padding: "10px 16px" }}
                >
                  {isSavingStudentInfo ? "Saving..." : "Save Student Info"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StudentManagementPage;