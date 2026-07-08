import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useDashboard } from "../../../hooks/useDashboard";
import styles from "../../../styles/Dashboard.module.css";
import commonStyles from "../../../styles/Common.module.css";

const StudentManagementPage = () => {
  const { user } = useAuth();
  const {
    students,
    getStudentsForStaff,
    getSectionById,
    updateStudentGradeRecord,
  } = useDashboard();

  const currentStaff = useMemo(() => {
    if (!user || user.role !== "staff") return null;
    return (
      students.find(
        (student) =>
          student.assignedStaffId &&
          student.assignedStaffId.toLowerCase() ===
            (user.email || "").toLowerCase(),
      ) || null
    );
  }, [students, user]);

  const staffStudentList = useMemo(() => {
    if (!user || user.role !== "staff") return [];
    return getStudentsForStaff(user.email || "staff-1");
  }, [getStudentsForStaff, user]);

  const displayStudentList = useMemo(() => {
    const list =
      staffStudentList.length > 0 ? staffStudentList : students.slice(0, 5);
    return list.slice(0, 5);
  }, [staffStudentList, students]);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [gradeForm, setGradeForm] = useState({
    subject: "",
    semester: "1S",
    grade: "",
    remarks: "",
  });

  const selectedStudent = useMemo(
    () =>
      displayStudentList.find(
        (student) => student.student_id === selectedStudentId,
      ) ||
      displayStudentList[0] ||
      null,
    [displayStudentList, selectedStudentId],
  );

  useEffect(() => {
    if (!selectedStudentId && displayStudentList.length > 0) {
      setSelectedStudentId(displayStudentList[0].student_id);
    }
  }, [displayStudentList, selectedStudentId]);

  useEffect(() => {
    if (selectedStudent) {
      setGradeForm({ subject: "", semester: "1S", grade: "", remarks: "" });
    }
  }, [selectedStudent]);

  const studentTableRows = useMemo(
    () =>
      displayStudentList.map((student, rowIndex) => ({
        ...student,
        rowIndex: rowIndex + 1,
        sectionName:
          getSectionById(student.assignedSectionId)?.name || "Unassigned",
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
    setGradeForm({ subject: "", semester: "1S", grade: "", remarks: "" });
    setIsGradeModalOpen(true);
  };

  const closeGradeModal = () => {
    setIsGradeModalOpen(false);
  };

  const handleAddGrade = () => {
    if (
      !selectedStudent ||
      !gradeForm.subject.trim() ||
      gradeForm.grade === "" ||
      gradeForm.grade === null
    ) {
      return;
    }

    const nextGrades = [
      ...(selectedStudent.grade_records || []),
      { ...gradeForm },
    ];
    updateStudentGradeRecord(selectedStudent.student_id, nextGrades);
    setGradeForm({ subject: "", semester: "1S", grade: "", remarks: "" });
    setIsGradeModalOpen(false);
  };

  const handleEditGrade = (index, field, value) => {
    if (!selectedStudent) return;
    const nextGrades = (selectedStudent.grade_records || []).map(
      (record, idx) => (idx === index ? { ...record, [field]: value } : record),
    );
    updateStudentGradeRecord(selectedStudent.student_id, nextGrades);
  };

  const summaryStats = useMemo(() => {
    const sectionNames = new Set(
      displayStudentList
        .map((student) => getSectionById(student.assignedSectionId)?.name)
        .filter(Boolean),
    );

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
      { label: "Sections covered", value: sectionNames.size },
      { label: "Average grade", value: averageGrade },
      {
        label: "Current focus",
        value: selectedStudent ? "Selected" : "None",
      },
    ];
  }, [displayStudentList, getSectionById, selectedStudent]);

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
        <div className={styles.pageHeaderBadge}>
          {currentStaff?.full_name || "Staff overview"}
        </div>
      </div>

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
              {selectedStudent.student_id} • {selectedStudent.year_level} •{" "}
              {selectedStudent.program || "Program pending"}
            </div>
          </div>
          <div className={styles.selectedStudentTag}>
            Latest grade: {selectedStudent.displayGrade}
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

        <div className={commonStyles.tableWrapper} style={{ marginTop: 16 }}>
          <table className={commonStyles.table}>
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
                  <td>{row.year_level}</td>
                  <td>{row.subjectCode}</td>
                  <td>{row.schedule}</td>
                  <td>{row.displayGrade}</td>
                  <td style={{ minWidth: 150, whiteSpace: "nowrap" }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openGradeModal(row.student_id);
                      }}
                      className={styles.tableActionButton}
                    >
                      Manage Grades
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
                <h2 style={{ margin: 0 }}>Manage Grades</h2>
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
                  <option value="1S">1st Semester</option>
                  <option value="2S">2nd Semester</option>
                </select>
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
                  className={commonStyles.primaryButton}
                  style={{ padding: "10px 16px" }}
                >
                  Save Grade Record
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
