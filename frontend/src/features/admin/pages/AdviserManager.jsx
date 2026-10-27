import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "../../../hooks/useDashboard";
import { useListPagination } from "../../../hooks/useListPagination";
import { useToast } from "../../../components/Common/Toast";
import ListPagination from "../../../components/Common/ListPagination";
import { usePrograms } from "../../../hooks/usePrograms";
import { api } from "../../../services/api";
import { AUTH_ROLES } from "../../../utils/constants";
import {
  ALL_PROGRAMS_OPTION,
  areAllSectionsSelected,
  filterStudentsForAdviser,
  getStaffSectionLabel,
  getStaffSectionsLabel,
  getStudentSectionValue,
  parseAssignedSections,
} from "../../../utils/adviserAssignmentUtils";
import {
  buildSchoolYearOptions,
  getCurrentAcademicYear,
} from "../../../utils/gradeSemesterUtils";
import styles from "../../../styles/Dashboard.module.css";
import commonStyles from "../../../styles/Common.module.css";

const STORAGE_KEY_REMOVED_ROWS = "adviser_overview_removed_ids";
const YEAR_LEVEL_OPTIONS = AUTH_ROLES.student.groupOptions;
const DEFAULT_SECTION_OPTIONS = ["A", "B", "C"];

const countStudentsForAdviser = (
  studentList,
  adviserSections,
  adviserYearLevel,
  adviserProgram,
  adviserSchoolYear,
) =>
  filterStudentsForAdviser(
    studentList,
    adviserSections,
    adviserYearLevel,
    adviserProgram,
    adviserSchoolYear,
  ).length;

const AdviserManager = () => {
  const toast = useToast();
  const {
    sections,
    staffMembers,
    students,
    getSectionById,
    refreshStudentDirectory,
    directoryLoading,
    directoryError,
  } = useDashboard();

  const { programNames } = usePrograms();
  const programOptions = useMemo(
    () => [ALL_PROGRAMS_OPTION, ...programNames],
    [programNames],
  );

  const [selectedEditRowId, setSelectedEditRowId] = useState(null);
  const [viewSectionId, setViewSectionId] = useState(null);
  const [editSchoolYear, setEditSchoolYear] = useState("");
  const [sectionInput, setSectionInput] = useState("");
  const [adviserSearch, setAdviserSearch] = useState("");
  const [yearAssignedFilter, setYearAssignedFilter] = useState("");
  const [editStaffId, setEditStaffId] = useState(staffMembers[0]?.id || "");
  const [editSectionIds, setEditSectionIds] = useState([]);
  const [editYearAssigned, setEditYearAssigned] = useState(YEAR_LEVEL_OPTIONS[0]);
  const [editProgram, setEditProgram] = useState(ALL_PROGRAMS_OPTION);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTeacherStaffId, setNewTeacherStaffId] = useState("");
  const [newTeacherSectionIds, setNewTeacherSectionIds] = useState([]);
  const [newTeacherSchoolYear, setNewTeacherSchoolYear] = useState(
    getCurrentAcademicYear(),
  );
  const [newTeacherYearAssigned, setNewTeacherYearAssigned] = useState(
    YEAR_LEVEL_OPTIONS[0],
  );
  const [newTeacherProgram, setNewTeacherProgram] = useState(ALL_PROGRAMS_OPTION);
  const [isSaving, setIsSaving] = useState(false);
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

  const sectionOptions = useMemo(
    () => [
      ...new Set([
        ...DEFAULT_SECTION_OPTIONS,
        ...sections.map((section) => section.id),
      ]),
    ],
    [sections],
  );

  const toggleSectionSelection = (sectionId, selectedSections, setSelectedSections) => {
    if (selectedSections.includes(sectionId)) {
      setSelectedSections(selectedSections.filter((section) => section !== sectionId));
      return;
    }

    setSelectedSections([...selectedSections, sectionId]);
  };

  const toggleAllSections = (selectedSections, setSelectedSections) => {
    if (areAllSectionsSelected(selectedSections, sectionOptions)) {
      setSelectedSections([]);
      return;
    }

    setSelectedSections(parseAssignedSections(sectionOptions));
  };

  const addTypedSections = (selectedSections, setSelectedSections) => {
    const typedSections = sectionInput
      .split(/[,;]+/)
      .map((section) => section.trim().replace(/\s+/g, " "))
      .filter(Boolean);

    if (typedSections.length === 0) return;

    const selectedByNormalizedValue = new Map(
      selectedSections.map((section) => [section.toLowerCase(), section]),
    );
    typedSections.forEach((section) => {
      if (!["unassigned", "n/a", "na", "none", "-", "--"].includes(section.toLowerCase())) {
        selectedByNormalizedValue.set(section.toLowerCase(), section);
      }
    });

    setSelectedSections([...selectedByNormalizedValue.values()]);
    setSectionInput("");
  };

  const sectionOverviewRows = useMemo(() => {
    const rows = staffMembers.flatMap((staff) => {
      const activeAssignments = (staff.adviserAssignments || []).filter(
        (assignment) => assignment.is_active !== false,
      );
      const groups = new Map();

      activeAssignments.forEach((assignment) => {
        const key = JSON.stringify([
          assignment.school_year,
          assignment.program,
          assignment.year_level,
        ]);
        const group = groups.get(key) || {
          schoolYear: assignment.school_year,
          program: assignment.program,
          yearAssigned: assignment.year_level,
          sections: [],
        };
        group.sections.push(assignment.section);
        groups.set(key, group);
      });

      if (groups.size === 0 && staff.adviser_info) {
        groups.set("legacy", {
          schoolYear: "",
          program: staff.adviser_info.program || ALL_PROGRAMS_OPTION,
          yearAssigned: staff.adviser_info.year_level || "N/A",
          sections: parseAssignedSections(staff.adviser_info.assigned_section),
          isLegacy: true,
        });
      }

      if (groups.size === 0) {
        groups.set("unassigned", {
          schoolYear: "",
          program: ALL_PROGRAMS_OPTION,
          yearAssigned: "N/A",
          sections: [],
          isLegacy: true,
        });
      }

      return [...groups.entries()].map(([key, group]) => {
        const assignedSections = parseAssignedSections(group.sections);
        const assignmentGroup = group.isLegacy
          ? null
          : {
              adviser_user_id: staff.id,
              school_year: group.schoolYear,
              program: group.program,
              year_level: group.yearAssigned,
            };
        return {
          id: `${staff.id}:${key}`,
          name: staff.full_name,
          section: getStaffSectionsLabel(
            assignedSections,
            getSectionById,
            sectionOptions,
          ),
          schoolYear: group.schoolYear || "Needs confirmation",
          yearAssigned: group.yearAssigned,
          program: group.program || ALL_PROGRAMS_OPTION,
          role: staff.title?.toLowerCase().includes("adviser")
            ? "Adviser"
            : staff.title || "Subject Teacher",
          students: countStudentsForAdviser(
            students,
            assignedSections,
            group.yearAssigned,
            group.program,
            group.schoolYear,
          ),
          adviserId: staff.id,
          assignedSections,
          assignedProgram: group.program || ALL_PROGRAMS_OPTION,
          assignmentGroup,
        };
      });
    });

    return rows.filter((row) => !removedRowIds.includes(row.id));
  }, [
    staffMembers,
    students,
    getSectionById,
    removedRowIds,
    sectionOptions,
  ]);

  const yearAssignedOptions = useMemo(
    () =>
      [...new Set(sectionOverviewRows.map((row) => row.yearAssigned))]
        .filter(Boolean)
        .sort((left, right) => {
          const leftIndex = YEAR_LEVEL_OPTIONS.indexOf(left);
          const rightIndex = YEAR_LEVEL_OPTIONS.indexOf(right);
          if (leftIndex >= 0 && rightIndex >= 0) return leftIndex - rightIndex;
          if (leftIndex >= 0) return -1;
          if (rightIndex >= 0) return 1;
          return left.localeCompare(right);
        }),
    [sectionOverviewRows],
  );

  const filteredOverviewRows = useMemo(() => {
    const searchTerm = adviserSearch.trim().toLowerCase();

    return sectionOverviewRows.filter((row) => {
      const matchesYear =
        !yearAssignedFilter || row.yearAssigned === yearAssignedFilter;
      const matchesSearch =
        !searchTerm ||
        [row.name, row.section, row.schoolYear, row.program, row.yearAssigned, row.role]
          .some((value) => String(value || "").toLowerCase().includes(searchTerm));

      return matchesYear && matchesSearch;
    });
  }, [adviserSearch, sectionOverviewRows, yearAssignedFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageItems: paginatedOverviewRows,
    totalItems: adviserTotalItems,
    totalPages: adviserTotalPages,
    pageSize: adviserPageSize,
  } = useListPagination(filteredOverviewRows, {
    pageSize: 10,
    resetKey: `${removedRowIds.length}|${staffMembers.length}|${adviserSearch}|${yearAssignedFilter}`,
  });

  const viewSectionStudents = useMemo(() => {
    if (!viewSectionId) return [];

    const row = sectionOverviewRows.find((item) => item.id === viewSectionId);
    if (!row?.assignmentGroup) return [];

    return filterStudentsForAdviser(
      students,
      row.assignedSections,
      row.assignmentGroup.year_level,
      row.assignmentGroup.program,
      row.assignmentGroup.school_year,
    );
  }, [students, viewSectionId, sectionOverviewRows]);

  const handleOpenEdit = (row) => {
    setSectionInput("");
    setSelectedEditRowId(row.id);
    setEditStaffId(row.adviserId || staffMembers[0]?.id || "");
    setEditSectionIds(row.assignedSections);
    const assignedYear = YEAR_LEVEL_OPTIONS.includes(row.yearAssigned)
      ? row.yearAssigned
      : YEAR_LEVEL_OPTIONS[Number.parseInt(row.yearAssigned, 10) - 1];
    setEditYearAssigned(assignedYear || YEAR_LEVEL_OPTIONS[0]);
    setEditProgram(row.assignedProgram || ALL_PROGRAMS_OPTION);
    setEditSchoolYear(row.assignmentGroup?.school_year || "");
  };

  const handleOpenAddModal = () => {
    setSectionInput("");
    setNewTeacherStaffId(staffMembers[0]?.id || "");
    setNewTeacherSectionIds([]);
    setNewTeacherYearAssigned(YEAR_LEVEL_OPTIONS[0]);
    setNewTeacherProgram(ALL_PROGRAMS_OPTION);
    setNewTeacherSchoolYear(getCurrentAcademicYear());
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
    if (
      !selectedEditRowId ||
      !editStaffId ||
      editSectionIds.length === 0 ||
      !/^\d{4}-(\d{4})$/.test(editSchoolYear) ||
      Number(editSchoolYear.slice(5)) !== Number(editSchoolYear.slice(0, 4)) + 1
    ) {
      toast.error("Choose a school year and at least one section.");
      return;
    }

    try {
      setIsSaving(true);
      const previousRow = sectionOverviewRows.find(
        (row) => row.id === selectedEditRowId,
      );
      await api.saveAdviserAssignmentGroup({
        adviser_user_id: editStaffId,
        school_year: editSchoolYear,
        program: editProgram,
        year_level: editYearAssigned,
        sections: editSectionIds,
        previous_group: previousRow?.assignmentGroup || null,
      });

      setRemovedRowIds((prev) =>
        prev.filter((id) => id !== selectedEditRowId),
      );
      setSelectedEditRowId(null);
      refreshStudentDirectory();
      toast.success("Adviser assignment saved.");
    } catch (error) {
      toast.error(error.message || "Unable to save adviser assignment.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNewTeacher = async () => {
    if (
      !newTeacherStaffId ||
      newTeacherSectionIds.length === 0 ||
      !/^\d{4}-(\d{4})$/.test(newTeacherSchoolYear) ||
      Number(newTeacherSchoolYear.slice(5)) !==
        Number(newTeacherSchoolYear.slice(0, 4)) + 1
    ) {
      toast.error("Choose a school year and at least one section.");
      return;
    }

    try {
      setIsSaving(true);

      await api.saveAdviserAssignmentGroup({
        adviser_user_id: newTeacherStaffId,
        school_year: newTeacherSchoolYear,
        program: newTeacherProgram,
        year_level: newTeacherYearAssigned,
        sections: newTeacherSectionIds,
      });

      setRemovedRowIds((prev) => prev.filter((id) => id !== newTeacherStaffId));
      refreshStudentDirectory();
      setIsAddModalOpen(false);
      toast.success("Adviser assignment saved.");
    } catch (error) {
      toast.error(error.message || "Unable to save adviser assignment.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.pageShell}>
      <div className={styles.pageHeaderCard}>
        <div>
          <h1 className={styles.pageTitle}>Manage Adviser</h1>
          <p className={styles.pageSubtitle}>
            Assign staff across school years, programs, year levels, and as many
            sections as needed.
          </p>
        </div>
      </div>

      {directoryError && <div className={styles.card}>{directoryError}</div>}

      <div className={styles.card}>
        <div className={styles.adviserOverviewHeader}>
          <div className={styles.cardTitle}>Section Overview</div>
          <div className={styles.adviserOverviewActions}>
            <div className={styles.adviserOverviewFilters}>
              <input
                type="search"
                className={styles.listToolbarSearch}
                value={adviserSearch}
                placeholder="Search adviser, section, program, or role..."
                onChange={(event) => setAdviserSearch(event.target.value)}
                aria-label="Search advisers by name, section, program, or role"
              />
              <select
                className={styles.listToolbarSelect}
                value={yearAssignedFilter}
                onChange={(event) => setYearAssignedFilter(event.target.value)}
                aria-label="Filter advisers by year assigned"
              >
                <option value="">All assigned years</option>
                {yearAssignedOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className={styles.adviserOverviewAddButton}
              onClick={handleOpenAddModal}
            >
              <i className="fas fa-plus" aria-hidden="true" /> Add Assignment
            </button>
          </div>
        </div>
        <div className={commonStyles.tableWrapper} style={{ marginTop: 12, overflowX: "auto" }}>
          <table
            className={commonStyles.table}
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead className={commonStyles.tableHead}>
              <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", width: "18%" }}>Name</th>
                <th style={{ padding: "12px 16px", textAlign: "center", width: "12%" }}>Section</th>
                <th style={{ padding: "12px 16px", textAlign: "center", width: "14%" }}>School Year</th>
                <th style={{ padding: "12px 16px", textAlign: "center", width: "14%" }}>Program</th>
                <th style={{ padding: "12px 16px", textAlign: "center", width: "12%" }}>Year Assigned</th>
                <th style={{ padding: "12px 16px", textAlign: "left", width: "12%" }}>Role</th>
                <th style={{ padding: "12px 16px", textAlign: "center", width: "8%" }}>Students</th>
                <th style={{ padding: "12px 16px", textAlign: "center", width: "18%" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {directoryLoading && (
                <tr>
                  <td colSpan={8} style={{ padding: 20, textAlign: "center" }}>
                    Loading staff…
                  </td>
                </tr>
              )}
              {paginatedOverviewRows.map((row) => (
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
                    {row.schoolYear}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    {row.program || ALL_PROGRAMS_OPTION}
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
                        onClick={() => setViewSectionId(row.id)}
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
              {!directoryLoading && filteredOverviewRows.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 20, textAlign: "center", color: "#64748b" }}>
                    {sectionOverviewRows.length === 0
                      ? "No adviser records displayed."
                      : "No advisers match the selected search and year filter."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <ListPagination
          currentPage={currentPage}
          totalPages={adviserTotalPages}
          totalItems={adviserTotalItems}
          pageSize={adviserPageSize}
          onPageChange={setCurrentPage}
          itemLabel="advisers"
        />
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
                    <th style={{ padding: "12px 16px", textAlign: "left", width: "18%" }}>Student ID</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", width: "30%" }}>Name</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", width: "16%" }}>Section</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", width: "16%" }}>Year Level</th>
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
                    </tr>
                  ))}
                  {viewSectionStudents.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: 20, textAlign: "center", color: "#64748b" }}>
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
                    {isAddModalOpen ? "Add Adviser Assignment" : "Edit Adviser Assignment"}
                  </h2>
                  <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.85rem" }}>
                    {isAddModalOpen
                      ? "Add another school-year, program, year-level, and section scope for a staff member."
                      : "Update this assignment scope without affecting the staff member's other assignments."}
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
                  School Year
                </label>
                <select
                  value={isAddModalOpen ? newTeacherSchoolYear : editSchoolYear}
                  onChange={(e) =>
                    isAddModalOpen
                      ? setNewTeacherSchoolYear(e.target.value)
                      : setEditSchoolYear(e.target.value)
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
                  <option value="">Select a school year</option>
                  {[...new Set([
                    ...buildSchoolYearOptions(),
                    isAddModalOpen ? newTeacherSchoolYear : editSchoolYear,
                  ])]
                    .filter(Boolean)
                    .map((schoolYear) => (
                      <option key={schoolYear} value={schoolYear}>
                        {schoolYear}
                      </option>
                    ))}
                </select>
              </div>
              <div style={{ display: "grid", gap: "6px" }}>
                <label style={{ fontSize: "0.825rem", color: "#334155", fontWeight: "600" }}>
                  Assigned Sections
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                    gap: "10px",
                    padding: "12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    backgroundColor: "#f8fafc",
                  }}
                >
                  {(() => {
                    const selectedSections = isAddModalOpen
                      ? newTeacherSectionIds
                      : editSectionIds;
                    const setSelectedSections = isAddModalOpen
                      ? setNewTeacherSectionIds
                      : setEditSectionIds;
                    const allSelected = areAllSectionsSelected(
                      selectedSections,
                      sectionOptions,
                    );
                    const customSections = selectedSections.filter(
                      (section) =>
                        !sectionOptions.some(
                          (option) =>
                            option.toLowerCase() === section.toLowerCase(),
                        ),
                    );

                    return (
                      <>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "0.9rem",
                            color: "#0f172a",
                            cursor: "pointer",
                            fontWeight: "700",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={() =>
                              toggleAllSections(selectedSections, setSelectedSections)
                            }
                          />
                          All
                        </label>
                        {sectionOptions.map((sectionId) => {
                          const isChecked = selectedSections.includes(sectionId);

                          return (
                            <label
                              key={sectionId}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "0.9rem",
                                color: "#0f172a",
                                cursor: "pointer",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() =>
                                  toggleSectionSelection(
                                    sectionId,
                                    selectedSections,
                                    setSelectedSections,
                                  )
                                }
                              />
                              Section {getStaffSectionLabel(sectionId, getSectionById)}
                            </label>
                          );
                        })}
                        {customSections.map((sectionId) => (
                          <label
                            key={sectionId}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              fontSize: "0.9rem",
                              color: "#0f172a",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked
                              onChange={() =>
                                toggleSectionSelection(
                                  sectionId,
                                  selectedSections,
                                  setSelectedSections,
                                )
                              }
                            />
                            Section {sectionId}
                          </label>
                        ))}
                      </>
                    );
                  })()}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={sectionInput}
                    maxLength={60}
                    placeholder="Type a section name (e.g. 2D)"
                    aria-label="Type a section name"
                    onChange={(event) => setSectionInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        const selectedSections = isAddModalOpen
                          ? newTeacherSectionIds
                          : editSectionIds;
                        const setSelectedSections = isAddModalOpen
                          ? setNewTeacherSectionIds
                          : setEditSectionIds;
                        addTypedSections(selectedSections, setSelectedSections);
                      }
                    }}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem",
                      color: "#0f172a",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const selectedSections = isAddModalOpen
                        ? newTeacherSectionIds
                        : editSectionIds;
                      const setSelectedSections = isAddModalOpen
                        ? setNewTeacherSectionIds
                        : setEditSectionIds;
                      addTypedSections(selectedSections, setSelectedSections);
                    }}
                    disabled={!sectionInput.trim()}
                    style={{
                      padding: "0.65rem 1rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#334155",
                      fontWeight: "600",
                      cursor: sectionInput.trim() ? "pointer" : "not-allowed",
                    }}
                  >
                    Add
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                  Select listed sections or type custom section names. Separate multiple names with commas.
                </p>
              </div>

              <div style={{ display: "grid", gap: "6px" }}>
                <label style={{ fontSize: "0.825rem", color: "#334155", fontWeight: "600" }}>
                  Program
                </label>
                <select
                  value={isAddModalOpen ? newTeacherProgram : editProgram}
                  onChange={(e) =>
                    isAddModalOpen
                      ? setNewTeacherProgram(e.target.value)
                      : setEditProgram(e.target.value)
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
                  {programOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                  Choose which engineering program this staff member covers.
                </p>
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
                      ? "Add Assignment"
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