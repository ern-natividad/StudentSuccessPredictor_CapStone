import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useDashboard } from "../../../hooks/useDashboard";
import { useToast } from "../../../components/Common/Toast";
import { usePrograms } from "../../../hooks/usePrograms";
import { api } from "../../../services/api";
import { upsertStudentInfo } from "../../../services/studentInfoService";
import { AUTH_ROLES } from "../../../utils/constants";
import {
  SEMESTER_FILTER_OPTIONS,
  SEMESTER_FORM_OPTIONS,
  SEMESTER_INFO_TEXT,
  SCHOOL_YEAR_INFO_TEXT,
  buildSchoolYearOptions,
  formatSemesterCode,
  formatSchoolYear,
  getCurrentAcademicYear,
  getSchoolYearFromRecord,
  getUniqueAcademicYears,
  matchesSchoolYearFilter,
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
const GRADE_VALUE_OPTIONS = ["1", "2", "3", "INC", "5"];
const REMARKS_OPTIONS = ["Pass", "Fail", "INC"];

const createEmptyGradeForm = () => ({
  subjectCode: "",
  subject: "",
  semester: "1",
  schoolYear: getCurrentAcademicYear(),
  grade: "",
  remarks: "Pass",
});

const SCHOOL_YEAR_OPTIONS = buildSchoolYearOptions(6);

const modalFieldLabelStyle = {
  fontSize: "0.825rem",
  color: "#334155",
  fontWeight: "600",
};

const modalFieldInputStyle = {
  padding: "0.65rem 0.85rem",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  fontSize: "0.9rem",
  color: "#0f172a",
  backgroundColor: "#ffffff",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const normalizeGradeFormValue = (value) => {
  const raw = String(value ?? "").trim().toUpperCase();
  if (GRADE_VALUE_OPTIONS.includes(raw)) return raw;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && GRADE_VALUE_OPTIONS.includes(String(numeric))) {
    return String(numeric);
  }
  return "";
};

const normalizeRemarksValue = (value) => {
  const raw = String(value ?? "").trim();
  if (REMARKS_OPTIONS.includes(raw)) return raw;
  const lower = raw.toLowerCase();
  if (lower.includes("fail")) return "Fail";
  if (lower === "inc" || lower.includes("incomplete")) return "INC";
  if (lower.includes("pass")) return "Pass";
  return "Pass";
};

const createEmptyStudentInfoForm = (defaultProgram = "") => ({
  student_id: "",
  department: "Engineering",
  program: defaultProgram,
  section: "",
  year_level: YEAR_LEVEL_OPTIONS[0],
  risk_level: "Low",
});

const getStudentSectionLabel = (student, getSectionById) =>
  getStaffSectionLabel(getStudentSectionValue(student), getSectionById);

const StudentManagementPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { programNames } = usePrograms();
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

  const isAdmin = user?.role === "admin";

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

  const displayStudentList = useMemo(() => {
    // Admins see every student, with or without a section assignment.
    if (isAdmin) return students;
    if (!loggedInStaff) return [];
    return getStudentsForStaff(loggedInStaff.id);
  }, [getStudentsForStaff, isAdmin, loggedInStaff, students]);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [isGradeHistoryModalOpen, setIsGradeHistoryModalOpen] = useState(false);
  const [semesterFilter, setSemesterFilter] = useState("");
  const [schoolYearFilter, setSchoolYearFilter] = useState("");
  const [isSavingGrade, setIsSavingGrade] = useState(false);
  const [isSavingStudentInfo, setIsSavingStudentInfo] = useState(false);
  const [isSavingEditGrade, setIsSavingEditGrade] = useState(false);
  const [isDeletingGrade, setIsDeletingGrade] = useState(false);
  const [gradeForm, setGradeForm] = useState(createEmptyGradeForm);
  const [editGradeForm, setEditGradeForm] = useState(createEmptyGradeForm);
  const [editingGradeRecord, setEditingGradeRecord] = useState(null);
  const [deletingGradeRecord, setDeletingGradeRecord] = useState(null);
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
      studentGrades.filter(
        (record) =>
          matchesSemesterFilter(record.semester, semesterFilter) &&
          matchesSchoolYearFilter(record, schoolYearFilter),
      ),
    [schoolYearFilter, semesterFilter, studentGrades],
  );

  const schoolYearFilterOptions = useMemo(() => {
    const yearsFromRecords = getUniqueAcademicYears(studentGrades);
    const merged = [...new Set([...SCHOOL_YEAR_OPTIONS, ...yearsFromRecords])].sort(
      (left, right) => right.localeCompare(left),
    );
    return [{ value: "", label: "All school years" }, ...merged.map((year) => ({ value: year, label: `SY ${year}` }))];
  }, [studentGrades]);

  const schoolYearFormOptions = useMemo(() => {
    const yearsFromRecords = getUniqueAcademicYears(studentGrades);
    return [...new Set([...SCHOOL_YEAR_OPTIONS, ...yearsFromRecords])].sort((left, right) =>
      right.localeCompare(left),
    );
  }, [studentGrades]);

  useEffect(() => {
    if (!selectedStudentId && displayStudentList.length > 0) {
      setSelectedStudentId(displayStudentList[0].student_id);
    }
  }, [displayStudentList, selectedStudentId]);

  useEffect(() => {
    if (selectedStudent) {
      setGradeForm(createEmptyGradeForm());
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
      })),
    [displayStudentList, getSectionById],
  );

  const handleGradeChange = (field, value) => {
    setGradeForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditGradeChange = (field, value) => {
    setEditGradeForm((prev) => ({ ...prev, [field]: value }));
  };

  const openGradeModal = (studentId) => {
    setSelectedStudentId(studentId);
    setGradeForm(createEmptyGradeForm());
    setIsGradeModalOpen(true);
  };

  const closeGradeModal = () => {
    setIsGradeModalOpen(false);
  };

  const openEditGradeModal = (record) => {
    const semesterCode = formatSemesterCode(record.semester);
    setEditingGradeRecord(record);
    setEditGradeForm({
      subjectCode: record.subject_code || "",
      subject: record.subject_name || "",
      semester: semesterCode === "—" ? "1" : semesterCode,
      schoolYear: getSchoolYearFromRecord(record),
      grade: normalizeGradeFormValue(record.grade),
      remarks: normalizeRemarksValue(record.remarks),
    });
  };

  const closeEditGradeModal = () => {
    setEditingGradeRecord(null);
    setEditGradeForm(createEmptyGradeForm());
  };

  const openDeleteGradeModal = (record) => {
    setDeletingGradeRecord(record);
  };

  const closeDeleteGradeModal = () => {
    setDeletingGradeRecord(null);
  };

  const openEditStudentModal = (studentId) => {
    const student = displayStudentList.find(
      (entry) => entry.student_id === studentId,
    );
    if (!student) return;

    const resolvedProgram =
      student.program ||
      (programNames.includes(student.department)
        ? student.department
        : programNames[0] || "");

    setSelectedStudentId(studentId);
    setStudentInfoForm({
      student_id: student.student_id || "",
      department: student.department || "Engineering",
      program: resolvedProgram,
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
        program: studentInfoForm.program,
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
    setSchoolYearFilter("");
    setIsGradeHistoryModalOpen(true);
  };

  const closeGradeHistoryModal = () => {
    setIsGradeHistoryModalOpen(false);
  };

  const handleAddGrade = async () => {
    const allowedGrades = new Set(["1", "2", "3", "INC", "5"]);
    const selectedGrade = String(gradeForm.grade ?? "").trim().toUpperCase();

    if (
      !selectedStudent ||
      !gradeForm.subjectCode.trim() ||
      !gradeForm.subject.trim() ||
      !gradeForm.schoolYear.trim() ||
      !allowedGrades.has(selectedGrade)
    ) {
      toast.error(
        "Enter a subject code, description, school year, and select a grade (1, 2, 3, INC, or 5).",
      );
      return;
    }

    try {
      setIsSavingGrade(true);
      const payload = {
        user_id: selectedStudent.user_id,
        subject_code: gradeForm.subjectCode.trim(),
        subject_name: gradeForm.subject.trim(),
        semester: gradeForm.semester,
        school_year: gradeForm.schoolYear.trim(),
        grade: selectedGrade,
        remarks: gradeForm.remarks.trim() || "",
      };

      const result = await api.createStudentGrade(payload);
      if (!result?.grade?.subject_code) {
        throw new Error(
          "Grade saved, but subject code was not stored. Restart the backend and try again.",
        );
      }
      setStudentGrades((prevGrades) => [result.grade, ...prevGrades]);
      setGradeForm(createEmptyGradeForm());
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

  const handleUpdateGrade = async () => {
    if (!editingGradeRecord || !selectedStudent) return;

    const selectedGrade = String(editGradeForm.grade ?? "").trim().toUpperCase();
    if (
      !editGradeForm.subjectCode.trim() ||
      !editGradeForm.subject.trim() ||
      !editGradeForm.schoolYear.trim() ||
      !GRADE_VALUE_OPTIONS.includes(selectedGrade)
    ) {
      toast.error(
        "Enter a subject code, description, school year, and select a grade (1, 2, 3, INC, or 5).",
      );
      return;
    }

    try {
      setIsSavingEditGrade(true);
      const payload = {
        subject_code: editGradeForm.subjectCode.trim(),
        subject_name: editGradeForm.subject.trim(),
        semester: editGradeForm.semester,
        school_year: editGradeForm.schoolYear.trim(),
        grade: selectedGrade,
        remarks: editGradeForm.remarks.trim() || "",
      };
      const result = await api.updateStudentGrade(editingGradeRecord.id, payload);
      if (!result?.grade?.subject_code) {
        throw new Error(
          "Grade updated, but subject code was not stored. Restart the backend and try again.",
        );
      }
      const nextGrades = studentGrades.map((record) =>
        record.id === editingGradeRecord.id ? result.grade : record,
      );
      setStudentGrades(nextGrades);
      updateStudentGradeRecord(selectedStudent.student_id, nextGrades);
      closeEditGradeModal();
      toast.success("Grade record updated successfully.");
    } catch (error) {
      toast.error(error.message || "Unable to update the grade record.");
    } finally {
      setIsSavingEditGrade(false);
    }
  };

  const handleDeleteGrade = async () => {
    if (!deletingGradeRecord || !selectedStudent) return;

    try {
      setIsDeletingGrade(true);
      await api.deleteStudentGrade(deletingGradeRecord.id);
      const nextGrades = studentGrades.filter(
        (record) => record.id !== deletingGradeRecord.id,
      );
      setStudentGrades(nextGrades);
      updateStudentGradeRecord(selectedStudent.student_id, nextGrades);
      closeDeleteGradeModal();
      toast.success("Grade record deleted successfully.");
    } catch (error) {
      toast.error(error.message || "Unable to delete the grade record.");
    } finally {
      setIsDeletingGrade(false);
    }
  };

  const assignedSectionCount = useMemo(() => {
    if (isAdmin) {
      return new Set(
        displayStudentList
          .map((student) => getStudentSectionValue(student))
          .map((section) => String(section || "").trim())
          .filter(Boolean)
          .filter((section) => section.toLowerCase() !== "unassigned"),
      ).size;
    }

    if (!loggedInStaff) return 0;
    return getStaffAssignedSections(loggedInStaff).length;
  }, [displayStudentList, isAdmin, loggedInStaff]);

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
      {
        label: isAdmin ? "Total students" : "Assigned students",
        value: displayStudentList.length,
      },
      {
        label: isAdmin ? "Sections in use" : "Sections covered",
        value: assignedSectionCount,
      },
      { label: "Average grade", value: averageGrade },
      {
        label: "Current focus",
        value: selectedStudent ? "Selected" : "None",
      },
    ];
  }, [assignedSectionCount, displayStudentList, isAdmin, selectedStudent]);

  return (
    <div className={styles.pageShell}>
      <div className={styles.pageHeaderCard}>
        <div>
          <h1 className={styles.pageTitle}>Student Management</h1>
          <p className={styles.pageSubtitle}>
            {isAdmin
              ? "Review all enrolled learners, manage grade entries, and keep student records organized in one space."
              : "Review assigned learners, manage grade entries, and keep student support tasks organized in one space."}
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
              {selectedStudent.program || selectedStudent.department || "Program pending"}
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
            <div className={styles.contentCardEyebrow}>
              {isAdmin ? "Student directory" : "Assigned learners"}
            </div>
            <div className={styles.contentCardTitle}>
              {isAdmin ? "All Students" : "Assigned Students"}
            </div>
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
              <col style={{ width: "14%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "23%" }} />
            </colgroup>
            <thead className={commonStyles.tableHead}>
              <tr>
                <th>#</th>
                <th>Student ID</th>
                <th>Name</th>
                <th>Program</th>
                <th>Section</th>
                <th>Year Level</th>
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
                  <td>{row.program || "—"}</td>
                  <td>{row.sectionName}</td>
                  <td>{row.yearLevel}</td>
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
              {SEMESTER_INFO_TEXT} {SCHOOL_YEAR_INFO_TEXT}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 12,
                marginTop: 16,
              }}
            >
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
                  Filter by school year
                </span>
                <select
                  value={schoolYearFilter}
                  onChange={(event) => setSchoolYearFilter(event.target.value)}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                  }}
                >
                  {schoolYearFilterOptions.map((option) => (
                    <option key={option.value || "all-years"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
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
            </div>

            {gradesLoading ? (
              <p style={{ marginTop: 16 }}>Loading grade history…</p>
            ) : gradesError ? (
              <p style={{ color: "#b91c1c", marginTop: 16 }}>{gradesError}</p>
            ) : filteredStudentGrades.length === 0 ? (
              <p style={{ marginTop: 16 }}>No grade history found for these filters.</p>
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
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "14%" }} />
                  </colgroup>
                  <thead className={commonStyles.tableHead}>
                    <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                      <th style={{ padding: "12px 16px", textAlign: "left" }}>Code</th>
                      <th style={{ padding: "12px 16px", textAlign: "left" }}>Subject</th>
                      <th style={{ padding: "12px 16px", textAlign: "center" }}>School Year</th>
                      <th style={{ padding: "12px 16px", textAlign: "center" }}>Semester</th>
                      <th style={{ padding: "12px 16px", textAlign: "center" }}>Grade</th>
                      <th style={{ padding: "12px 16px", textAlign: "left" }}>Remarks</th>
                      <th style={{ padding: "12px 16px", textAlign: "center" }}>Date</th>
                      <th style={{ padding: "12px 16px", textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudentGrades.map((record) => (
                      <tr
                        key={record.id}
                        className={commonStyles.tableRow}
                        style={{ borderBottom: "1px solid #f1f5f9" }}
                      >
                        <td style={{ padding: "12px 16px", textAlign: "left", fontWeight: "700" }}>
                          {record.subject_code || "—"}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600" }}>
                          {record.subject_name}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          {formatSchoolYear(getSchoolYearFromRecord(record))}
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
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <div className={styles.tableActionGroup}>
                            <button
                              type="button"
                              className={styles.tableActionButton}
                              onClick={() => openEditGradeModal(record)}
                              title="Edit grade"
                              aria-label={`Edit grade for ${record.subject_name}`}
                            >
                              <i className="fas fa-pen-to-square" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className={styles.tableActionButton}
                              onClick={() => openDeleteGradeModal(record)}
                              title="Delete grade"
                              aria-label={`Delete grade for ${record.subject_name}`}
                              style={{ color: "#ef4444" }}
                            >
                              <i className="fas fa-trash-can" aria-hidden="true" />
                            </button>
                          </div>
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
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 1000,
          }}
          onClick={closeGradeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-grade-title"
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "min(560px, 100%)",
              padding: "28px",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e2e8f0",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "24px",
                paddingBottom: "16px",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    backgroundColor: "#fdf2f2",
                    color: "#8b0000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.1rem",
                  }}
                >
                  <i className="fas fa-clipboard-list" aria-hidden="true" />
                </div>
                <div>
                  <h2
                    id="add-grade-title"
                    style={{
                      margin: 0,
                      fontSize: "1.2rem",
                      fontWeight: "700",
                      color: "#0f172a",
                    }}
                  >
                    Add Grade
                  </h2>
                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "#64748b",
                      fontSize: "0.85rem",
                    }}
                  >
                    Add a new grade record for {selectedStudent.full_name}.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeGradeModal}
                aria-label="Close add grade"
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "20px",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "4px",
                  lineHeight: 1,
                  borderRadius: "6px",
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#0f172a")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#94a3b8")}
              >
                ×
              </button>
            </div>

            <div style={{ display: "grid", gap: "18px" }}>
              <div style={{ display: "grid", gap: "6px" }}>
                <label style={modalFieldLabelStyle}>Subject Code</label>
                <input
                  type="text"
                  placeholder="e.g., CE 101"
                  value={gradeForm.subjectCode}
                  onChange={(e) =>
                    handleGradeChange("subjectCode", e.target.value)
                  }
                  style={modalFieldInputStyle}
                />
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                  Short course code that appears in the student grade report.
                </p>
              </div>

              <div style={{ display: "grid", gap: "6px" }}>
                <label style={modalFieldLabelStyle}>Subject Description</label>
                <input
                  type="text"
                  placeholder="e.g., Introduction to Civil Engineering"
                  value={gradeForm.subject}
                  onChange={(e) => handleGradeChange("subject", e.target.value)}
                  style={modalFieldInputStyle}
                />
              </div>

              <div style={{ display: "grid", gap: "6px" }}>
                <label style={modalFieldLabelStyle}>School Year</label>
                <select
                  value={gradeForm.schoolYear}
                  onChange={(e) =>
                    handleGradeChange("schoolYear", e.target.value)
                  }
                  style={modalFieldInputStyle}
                >
                  {schoolYearFormOptions.map((year) => (
                    <option key={year} value={year}>
                      SY {year}
                    </option>
                  ))}
                </select>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                  {SCHOOL_YEAR_INFO_TEXT}
                </p>
              </div>

              <div style={{ display: "grid", gap: "6px" }}>
                <label style={modalFieldLabelStyle}>Semester</label>
                <select
                  value={gradeForm.semester}
                  onChange={(e) =>
                    handleGradeChange("semester", e.target.value)
                  }
                  style={modalFieldInputStyle}
                >
                  {SEMESTER_FORM_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                  {SEMESTER_INFO_TEXT}
                </p>
              </div>

              <div style={{ display: "grid", gap: "6px" }}>
                <label style={modalFieldLabelStyle}>Grade</label>
                <select
                  value={gradeForm.grade}
                  onChange={(e) => handleGradeChange("grade", e.target.value)}
                  style={modalFieldInputStyle}
                >
                  <option value="" disabled>
                    Select grade
                  </option>
                  {GRADE_VALUE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gap: "6px" }}>
                <label style={modalFieldLabelStyle}>Remarks</label>
                <select
                  value={gradeForm.remarks}
                  onChange={(e) => handleGradeChange("remarks", e.target.value)}
                  style={modalFieldInputStyle}
                >
                  {REMARKS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                  marginTop: "12px",
                  paddingTop: "16px",
                  borderTop: "1px solid #f1f5f9",
                }}
              >
                <button
                  type="button"
                  onClick={closeGradeModal}
                  style={{
                    padding: "0.55rem 1.1rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontWeight: "600",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f8fafc")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "#ffffff")
                  }
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddGrade}
                  disabled={isSavingGrade}
                  style={{
                    padding: "0.55rem 1.25rem",
                    borderRadius: "8px",
                    border: "none",
                    background: "#8b0000",
                    color: "#ffffff",
                    fontWeight: "600",
                    fontSize: "0.875rem",
                    cursor: isSavingGrade ? "not-allowed" : "pointer",
                    opacity: isSavingGrade ? 0.75 : 1,
                    boxShadow: "0 2px 4px rgba(139, 0, 0, 0.15)",
                    transition: "all 0.15s ease",
                  }}
                  onMouseOver={(e) => {
                    if (!isSavingGrade) {
                      e.currentTarget.style.backgroundColor = "#700000";
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#8b0000";
                  }}
                >
                  {isSavingGrade ? "Saving..." : "Save Grade Record"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editingGradeRecord && selectedStudent ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 1100,
          }}
          onClick={closeEditGradeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-grade-title"
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "min(560px, 100%)",
              padding: "28px",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e2e8f0",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "24px",
                paddingBottom: "16px",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    backgroundColor: "#fdf2f2",
                    color: "#8b0000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.1rem",
                  }}
                >
                  <i className="fas fa-pen-to-square" aria-hidden="true" />
                </div>
                <div>
                  <h2
                    id="edit-grade-title"
                    style={{
                      margin: 0,
                      fontSize: "1.2rem",
                      fontWeight: "700",
                      color: "#0f172a",
                    }}
                  >
                    Edit Grade
                  </h2>
                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "#64748b",
                      fontSize: "0.85rem",
                    }}
                  >
                    Update the grade record for {selectedStudent.full_name}.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEditGradeModal}
                aria-label="Close edit grade"
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "20px",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "4px",
                  lineHeight: 1,
                  borderRadius: "6px",
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#0f172a")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#94a3b8")}
              >
                ×
              </button>
            </div>

            <div style={{ display: "grid", gap: "18px" }}>
              <div style={{ display: "grid", gap: "6px" }}>
                <label style={modalFieldLabelStyle}>Subject Code</label>
                <input
                  type="text"
                  placeholder="e.g., CE 101"
                  value={editGradeForm.subjectCode}
                  onChange={(e) =>
                    handleEditGradeChange("subjectCode", e.target.value)
                  }
                  style={modalFieldInputStyle}
                />
              </div>

              <div style={{ display: "grid", gap: "6px" }}>
                <label style={modalFieldLabelStyle}>Subject Description</label>
                <input
                  type="text"
                  placeholder="e.g., Introduction to Civil Engineering"
                  value={editGradeForm.subject}
                  onChange={(e) =>
                    handleEditGradeChange("subject", e.target.value)
                  }
                  style={modalFieldInputStyle}
                />
              </div>

              <div style={{ display: "grid", gap: "6px" }}>
                <label style={modalFieldLabelStyle}>School Year</label>
                <select
                  value={editGradeForm.schoolYear}
                  onChange={(e) =>
                    handleEditGradeChange("schoolYear", e.target.value)
                  }
                  style={modalFieldInputStyle}
                >
                  {schoolYearFormOptions.map((year) => (
                    <option key={year} value={year}>
                      SY {year}
                    </option>
                  ))}
                </select>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                  {SCHOOL_YEAR_INFO_TEXT}
                </p>
              </div>

              <div style={{ display: "grid", gap: "6px" }}>
                <label style={modalFieldLabelStyle}>Semester</label>
                <select
                  value={editGradeForm.semester}
                  onChange={(e) =>
                    handleEditGradeChange("semester", e.target.value)
                  }
                  style={modalFieldInputStyle}
                >
                  {SEMESTER_FORM_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                  {SEMESTER_INFO_TEXT}
                </p>
              </div>

              <div style={{ display: "grid", gap: "6px" }}>
                <label style={modalFieldLabelStyle}>Grade</label>
                <select
                  value={editGradeForm.grade}
                  onChange={(e) =>
                    handleEditGradeChange("grade", e.target.value)
                  }
                  style={modalFieldInputStyle}
                >
                  <option value="" disabled>
                    Select grade
                  </option>
                  {GRADE_VALUE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gap: "6px" }}>
                <label style={modalFieldLabelStyle}>Remarks</label>
                <select
                  value={editGradeForm.remarks}
                  onChange={(e) =>
                    handleEditGradeChange("remarks", e.target.value)
                  }
                  style={modalFieldInputStyle}
                >
                  {REMARKS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                  marginTop: "12px",
                  paddingTop: "16px",
                  borderTop: "1px solid #f1f5f9",
                }}
              >
                <button
                  type="button"
                  onClick={closeEditGradeModal}
                  style={{
                    padding: "0.55rem 1.1rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontWeight: "600",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f8fafc")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "#ffffff")
                  }
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateGrade}
                  disabled={isSavingEditGrade}
                  style={{
                    padding: "0.55rem 1.25rem",
                    borderRadius: "8px",
                    border: "none",
                    background: "#8b0000",
                    color: "#ffffff",
                    fontWeight: "600",
                    fontSize: "0.875rem",
                    cursor: isSavingEditGrade ? "not-allowed" : "pointer",
                    opacity: isSavingEditGrade ? 0.75 : 1,
                    boxShadow: "0 2px 4px rgba(139, 0, 0, 0.15)",
                    transition: "all 0.15s ease",
                  }}
                  onMouseOver={(e) => {
                    if (!isSavingEditGrade) {
                      e.currentTarget.style.backgroundColor = "#700000";
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#8b0000";
                  }}
                >
                  {isSavingEditGrade ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deletingGradeRecord ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 1100,
          }}
          onClick={closeDeleteGradeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-grade-title"
            style={{
              width: "min(440px, 100%)",
              background: "#fff",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 24px 80px rgba(15, 23, 42, 0.16)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="delete-grade-title"
              style={{ margin: "0 0 12px", color: "#800000", fontSize: "1.25rem", fontWeight: 700 }}
            >
              Delete Grade Record
            </h2>
            <p
              style={{
                margin: "0 0 24px 0",
                color: "#475569",
                fontSize: "1.05rem",
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to permanently delete the grade for{" "}
              <strong>
                {deletingGradeRecord.subject_code
                  ? `${deletingGradeRecord.subject_code} — ${deletingGradeRecord.subject_name}`
                  : deletingGradeRecord.subject_name}
              </strong>
              {deletingGradeRecord.grade != null
                ? ` (${deletingGradeRecord.grade})`
                : ""}
              ? This action cannot be undone.
            </p>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                width: "100%",
              }}
            >
              <button
                type="button"
                onClick={handleDeleteGrade}
                disabled={isDeletingGrade}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 6,
                  border: "none",
                  background: "#800000",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  cursor: isDeletingGrade ? "not-allowed" : "pointer",
                  textAlign: "center",
                  opacity: isDeletingGrade ? 0.7 : 1,
                  transition: "background-color 0.15s ease",
                }}
                onMouseOver={(e) => {
                  if (!isDeletingGrade) e.currentTarget.style.backgroundColor = "#600000";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#800000";
                }}
              >
                {isDeletingGrade ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                type="button"
                onClick={closeDeleteGradeModal}
                disabled={isDeletingGrade}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 6,
                  border: "none",
                  background: "#cccccc",
                  color: "#1e293b",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  cursor: isDeletingGrade ? "not-allowed" : "pointer",
                  textAlign: "center",
                  transition: "background-color 0.15s ease",
                }}
                onMouseOver={(e) => {
                  if (!isDeletingGrade) e.currentTarget.style.backgroundColor = "#b8b8b8";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#cccccc";
                }}
              >
                Cancel
              </button>
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
            backdropFilter: "blur(4px)",
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
              background: "#ffffff",
              borderRadius: "16px",
              width: "min(560px, 100%)",
              padding: "28px",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e2e8f0",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "24px",
                paddingBottom: "16px",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    backgroundColor: "#fdf2f2",
                    color: "#8b0000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.1rem",
                  }}
                >
                  <i className="fas fa-user-pen" aria-hidden="true" />
                </div>
                <div>
                  <h2
                    id="edit-student-title"
                    style={{
                      margin: 0,
                      fontSize: "1.2rem",
                      fontWeight: "700",
                      color: "#0f172a",
                    }}
                  >
                    Edit Student Info
                  </h2>
                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "#64748b",
                      fontSize: "0.85rem",
                    }}
                  >
                    Update profile details for {selectedStudent.full_name}.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEditStudentModal}
                aria-label="Close edit student info"
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "20px",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "4px",
                  lineHeight: 1,
                  borderRadius: "6px",
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#0f172a")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#94a3b8")}
              >
                ×
              </button>
            </div>

            <div style={{ display: "grid", gap: "18px" }}>
              <div style={{ display: "grid", gap: "6px" }}>
                <label
                  style={{
                    fontSize: "0.825rem",
                    color: "#334155",
                    fontWeight: "600",
                  }}
                >
                  Student ID
                </label>
                <input
                  type="text"
                  value={studentInfoForm.student_id}
                  onChange={(e) =>
                    handleStudentInfoChange("student_id", e.target.value)
                  }
                  style={{
                    padding: "0.65rem 0.85rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    color: "#0f172a",
                    backgroundColor: "#ffffff",
                    outline: "none",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "grid", gap: "6px" }}>
                <label
                  style={{
                    fontSize: "0.825rem",
                    color: "#334155",
                    fontWeight: "600",
                  }}
                >
                  Department
                </label>
                <input
                  type="text"
                  value={studentInfoForm.department}
                  onChange={(e) =>
                    handleStudentInfoChange("department", e.target.value)
                  }
                  style={{
                    padding: "0.65rem 0.85rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    color: "#0f172a",
                    backgroundColor: "#ffffff",
                    outline: "none",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "grid", gap: "6px" }}>
                <label
                  style={{
                    fontSize: "0.825rem",
                    color: "#334155",
                    fontWeight: "600",
                  }}
                >
                  Program
                </label>
                <select
                  value={studentInfoForm.program}
                  onChange={(e) =>
                    handleStudentInfoChange("program", e.target.value)
                  }
                  style={{
                    padding: "0.65rem 0.85rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    color: "#0f172a",
                    backgroundColor: "#ffffff",
                    outline: "none",
                    width: "100%",
                  }}
                >
                  {programNames.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                  {studentInfoForm.program &&
                  !programNames.includes(studentInfoForm.program) ? (
                    <option value={studentInfoForm.program}>
                      {studentInfoForm.program}
                    </option>
                  ) : null}
                </select>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                  Choose which engineering program this student belongs to.
                </p>
              </div>

              <div style={{ display: "grid", gap: "6px" }}>
                <label
                  style={{
                    fontSize: "0.825rem",
                    color: "#334155",
                    fontWeight: "600",
                  }}
                >
                  Section
                </label>
                <input
                  type="text"
                  value={studentInfoForm.section}
                  onChange={(e) =>
                    handleStudentInfoChange("section", e.target.value)
                  }
                  placeholder="e.g., A"
                  style={{
                    padding: "0.65rem 0.85rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    color: "#0f172a",
                    backgroundColor: "#ffffff",
                    outline: "none",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "grid", gap: "6px" }}>
                <label
                  style={{
                    fontSize: "0.825rem",
                    color: "#334155",
                    fontWeight: "600",
                  }}
                >
                  Year Level
                </label>
                <select
                  value={studentInfoForm.year_level}
                  onChange={(e) =>
                    handleStudentInfoChange("year_level", e.target.value)
                  }
                  style={{
                    padding: "0.65rem 0.85rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    color: "#0f172a",
                    backgroundColor: "#ffffff",
                    outline: "none",
                    width: "100%",
                  }}
                >
                  {YEAR_LEVEL_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gap: "6px" }}>
                <label
                  style={{
                    fontSize: "0.825rem",
                    color: "#334155",
                    fontWeight: "600",
                  }}
                >
                  Risk Level
                </label>
                <select
                  value={studentInfoForm.risk_level}
                  onChange={(e) =>
                    handleStudentInfoChange("risk_level", e.target.value)
                  }
                  style={{
                    padding: "0.65rem 0.85rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    color: "#0f172a",
                    backgroundColor: "#ffffff",
                    outline: "none",
                    width: "100%",
                  }}
                >
                  {RISK_LEVEL_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                  marginTop: "12px",
                  paddingTop: "16px",
                  borderTop: "1px solid #f1f5f9",
                }}
              >
                <button
                  type="button"
                  onClick={closeEditStudentModal}
                  style={{
                    padding: "0.55rem 1.1rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontWeight: "600",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f8fafc")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "#ffffff")
                  }
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveStudentInfo}
                  disabled={isSavingStudentInfo}
                  style={{
                    padding: "0.55rem 1.25rem",
                    borderRadius: "8px",
                    border: "none",
                    background: "#8b0000",
                    color: "#ffffff",
                    fontWeight: "600",
                    fontSize: "0.875rem",
                    cursor: isSavingStudentInfo ? "not-allowed" : "pointer",
                    opacity: isSavingStudentInfo ? 0.75 : 1,
                    boxShadow: "0 2px 4px rgba(139, 0, 0, 0.15)",
                    transition: "all 0.15s ease",
                  }}
                  onMouseOver={(e) => {
                    if (!isSavingStudentInfo) {
                      e.currentTarget.style.backgroundColor = "#700000";
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#8b0000";
                  }}
                >
                  {isSavingStudentInfo ? "Saving..." : "Save Changes"}
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