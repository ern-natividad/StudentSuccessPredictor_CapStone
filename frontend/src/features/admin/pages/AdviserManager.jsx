import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "../../../hooks/useDashboard";
import { useToast } from "../../../components/Common/Toast";
import { upsertAdviserInfo } from "../../../services/adviserInfoService";
import { AUTH_ROLES } from "../../../utils/constants";
import {
  filterStudentsForAdviser,
  getStaffSectionLabel,
  getStudentSectionValue,
} from "../../../utils/adviserAssignmentUtils";
import styles from "../../../styles/Dashboard.module.css";
import commonStyles from "../../../styles/Common.module.css";

const STORAGE_KEY_REMOVED_ROWS = "adviser_overview_removed_ids";
const YEAR_LEVEL_OPTIONS = AUTH_ROLES.student.groupOptions;

const countStudentsForAdviser = (
  studentList,
  adviserSection,
  adviserYearLevel,
) =>
  filterStudentsForAdviser(studentList, adviserSection, adviserYearLevel).length;

const AdviserManager = () => {
  const toast = useToast();
  const {
    sections,
    staffMembers,
    students,
    getStaffById,
    getSectionById,
    updateSectionAdviser,
    updateStaffRole,
    updateAdviserInfoRecord,
    directoryLoading,
    directoryError,
  } = useDashboard();

  const [selectedEditRowId, setSelectedEditRowId] = useState(null);
  const [viewSectionId, setViewSectionId] = useState(null);
  const [editStaffId, setEditStaffId] = useState(staffMembers[0]?.id || "");
  const [editSectionId, setEditSectionId] = useState(sections[0]?.id || "A");
  const [editYearAssigned, setEditYearAssigned] = useState(YEAR_LEVEL_OPTIONS[0]);
  const [editRole, setEditRole] = useState("Adviser");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTeacherStaffId, setNewTeacherStaffId] = useState("");
  const [newTeacherRole, setNewTeacherRole] = useState("Adviser");
  const [newTeacherSectionId, setNewTeacherSectionId] = useState("A");
  const [newTeacherYearAssigned, setNewTeacherYearAssigned] = useState(
    YEAR_LEVEL_OPTIONS[0],
  );
  const [isSaving, setIsSaving] = useState(false);
  const [staffSectionAssignments, setStaffSectionAssignments] = useState({});

  // Confirmation modal state for row removal
  const [rowToDelete, setRowToDelete] = useState(null);

  // Initialize removed row IDs from localStorage for persistence across reloads
  const [removedRowIds, setRemovedRowIds] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REMOVED_ROWS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sync removed row IDs to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REMOVED_ROWS, JSON.stringify(removedRowIds));
    } catch (e) {
      console.error("Failed to save removed rows to storage:", e);
    }
  }, [removedRowIds]);

  const selectedRow = useMemo(
    () => sections.find((section) => section.id === selectedEditRowId) || null,
    [sections, selectedEditRowId]
  );

  const selectedStaff = useMemo(
    () => getStaffById(selectedRow?.adviserId),
    [getStaffById, selectedRow]
  );

  useEffect(() => {
    if (selectedRow) {
      setEditSectionId(selectedRow.id);
      setEditStaffId(selectedRow.adviserId || staffMembers[0]?.id || "");
      setEditRole(
        selectedStaff?.title?.toLowerCase().includes("adviser")
          ? "Adviser"
          : "Subject Teacher"
      );
    }
  }, [selectedRow, selectedStaff, staffMembers]);

  const sectionOverviewRows = useMemo(() => {
    let rows = [];
    if (sections.length === 0) {
      rows = staffMembers.map((staff) => {
        const assignedSec =
          staffSectionAssignments[staff.id] || staff.assignedSection || null;

        return {
          id: staff.id,
          name: staff.full_name,
          section: getStaffSectionLabel(assignedSec, getSectionById),
          yearAssigned: staff.assignedYearLevel || "N/A",
          role: staff.title || "Academic Adviser",
          students: countStudentsForAdviser(
            students,
            assignedSec,
            staff.assignedYearLevel,
          ),
          adviserId: staff.id,
        };
      });
    } else {
      rows = sections.map((section) => {
        const adviser = getStaffById(section.adviserId);
        const adviserSection =
          (adviser &&
            (staffSectionAssignments[adviser.id] || adviser.assignedSection)) ||
          section.id;

        return {
          id: section.id,
          name: adviser?.full_name || "Unassigned",
          section: section.name,
          yearAssigned: adviser?.assignedYearLevel || "N/A",
          role: adviser?.title?.toLowerCase().includes("adviser")
            ? "Adviser"
            : "Subject Teacher",
          students: countStudentsForAdviser(
            students,
            adviserSection,
            adviser?.assignedYearLevel,
          ),
          adviserId: section.adviserId,
        };
      });

      // Include staff who have custom assignments outside default section lists
      staffMembers.forEach((staff) => {
        const customSec = staffSectionAssignments[staff.id];
        if (
          customSec &&
          !sections.some((sec) => sec.adviserId === staff.id || sec.id === customSec)
        ) {
          rows.push({
            id: staff.id,
            name: staff.full_name,
            section: getStaffSectionLabel(customSec, getSectionById),
            yearAssigned: staff.assignedYearLevel || "N/A",
            role: staff.title || "Academic Adviser",
            students: countStudentsForAdviser(
              students,
              customSec,
              staff.assignedYearLevel,
            ),
            adviserId: staff.id,
          });
        }
      });
    }

    // Filter out rows saved as removed in localStorage
    return rows.filter((row) => !removedRowIds.includes(row.id));
  }, [
    sections,
    staffMembers,
    students,
    getStaffById,
    getSectionById,
    staffSectionAssignments,
    removedRowIds,
  ]);

  const viewSectionStudents = useMemo(() => {
    if (!viewSectionId) return [];

    const adviser = staffMembers.find((staff) => staff.id === viewSectionId);
    if (!adviser) return [];

    const adviserSection =
      staffSectionAssignments[adviser.id] || adviser.assignedSection;

    return filterStudentsForAdviser(
      students,
      adviserSection,
      adviser.assignedYearLevel,
    );
  }, [students, viewSectionId, staffMembers, staffSectionAssignments]);

  const handleOpenEdit = (row) => {
    const staff = staffMembers.find((member) => member.id === row.adviserId);
    const assignedSection =
      staffSectionAssignments[row.adviserId] ||
      staff?.assignedSection ||
      (row.section === "Unassigned" ? "" : row.section);

    setSelectedEditRowId(row.id);
    setEditStaffId(row.adviserId || staffMembers[0]?.id || "");
    setEditSectionId(assignedSection || "A");
    setEditYearAssigned(
      staff?.assignedYearLevel && staff.assignedYearLevel !== "N/A"
        ? staff.assignedYearLevel
        : YEAR_LEVEL_OPTIONS[0],
    );
    setEditRole(row.role);
  };

  const handleOpenAddModal = () => {
    setNewTeacherStaffId(staffMembers[0]?.id || "");
    setNewTeacherRole("Adviser");
    setNewTeacherSectionId("A");
    setNewTeacherYearAssigned(YEAR_LEVEL_OPTIONS[0]);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedEditRowId(null);
    setIsAddModalOpen(false);
  };

  // Trigger confirmation modal for row removal
  const handlePromptRemove = (row) => {
    setRowToDelete(row);
  };

  // Confirmed removal logic
  const handleConfirmRemove = () => {
    if (rowToDelete) {
      setRemovedRowIds((prev) => [...prev, rowToDelete.id]);
      setRowToDelete(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedEditRowId || !editStaffId) return;

    try {
      setIsSaving(true);

      if (updateStaffRole) {
        updateStaffRole(editStaffId, editRole);
      }

      const updatedInfo = await upsertAdviserInfo(editStaffId, {
        assigned_section: editSectionId,
        year_level: editYearAssigned,
      });

      updateAdviserInfoRecord(editStaffId, updatedInfo);

      setStaffSectionAssignments((currentAssignments) => ({
        ...currentAssignments,
        [editStaffId]: editSectionId,
      }));

      if (editSectionId && updateSectionAdviser) {
        updateSectionAdviser(editSectionId, editStaffId);
      }

      setRemovedRowIds((prev) =>
        prev.filter(
          (id) =>
            id !== selectedEditRowId &&
            id !== editSectionId &&
            id !== editStaffId,
        ),
      );

      setSelectedEditRowId(null);
      toast.success("Section assignment updated.");
    } catch (error) {
      toast.error(error.message || "Unable to save section assignment.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNewTeacher = async () => {
    if (!newTeacherStaffId || !newTeacherRole || !newTeacherSectionId) return;

    try {
      setIsSaving(true);

      if (updateStaffRole) {
        updateStaffRole(newTeacherStaffId, newTeacherRole);
      }

      const updatedInfo = await upsertAdviserInfo(newTeacherStaffId, {
        assigned_section: newTeacherSectionId,
        year_level: newTeacherYearAssigned,
      });

      updateAdviserInfoRecord(newTeacherStaffId, updatedInfo);

      setStaffSectionAssignments((currentAssignments) => ({
        ...currentAssignments,
        [newTeacherStaffId]: newTeacherSectionId,
      }));

      if (updateSectionAdviser) {
        updateSectionAdviser(newTeacherSectionId, newTeacherStaffId);
      }

      setRemovedRowIds((prev) =>
        prev.filter(
          (id) => id !== newTeacherStaffId && id !== newTeacherSectionId,
        ),
      );

      setIsAddModalOpen(false);
      toast.success("Teacher assignment saved.");
    } catch (error) {
      toast.error(error.message || "Unable to save teacher assignment.");
    } finally {
      setIsSaving(false);
    }
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
              background: "#8b0000",
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 2px 4px rgba(139, 0, 0, 0.15)",
              transition: "all 0.15s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#700000")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#8b0000")}
          >
            <i className="fas fa-plus" aria-hidden="true" /> Add Teacher
          </button>
        </div>
        <div className={commonStyles.tableWrapper} style={{ marginTop: 12, overflowX: "auto" }}>
          <table
            className={commonStyles.table}
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead className={commonStyles.tableHead}>
              <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", width: "25%" }}>Name</th>
                <th style={{ padding: "12px 16px", textAlign: "center", width: "15%" }}>Section</th>
                <th style={{ padding: "12px 16px", textAlign: "center", width: "15%" }}>Year Assigned</th>
                <th style={{ padding: "12px 16px", textAlign: "left", width: "20%" }}>Role</th>
                <th style={{ padding: "12px 16px", textAlign: "center", width: "10%" }}>Students</th>
                <th style={{ padding: "12px 16px", textAlign: "center", width: "15%" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {directoryLoading && (
                <tr>
                  <td colSpan={6} style={{ padding: 20, textAlign: "center" }}>
                    Loading staff…
                  </td>
                </tr>
              )}
              {sectionOverviewRows.map((row) => (
                <tr
                  key={row.id}
                  className={commonStyles.tableRow}
                  style={{ borderBottom: "1px solid #f1f5f9" }}
                >
                  <td style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600" }}>
                    {row.name}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    {row.section}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    {row.yearAssigned || "N/A"}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "left" }}>
                    {row.role}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                    {row.students}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <div
                      className={styles.tableActionGroup}
                      style={{ justifyContent: "center", display: "flex", gap: "8px" }}
                    >
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
                      <button
                        type="button"
                        onClick={() => handlePromptRemove(row)}
                        className={styles.tableActionButton}
                        aria-label={`Remove ${row.name} from overview table`}
                        title="Remove from table"
                        style={{ color: "#ef4444" }}
                      >
                        <i className="fas fa-trash-can" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!directoryLoading && sectionOverviewRows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 20, textAlign: "center", color: "#64748b" }}>
                    No adviser records displayed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete/Remove Confirmation Modal */}
      {rowToDelete ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1100,
          }}
          onClick={() => setRowToDelete(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              width: "min(480px, 100%)",
              padding: "28px 32px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                margin: "0 0 16px 0",
                fontSize: "1.35rem",
                fontWeight: "700",
                color: "#700000",
              }}
            >
              Confirm Account Removal
            </h2>

            <p
              style={{
                margin: "0 0 24px 0",
                color: "#475569",
                fontSize: "1.05rem",
                lineHeight: "1.5",
              }}
            >
              Are you sure you want to remove <strong>{rowToDelete.name}</strong> from the section overview display?
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                width: "100%",
              }}
            >
              <button
                type="button"
                onClick={handleConfirmRemove}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#800000",
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "background-color 0.15s ease",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#600000")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#800000")}
              >
                Yes, Remove Account
              </button>

              <button
                type="button"
                onClick={() => setRowToDelete(null)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#cccccc",
                  color: "#1e293b",
                  fontWeight: "600",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "background-color 0.15s ease",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#b8b8b8")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#cccccc")}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* View Assigned Students Modal */}
      {viewSectionId ? (
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
              padding: 28,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
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
                  color: "#64748b",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
            <div className={commonStyles.tableWrapper} style={{ marginTop: 20, overflowX: "auto" }}>
              <table
                className={commonStyles.table}
                style={{ width: "100%", borderCollapse: "collapse" }}
              >
                <thead className={commonStyles.tableHead}>
                  <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", width: "14%" }}>Student ID</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", width: "24%" }}>Name</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", width: "12%" }}>Section</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", width: "12%" }}>Year Level</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", width: "14%" }}>Subject Code</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", width: "14%" }}>Schedule</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", width: "10%" }}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {viewSectionStudents.map((student) => (
                    <tr
                      key={student.student_id}
                      className={commonStyles.tableRow}
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                    >
                      <td style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600" }}>
                        {student.student_id}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "left", fontWeight: "500" }}>
                        {student.full_name}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        {getStaffSectionLabel(
                          getStudentSectionValue(student),
                          getSectionById,
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        {student.yearLevel}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        {student.grade_records?.[0]?.subject || "N/A"}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        {student.grade_records?.[0]?.semester || "TBA"}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                        {student.grade_records?.[0]?.grade || "N/A"}
                      </td>
                    </tr>
                  ))}
                  {viewSectionStudents.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: 20, textAlign: "center", color: "#64748b" }}>
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

      {/* Edit Section Assignment & Add Teacher Modals */}
      {selectedEditRowId || isAddModalOpen ? (
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
          onClick={handleCloseModal}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "min(560px, 100%)",
              padding: "28px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e2e8f0",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
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
                  <i className={isAddModalOpen ? "fas fa-user-plus" : "fas fa-user-pen"} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#0f172a" }}>
                    {isAddModalOpen ? "Add Teacher" : "Edit Section Assignment"}
                  </h2>
                  <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.85rem" }}>
                    {isAddModalOpen
                      ? "Select a staff member from directory to assign role and section."
                      : "Modify role or section assigned to this staff member."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
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

            {/* Modal Body */}
            <div style={{ display: "grid", gap: "18px" }}>
              {isAddModalOpen ? (
                <div style={{ display: "grid", gap: "6px" }}>
                  <label style={{ fontSize: "0.825rem", color: "#334155", fontWeight: "600" }}>
                    Staff Account
                  </label>
                  <select
                    value={newTeacherStaffId}
                    onChange={(e) => setNewTeacherStaffId(e.target.value)}
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
                    <option value="">Select a staff account</option>
                    {staffMembers.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.full_name} ({staff.email})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "6px" }}>
                  <label style={{ fontSize: "0.825rem", color: "#334155", fontWeight: "600" }}>
                    Staff Member
                  </label>
                  <select
                    value={editStaffId}
                    onChange={(e) => setEditStaffId(e.target.value)}
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
                    {staffMembers.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: "grid", gap: "6px" }}>
                <label style={{ fontSize: "0.825rem", color: "#334155", fontWeight: "600" }}>
                  Role Assignment
                </label>
                <select
                  value={isAddModalOpen ? newTeacherRole : editRole}
                  onChange={(e) =>
                    isAddModalOpen
                      ? setNewTeacherRole(e.target.value)
                      : setEditRole(e.target.value)
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
                  <option value="Adviser">Adviser</option>
                  <option value="Subject Teacher">Subject Teacher</option>
                </select>
              </div>

              <div style={{ display: "grid", gap: "6px" }}>
                <label style={{ fontSize: "0.825rem", color: "#334155", fontWeight: "600" }}>
                  Assigned Section
                </label>
                <select
                  value={isAddModalOpen ? newTeacherSectionId : editSectionId}
                  onChange={(e) =>
                    isAddModalOpen
                      ? setNewTeacherSectionId(e.target.value)
                      : setEditSectionId(e.target.value)
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
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gap: "6px" }}>
                <label style={{ fontSize: "0.825rem", color: "#334155", fontWeight: "600" }}>
                  Year Assigned
                </label>
                <select
                  value={isAddModalOpen ? newTeacherYearAssigned : editYearAssigned}
                  onChange={(e) =>
                    isAddModalOpen
                      ? setNewTeacherYearAssigned(e.target.value)
                      : setEditYearAssigned(e.target.value)
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

              {/* Modal Actions */}
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
                  onClick={handleCloseModal}
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
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={
                    isAddModalOpen ? handleSaveNewTeacher : handleSaveEdit
                  }
                  disabled={isSaving}
                  style={{
                    padding: "0.55rem 1.25rem",
                    borderRadius: "8px",
                    border: "none",
                    background: "#8b0000",
                    color: "#ffffff",
                    fontWeight: "600",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(139, 0, 0, 0.15)",
                    transition: "all 0.15s ease",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#700000")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#8b0000")}
                >
                  {isSaving
                    ? "Saving..."
                    : isAddModalOpen
                      ? "Add Teacher"
                      : "Save Changes"}
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