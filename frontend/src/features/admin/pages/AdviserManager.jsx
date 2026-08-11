import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "../../../hooks/useDashboard";
import styles from "../../../styles/Dashboard.module.css";
import commonStyles from "../../../styles/Common.module.css";

const AdviserManager = () => {
  const {
    sections,
    staffMembers,
    students,
    getStaffById,
    getSectionById,
    updateSectionAdviser,
    updateStaffRole,
    directoryLoading,
    directoryError,
  } = useDashboard();

  const [selectedEditRowId, setSelectedEditRowId] = useState(null);
  const [viewSectionId, setViewSectionId] = useState(null);
  const [editStaffId, setEditStaffId] = useState(staffMembers[0]?.id || "");
  const [editSectionId, setEditSectionId] = useState(sections[0]?.id || "");
  const [editRole, setEditRole] = useState("Adviser");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTeacherStaffId, setNewTeacherStaffId] = useState("");
  const [newTeacherRole, setNewTeacherRole] = useState("Adviser");
  const [newTeacherSectionId, setNewTeacherSectionId] = useState(
    sections[0]?.id || "",
  );
  const [staffSectionAssignments, setStaffSectionAssignments] = useState({});

  const selectedRow = useMemo(
    () => sections.find((section) => section.id === selectedEditRowId) || null,
    [sections, selectedEditRowId],
  );

  const selectedStaff = useMemo(
    () => getStaffById(selectedRow?.adviserId),
    [getStaffById, selectedRow],
  );

  useEffect(() => {
    if (selectedRow) {
      setEditSectionId(selectedRow.id);
      setEditStaffId(selectedRow.adviserId || staffMembers[0]?.id || "");
      setEditRole(
        selectedStaff?.title?.toLowerCase().includes("adviser")
          ? "Adviser"
          : "Subject Teacher",
      );
    }
  }, [selectedRow, selectedStaff, staffMembers]);

  const sectionOverviewRows = useMemo(() => {
    if (sections.length === 0) {
      return staffMembers.map((staff) => ({
        id: staff.id,
        name: staff.full_name,
        section:
          staffSectionAssignments[staff.id] ||
          staff.assignedSection ||
          "Unassigned",
        yearAssigned: staff.assignedYearLevel || "N/A",
        role: staff.title || "Academic Adviser",
        students: students.filter(
          (student) => student.assignedStaffId === staff.id,
        ).length,
        adviserId: staff.id,
      }));
    }

    return sections.map((section) => {
      const adviser = getStaffById(section.adviserId);
      const sectionStudents = students.filter(
        (student) => student.assignedSectionId === section.id,
      );
      return {
        id: section.id,
        name: adviser?.full_name || "Unassigned",
        section: section.name,
        yearAssigned: adviser?.assignedYearLevel || "N/A",
        role: adviser?.title?.toLowerCase().includes("adviser")
          ? "Adviser"
          : "Subject Teacher",
        students: sectionStudents.length,
        adviserId: section.adviserId,
      };
    });
  }, [
    sections,
    staffMembers,
    students,
    getStaffById,
    staffSectionAssignments,
  ]);

  const viewSectionStudents = useMemo(
    () =>
      students.filter((student) => student.assignedStaffId === viewSectionId),
    [students, viewSectionId],
  );

  const handleOpenEdit = (row) => {
    setSelectedEditRowId(row.id);
    setEditStaffId(row.adviserId || staffMembers[0]?.id || "");
    setEditSectionId(row.section === "Unassigned" ? "" : row.section);
    setEditRole(row.role);
  };

  const handleOpenAddModal = () => {
    setNewTeacherStaffId(staffMembers[0]?.id || "");
    setNewTeacherRole("Adviser");
    setNewTeacherSectionId(sections[0]?.id || "");
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedEditRowId(null);
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = () => {
    if (!selectedEditRowId || !editStaffId) return;
    updateStaffRole(editStaffId, editRole);
    setStaffSectionAssignments((currentAssignments) => ({
      ...currentAssignments,
      [editStaffId]: editSectionId,
    }));

    if (editSectionId) {
      updateSectionAdviser(editSectionId, editStaffId);
    }

    setSelectedEditRowId(null);
  };

  const handleSaveNewTeacher = () => {
    if (!newTeacherStaffId || !newTeacherRole || !newTeacherSectionId) return;
    updateStaffRole(newTeacherStaffId, newTeacherRole);
    setStaffSectionAssignments((currentAssignments) => ({
      ...currentAssignments,
      [newTeacherStaffId]: newTeacherSectionId,
    }));
    updateSectionAdviser(newTeacherSectionId, newTeacherStaffId);
    setIsAddModalOpen(false);
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>Manage Adviser</h1>

      {directoryError && <div className={styles.card}>{directoryError}</div>}

      <div className={styles.card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div className={styles.cardTitle}>Section Overview</div>
          <button
            type="button"
            onClick={handleOpenAddModal}
            style={{
              padding: "10px 18px",
              minWidth: 160,
              background: "#fff",
              color: "#8b0000",
              border: "1px solid #8b0000",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Add Teacher
          </button>
        </div>
        <div className={commonStyles.tableWrapper} style={{ marginTop: 12 }}>
          <table className={commonStyles.table}>
            <thead className={commonStyles.tableHead}>
              <tr>
                <th>Name</th>
                <th>Section</th>
                <th>Year Assigned</th>
                <th>Role</th>
                <th>Students</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {directoryLoading && (
                <tr>
                  <td colSpan={5} style={{ padding: 16, textAlign: "center" }}>
                    Loading staff…
                  </td>
                </tr>
              )}
              {sectionOverviewRows.map((row) => (
                <tr key={row.id} className={commonStyles.tableRow}>
                  <td>{row.name}</td>
                  <td>{row.section}</td>
                  <td>{row.yearAssigned || "N/A"}</td>
                  <td>{row.role}</td>
                  <td>{row.students}</td>
                  <td>
                    <div className={styles.tableActionGroup}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(row)}
                        className={styles.tableActionButton}
                        aria-label={`Edit ${row.name}'s assignment`}
                        title="Edit assignment"
                      >
                        <i className="fas fa-pen-to-square" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewSectionId(row.adviserId || row.id)}
                        className={styles.tableActionButton}
                        aria-label={`View students assigned to ${row.name}`}
                        title="View assigned students"
                      >
                        <i className="fas fa-users" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!directoryLoading && sectionOverviewRows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 16, textAlign: "center" }}>
                    No staff accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewSectionId ? (
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
          onClick={() => setViewSectionId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="assigned-students-title"
            style={{
              background: "#fff",
              borderRadius: 16,
              width: "min(980px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 24,
              boxShadow: "0 24px 80px rgba(15, 23, 42, 0.18)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.contentCardHeader}>
              <div>
                <div className={styles.contentCardEyebrow}>Assigned learners</div>
                <h2 id="assigned-students-title" style={{ margin: 0 }}>
                  Assigned Students
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewSectionId(null)}
                aria-label="Close assigned students"
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 22,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
            <div className={commonStyles.tableWrapper} style={{ marginTop: 20 }}>
              <table className={commonStyles.table}>
                <thead className={commonStyles.tableHead}>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Section</th>
                    <th>Year Level</th>
                    <th>Subject Code</th>
                    <th>Schedule</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {viewSectionStudents.map((student) => (
                    <tr key={student.student_id} className={commonStyles.tableRow}>
                      <td>{student.student_id}</td>
                      <td>{student.full_name}</td>
                      <td>
                        {getSectionById(student.assignedSectionId)?.name ||
                          "Unassigned"}
                      </td>
                      <td>{student.yearLevel}</td>
                      <td>{student.grade_records?.[0]?.subject || "N/A"}</td>
                      <td>{student.grade_records?.[0]?.semester || "TBA"}</td>
                      <td>{student.grade_records?.[0]?.grade || "N/A"}</td>
                    </tr>
                  ))}
                  {viewSectionStudents.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: 16, textAlign: "center" }}>
                        No students assigned to this section.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {selectedEditRowId || isAddModalOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              width: "min(620px, 100%)",
              padding: 24,
              boxShadow: "0 24px 80px rgba(15, 23, 42, 0.18)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>
                  {isAddModalOpen ? "Add Teacher" : "Edit Section Assignment"}
                </h2>
                <p style={{ margin: "8px 0 0", color: "#64748B" }}>
                  {isAddModalOpen
                    ? "Choose an existing staff account from the user directory and assign a role and section."
                    : "Change the staff role and the section they handle."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 18,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              {isAddModalOpen ? (
                <div style={{ display: "grid", gap: 6 }}>
                  <label
                    style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}
                  >
                    Staff account
                  </label>
                  <select
                    value={newTeacherStaffId}
                    onChange={(e) => setNewTeacherStaffId(e.target.value)}
                    style={{ padding: 12, borderRadius: 12, width: "100%" }}
                  >
                    <option value="">Select a staff account</option>
                    {staffMembers.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.full_name} ({staff.email})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 6 }}>
                  <label
                    style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}
                  >
                    Staff
                  </label>
                  <select
                    value={editStaffId}
                    onChange={(e) => setEditStaffId(e.target.value)}
                    style={{ padding: 12, borderRadius: 12, width: "100%" }}
                  >
                    {staffMembers.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: "grid", gap: 6 }}>
                <label
                  style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}
                >
                  Role
                </label>
                <select
                  value={isAddModalOpen ? newTeacherRole : editRole}
                  onChange={(e) =>
                    isAddModalOpen
                      ? setNewTeacherRole(e.target.value)
                      : setEditRole(e.target.value)
                  }
                  style={{ padding: 12, borderRadius: 12, width: "100%" }}
                >
                  <option value="Adviser">Adviser</option>
                  <option value="Subject Teacher">Subject Teacher</option>
                </select>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <label
                  style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}
                >
                  Section
                </label>
                <select
                  value={isAddModalOpen ? newTeacherSectionId : editSectionId}
                  onChange={(e) =>
                    isAddModalOpen
                      ? setNewTeacherSectionId(e.target.value)
                      : setEditSectionId(e.target.value)
                  }
                  style={{ padding: 12, borderRadius: 12, width: "100%" }}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}
              >
                <button
                  type="button"
                  onClick={handleCloseModal}
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
                  onClick={
                    isAddModalOpen ? handleSaveNewTeacher : handleSaveEdit
                  }
                  className={commonStyles.primaryButton}
                  style={{ padding: "10px 16px" }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdviserManager;
