import { useEffect, useMemo, useState } from "react";
import ModuleShell from "../../../components/Common/ModuleShell";
import { useToast } from "../../../components/Common/Toast";
import { useAuth } from "../../../hooks/useAuth";
import {
  getAllCurricula,
  createCurriculum,
  updateCurriculum,
  deleteCurriculum,
  approveCurriculum,
} from "../../../services/curriculumService";
import styles from "../../../styles/Modules.module.css";
import CurriculumAppraisalSheet from "../components/CurriculumAppraisalSheet";

const moduleLinks = [
  {
    key: "pre-enrollment",
    label: "Degree Recommendation",
    path: "/modules/pre-enrollment",
  },
  {
    key: "academic-performance",
    label: "Performance Forecasting",
    path: "/modules/academic-performance",
  },
  { key: "ai-advising", label: "AI Advising", path: "/modules/ai-advising" },
];

const INITIAL_PROGRAM_OPTIONS = [
  "Civil Engineering",
  "Electrical Engineering",
  "Industrial Engineering",
  "Computer Engineering",
  "Mechanical Engineering",
];

const INITIAL_ACADEMIC_YEARS = [
  "2024-2025",
  "2025-2026",
  "2026-2027",
  "2027-2028",
];

const readFilesAsDataUrl = (files) => {
  const readers = Array.from(files).map((file) => {
    return new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () =>
        resolve({ name: file.name, type: file.type, data: r.result });
      r.readAsDataURL(file);
    });
  });
  return Promise.all(readers);
};

const CurriculumManager = () => {
  const toast = useToast();
  const { user } = useAuth();

  // Dynamic state for dropdown options
  const [academicYearOptions, setAcademicYearOptions] = useState(INITIAL_ACADEMIC_YEARS);
  const [programOptions, setProgramOptions] = useState(INITIAL_PROGRAM_OPTIONS);

  // Form field states
  const [title, setTitle] = useState("");
  const [academicYear, setAcademicYear] = useState(INITIAL_ACADEMIC_YEARS[1]);
  const [department, setDepartment] = useState("Engineering");
  const [program, setProgram] = useState(INITIAL_PROGRAM_OPTIONS[0]);
  const [status, setStatus] = useState("Draft");
  const [attachments, setAttachments] = useState([]);
  const [curricula, setCurricula] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [courses, setCourses] = useState([]);
  const [publishSearch, setPublishSearch] = useState("");
  const [publishProgramFilter, setPublishProgramFilter] = useState("All");

  // Modal State for custom prompt (Add AY)
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "", // 'academicYear'
    title: "",
    placeholder: "",
    inputValue: "",
  });

  // State for Curriculum Deletion Modal
  const [curriculumToDelete, setCurriculumToDelete] = useState(null);
  const [curriculumToView, setCurriculumToView] = useState(null);
  const [isManageProgramsOpen, setIsManageProgramsOpen] = useState(false);
  const [newProgramName, setNewProgramName] = useState("");

  // Course form state
  const [courseForm, setCourseForm] = useState({
    code: "",
    title: "",
    yearLevel: "1Y",
    semester: "1S",
    units: 3,
    lec: 2,
    lab: 1,
    type: "Professional",
    prerequisites: "None",
    description: "",
  });
  const [editingCourseIdx, setEditingCourseIdx] = useState(null);

  const loadCurricula = async () => {
    try {
      setLoading(true);
      const data = await getAllCurricula();
      setCurricula(data);

      if (Array.isArray(data)) {
        const fetchedAYs = data.map((c) => c.academicYear).filter(Boolean);
        const fetchedPrograms = data.map((c) => c.program).filter(Boolean);

        setAcademicYearOptions((prev) =>
          Array.from(new Set([...prev, ...fetchedAYs]))
        );
        setProgramOptions((prev) =>
          Array.from(new Set([...prev, ...fetchedPrograms]))
        );
      }
    } catch (err) {
      console.error("Failed to load curricula:", err);
      toast.error(err.message || "Failed to load curricula.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurricula();
  }, []);

  const publishProgramOptions = useMemo(() => {
    const fromList = curricula.map((c) => c.program).filter(Boolean);
    return ["All", ...Array.from(new Set([...programOptions, ...fromList]))];
  }, [curricula, programOptions]);

  const filteredPublishedCurricula = useMemo(() => {
    const query = publishSearch.trim().toLowerCase();

    return curricula.filter((c) => {
      const matchesProgram =
        publishProgramFilter === "All" || c.program === publishProgramFilter;

      if (!matchesProgram) return false;
      if (!query) return true;

      return (
        String(c.title || "").toLowerCase().includes(query) ||
        String(c.academicYear || "").toLowerCase().includes(query) ||
        String(c.department || "").toLowerCase().includes(query) ||
        String(c.program || "").toLowerCase().includes(query) ||
        String(c.status || "").toLowerCase().includes(query)
      );
    });
  }, [curricula, publishSearch, publishProgramFilter]);

  // Dropdown Selection Handlers
  const handleAcademicYearChange = (e) => {
    const val = e.target.value;
    if (val === "ADD_NEW_AY") {
      setModalConfig({
        isOpen: true,
        type: "academicYear",
        title: "Add Academic Year",
        placeholder: "e.g., 2028-2029",
        inputValue: "",
      });
    } else {
      setAcademicYear(val);
    }
  };

  const handleProgramChange = (e) => {
    setProgram(e.target.value);
  };

  const handleAddProgram = (e) => {
    e.preventDefault();
    const val = newProgramName.trim();

    if (!val) {
      toast.error("Program name cannot be empty.");
      return;
    }

    if (programOptions.includes(val)) {
      toast.error(`"${val}" is already in the program list.`);
      return;
    }

    setProgramOptions((prev) => [...prev, val]);
    setProgram(val);
    setNewProgramName("");
    toast.success(`Program "${val}" added.`);
  };

  const handleDeleteProgram = (programName) => {
    if (!programOptions.includes(programName)) {
      toast.error("That program is not in the list.");
      return;
    }

    if (programOptions.length <= 1) {
      toast.error("At least one program must remain available.");
      return;
    }

    const inUseCount = curricula.filter((c) => c.program === programName).length;
    if (inUseCount > 0) {
      toast.error(
        `Cannot delete "${programName}" because ${inUseCount} curriculum record${
          inUseCount === 1 ? " is" : "s are"
        } still assigned to it.`,
      );
      return;
    }

    const remaining = programOptions.filter((p) => p !== programName);
    setProgramOptions(remaining);

    if (program === programName) {
      setProgram(remaining[0] || INITIAL_PROGRAM_OPTIONS[0]);
    }
    if (publishProgramFilter === programName) {
      setPublishProgramFilter("All");
    }

    toast.success(`Program "${programName}" deleted.`);
  };

  const closeManagePrograms = () => {
    setIsManageProgramsOpen(false);
    setNewProgramName("");
  };

  // Modal Submit Handler
  const handleModalSubmit = (e) => {
    e.preventDefault();
    const val = modalConfig.inputValue.trim();

    if (!val) {
      toast.error("Value cannot be empty.");
      return;
    }

    if (modalConfig.type === "academicYear") {
      if (!academicYearOptions.includes(val)) {
        setAcademicYearOptions((prev) => [...prev, val]);
      }
      setAcademicYear(val);
    }

    closeModal();
  };

  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false, inputValue: "" }));
  };

  const resetForm = () => {
    setTitle("");
    setAcademicYear(academicYearOptions[0] || "2025-2026");
    setCourses([]);
    setDepartment("Engineering");
    setProgram(programOptions[0] || INITIAL_PROGRAM_OPTIONS[0]);
    setStatus("Draft");
    setAttachments([]);
    setEditingId(null);
    resetCourseForm();
  };

  const resetCourseForm = () => {
    setCourseForm({
      code: "",
      title: "",
      yearLevel: "1Y",
      semester: "1S",
      units: 3,
      lec: 2,
      lab: 1,
      type: "Professional",
      prerequisites: "None",
      description: "",
    });
    setEditingCourseIdx(null);
  };

  const handleAddOrUpdateCourse = () => {
    if (!courseForm.code.trim() || !courseForm.title.trim()) {
      toast.error("Course code and title are required");
      return;
    }
    if (editingCourseIdx !== null) {
      const updated = [...courses];
      updated[editingCourseIdx] = courseForm;
      setCourses(updated);
      resetCourseForm();
    } else {
      setCourses([...courses, courseForm]);
      resetCourseForm();
    }
  };

  const handleEditCourse = (idx) => {
    setCourseForm(courses[idx]);
    setEditingCourseIdx(idx);
  };

  const handleDeleteCourse = (idx) => {
    setCourses(courses.filter((_, i) => i !== idx));
  };

  const handleAttach = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const data = await readFilesAsDataUrl(fileList);
    setAttachments((prev) => [...prev, ...data]);
  };

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const buildVersionSnapshot = (curriculum) => ({
    versionedAt: new Date().toISOString(),
    title: curriculum.title,
    academicYear: curriculum.academicYear,
    courses: curriculum.courses,
    department: curriculum.department,
    program: curriculum.program,
    attachments: (curriculum.attachments || []).map(({ name, type }) => ({
      name,
      type,
    })),
    status: curriculum.status,
  });

  const previewAttachment = (att) => {
    if (!att || !att.type) return null;
    if (att.type.startsWith("image/")) {
      return (
        <img
          src={att.data}
          alt={att.name}
          style={{
            maxWidth: 320,
            maxHeight: 240,
            display: "block",
            marginTop: 8,
          }}
        />
      );
    }
    if (att.type === "application/pdf") {
      return (
        <iframe
          src={att.data}
          title={att.name}
          style={{ width: "100%", height: 400, marginTop: 8 }}
        />
      );
    }
    return (
      <div style={{ marginTop: 8, fontStyle: "italic" }}>
        Preview not available for {att.name}
      </div>
    );
  };

  const handleAddOrUpdate = async () => {
    if (!title.trim()) {
      toast.error("Curriculum title is required");
      return;
    }

    try {
      setIsSaving(true);

      if (editingId) {
        const c = curricula.find((x) => x.id === editingId);
        if (!c) {
          toast.error("Curriculum record not found.");
          return;
        }

        await updateCurriculum(editingId, {
          title: title.trim(),
          academicYear,
          courses,
          department,
          program,
          attachments,
          status,
          versions: [buildVersionSnapshot(c), ...(c.versions || [])],
        });
        toast.success("Curriculum updated successfully.");
      } else {
        await createCurriculum({
          title: title.trim(),
          academicYear,
          courses,
          department,
          program,
          attachments,
          status,
        });
        toast.success("Curriculum posted successfully.");
      }

      await loadCurricula();
      resetForm();
    } catch (err) {
      console.error("Failed to save curriculum:", err);
      toast.error(err.message || "Failed to save curriculum.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (id) => {
    const c = curricula.find((x) => x.id === id);
    if (!c) return;

    if (c.academicYear && !academicYearOptions.includes(c.academicYear)) {
      setAcademicYearOptions((prev) => [...prev, c.academicYear]);
    }
    if (c.program && !programOptions.includes(c.program)) {
      setProgramOptions((prev) => [...prev, c.program]);
    }

    setEditingId(c.id);
    setTitle(c.title || "");
    setAcademicYear(c.academicYear || academicYearOptions[0]);
    setCourses(c.courses || []);
    setDepartment(c.department || "Engineering");
    setProgram(c.program || programOptions[0]);
    setAttachments(c.attachments || []);
    setStatus(c.status || "Draft");
    resetCourseForm();
  };

  // Open curriculum delete confirmation modal
  const handlePromptDelete = (c) => {
    setCurriculumToDelete(c);
  };

  // Confirmed curriculum deletion
  const handleConfirmDelete = async () => {
    if (!curriculumToDelete) return;
    try {
      await deleteCurriculum(curriculumToDelete.id);
      await loadCurricula();
    } catch (err) {
      console.error("Failed to delete curriculum:", err);
      toast.error(err.message || "Failed to delete curriculum.");
    } finally {
      setCurriculumToDelete(null);
    }
  };

  const handleApprove = async (id) => {
    if (!user?.id) {
      toast.error("Unable to determine the current admin's account.");
      return;
    }
    try {
      await approveCurriculum(id, user.id);
      await loadCurricula();
    } catch (err) {
      console.error("Failed to approve curriculum:", err);
      toast.error(err.message || "Failed to approve curriculum.");
    }
  };

  const downloadAttachment = (att) => {
    const a = document.createElement("a");
    a.href = att.data;
    a.download = att.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const iconButtonStyle = {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontSize: "0.95rem",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
  };

  return (
    <ModuleShell
      title="Curriculum Manager"
      description="Create and publish curricula in Student Appraisal Sheet format (First Year to Fourth Year)."
      activeKey="curriculum-manager"
      menuItems={moduleLinks}
    >
      <div className={styles.moduleCard}>
        <div className={styles.moduleTitleSmall} style={{ marginBottom: "16px" }}>
          {editingId ? "Edit Curriculum" : "Create Curriculum"}
        </div>

        {/* Section 1: Curriculum General Information */}
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              fontSize: "0.95rem",
              fontWeight: "600",
              color: "#475569",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#800000",
                  display: "inline-block",
                }}
              />
              General Information
            </div>
            <button
              type="button"
              onClick={() => setIsManageProgramsOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "#ffffff",
                color: "#800000",
                border: "1px solid #800000",
                borderRadius: "8px",
                padding: "6px 12px",
                fontWeight: "600",
                fontSize: "0.8rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "background-color 0.15s ease, color 0.15s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#800000";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#ffffff";
                e.currentTarget.style.color = "#800000";
              }}
            >
              <i className="fas fa-list-check" aria-hidden="true" />
              Manage Program
            </button>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Curriculum Title</label>
              <input
                className={styles.formInput}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., BSCE Curriculum 2026"
              />
            </div>

            {/* Dropdown with Add Option for Academic Year */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>Academic Year</label>
              <select
                className={styles.formSelect}
                value={academicYear}
                onChange={handleAcademicYearChange}
              >
                {academicYearOptions.map((ay) => (
                  <option key={ay} value={ay}>
                    {ay}
                  </option>
                ))}
                <option value="ADD_NEW_AY" style={{ fontWeight: "bold", color: "#800000" }}>
                  + Add New Academic Year...
                </option>
              </select>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Department</label>
              <input
                className={styles.formInput}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Program</label>
              <select
                className={styles.formSelect}
                value={program}
                onChange={handleProgramChange}
              >
                {programOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <hr
          style={{
            border: "none",
            borderTop: "1px dashed #cbd5e1",
            margin: "24px 0",
          }}
        />

        {/* Section 2: Add Courses Section */}
        <div style={{ marginBottom: "20px" }}>
          <div className={styles.formField} style={{ gridColumn: "1 / -1" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <div>
                <label className={styles.formLabel} style={{ fontSize: "1rem", fontWeight: "700", color: "#1e293b" }}>
                  Add Course to Curriculum
                </label>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.825rem", color: "#64748b" }}>
                  Define individual subjects and courses to include under this curriculum structure.
                </p>
              </div>
            </div>

            <div
              style={{
                border: "1px solid #e2e8f0",
                padding: "20px",
                borderRadius: "8px",
                backgroundColor: "#f8fafc",
                boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.03)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div className={styles.formField}>
                  <label
                    className={styles.formLabel}
                    style={{ fontSize: "0.85em" }}
                  >
                    Code
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g., CE 101"
                    value={courseForm.code}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, code: e.target.value })
                    }
                  />
                </div>
                <div className={styles.formField}>
                  <label
                    className={styles.formLabel}
                    style={{ fontSize: "0.85em" }}
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Course name"
                    value={courseForm.title}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, title: e.target.value })
                    }
                  />
                </div>
                <div className={styles.formField}>
                  <label
                    className={styles.formLabel}
                    style={{ fontSize: "0.85em" }}
                  >
                    Year Level
                  </label>
                  <select
                    className={styles.formSelect}
                    value={courseForm.yearLevel}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        yearLevel: e.target.value,
                      })
                    }
                  >
                    <option value="1Y">1st Year</option>
                    <option value="2Y">2nd Year</option>
                    <option value="3Y">3rd Year</option>
                    <option value="4Y">4th Year</option>
                  </select>
                </div>
                <div className={styles.formField}>
                  <label
                    className={styles.formLabel}
                    style={{ fontSize: "0.85em" }}
                  >
                    Semester
                  </label>
                  <select
                    className={styles.formSelect}
                    value={courseForm.semester}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, semester: e.target.value })
                    }
                  >
                    <option value="1S">1st Sem</option>
                    <option value="2S">2nd Sem</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div className={styles.formField}>
                  <label
                    className={styles.formLabel}
                    style={{ fontSize: "0.85em" }}
                  >
                    Units
                  </label>
                  <input
                    type="number"
                    className={styles.formInput}
                    placeholder="3"
                    value={courseForm.units}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        units: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className={styles.formField}>
                  <label
                    className={styles.formLabel}
                    style={{ fontSize: "0.85em" }}
                  >
                    Lec
                  </label>
                  <input
                    type="number"
                    className={styles.formInput}
                    placeholder="2"
                    value={courseForm.lec}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        lec: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className={styles.formField}>
                  <label
                    className={styles.formLabel}
                    style={{ fontSize: "0.85em" }}
                  >
                    Lab
                  </label>
                  <input
                    type="number"
                    className={styles.formInput}
                    placeholder="1"
                    value={courseForm.lab}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        lab: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className={styles.formField}>
                  <label
                    className={styles.formLabel}
                    style={{ fontSize: "0.85em" }}
                  >
                    Type
                  </label>
                  <select
                    className={styles.formSelect}
                    value={courseForm.type}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, type: e.target.value })
                    }
                  >
                    <option>Professional</option>
                    <option>General Education</option>
                    <option>Mandated</option>
                    <option>Institutional</option>
                    <option>Professional Elective</option>
                  </select>
                </div>
                <div className={styles.formField}>
                  <label
                    className={styles.formLabel}
                    style={{ fontSize: "0.85em" }}
                  >
                    Prerequisites
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="None"
                    value={courseForm.prerequisites}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        prerequisites: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className={styles.formField} style={{ marginBottom: 16 }}>
                <label
                  className={styles.formLabel}
                  style={{ fontSize: "0.85em" }}
                >
                  Description
                </label>
                <textarea
                  className={styles.formInput}
                  placeholder="Course overview (optional)"
                  rows={2}
                  value={courseForm.description}
                  onChange={(e) =>
                    setCourseForm({
                      ...courseForm,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleAddOrUpdateCourse}
                >
                  {editingCourseIdx !== null ? "Update Course" : "Add Course"}
                </button>
                {editingCourseIdx !== null && (
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={resetCourseForm}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Appraisal Sheet Preview — First Year through Fourth Year */}
            {courses.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: 8,
                    color: "#334155",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <span>
                    Curriculum Appraisal Format ({courses.length} courses)
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>
                    Grouped dynamically from First Year to Fourth Year
                  </span>
                </div>
                <CurriculumAppraisalSheet
                  courses={courses}
                  title={title}
                  program={program}
                  academicYear={academicYear}
                  department={department}
                  includeEmpty
                  showGradeColumn
                  showAdvisingHistory
                  editable
                  onEditCourse={handleEditCourse}
                  onDeleteCourse={handleDeleteCourse}
                  compact
                />
              </div>
            )}
          </div>
        </div>

        <hr
          style={{
            border: "none",
            borderTop: "1px dashed #cbd5e1",
            margin: "24px 0",
          }}
        />

        {/* Section 3: Final Publication & Attachments */}
        <div className={styles.formGrid} style={{ marginTop: "16px" }}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Status</label>
            <select
              className={styles.formSelect}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option>Draft</option>
              <option>Pending Approval</option>
              <option>Published</option>
            </select>
          </div>

          <div className={styles.formField} style={{ gridColumn: "1 / -1" }}>
            <label className={styles.formLabel}>Attachments</label>
            <input
              type="file"
              multiple
              onChange={(e) => {
                handleAttach(e.target.files);
                e.target.value = "";
              }}
            />
            {attachments.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {attachments.map((a, i) => (
                  <div key={`${a.name}-${i}`} style={{ marginBottom: 12 }}>
                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <div style={{ flex: 1 }}>{a.name}</div>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => handleRemoveAttachment(i)}
                        style={{ color: "#ef4444", borderColor: "#fecaca" }}
                        title="Remove attachment"
                        aria-label={`Remove ${a.name}`}
                      >
                        <i className="fas fa-trash-can" aria-hidden="true" />
                      </button>
                    </div>
                    <div>{previewAttachment(a)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Submission Action Buttons */}
        <div className={styles.buttonGroup} style={{ marginTop: "24px" }}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleAddOrUpdate}
            disabled={isSaving}
          >
            {isSaving
              ? "Saving..."
              : editingId
                ? "Save Changes"
                : "Post Curriculum"}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={resetForm}
            disabled={isSaving}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Published Curricula List */}
      <div className={styles.moduleCard}>
        <div className={styles.moduleTitleSmall}>Published Curricula</div>

        <div className={styles.performanceToolbar}>
          <div className={styles.performanceFilters}>
            <input
              type="search"
              className={styles.formInput}
              placeholder="Search curriculum by title, year, department, or program"
              value={publishSearch}
              onChange={(event) => setPublishSearch(event.target.value)}
              aria-label="Search published curricula"
            />
            <select
              className={styles.formSelect}
              value={publishProgramFilter}
              onChange={(event) => setPublishProgramFilter(event.target.value)}
              aria-label="Filter curricula by program"
            >
              {publishProgramOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "All" ? "All Programs" : option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className={styles.placeholderChart}>Loading curricula…</div>
        ) : curricula.length === 0 ? (
          <div className={styles.placeholderChart}>
            No curricula published yet.
          </div>
        ) : filteredPublishedCurricula.length === 0 ? (
          <div className={styles.placeholderChart}>
            No curricula match your search or program filter.
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.moduleTable}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Acad. Year</th>
                  <th>Department</th>
                  <th>Program</th>
                  <th>Status</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody className={styles.tableStriped}>
                {filteredPublishedCurricula.map((c) => (
                  <tr key={c.id}>
                    <td>{c.title}</td>
                    <td>{c.academicYear}</td>
                    <td>{c.department}</td>
                    <td>{c.program}</td>
                    <td>
                      {c.status}
                      {c.approvedByName ? ` — Approved by ${c.approvedByName}` : ""}
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        {/* View Button Icon */}
                        <button
                          type="button"
                          style={{
                            ...iconButtonStyle,
                            color: "#334155",
                          }}
                          onClick={() => setCurriculumToView(c)}
                          title="View Curriculum"
                          aria-label={`View ${c.title}`}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "#f1f5f9";
                            e.currentTarget.style.borderColor = "#cbd5e1";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = "#ffffff";
                            e.currentTarget.style.borderColor = "#e2e8f0";
                          }}
                        >
                          <i className="fas fa-eye" aria-hidden="true" />
                        </button>

                        {/* Edit Button Icon */}
                        <button
                          type="button"
                          style={{
                            ...iconButtonStyle,
                            color: "#334155",
                          }}
                          onClick={() => handleEdit(c.id)}
                          title="Edit Curriculum"
                          aria-label={`Edit ${c.title}`}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "#f1f5f9";
                            e.currentTarget.style.borderColor = "#cbd5e1";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = "#ffffff";
                            e.currentTarget.style.borderColor = "#e2e8f0";
                          }}
                        >
                          <i className="fas fa-pen-to-square" aria-hidden="true" />
                        </button>

                        {/* Approve Button Icon */}
                        {c.status !== "Published" && (
                          <button
                            type="button"
                            style={{
                              ...iconButtonStyle,
                              color: "#16a34a",
                            }}
                            onClick={() => handleApprove(c.id)}
                            title="Approve Curriculum"
                            aria-label={`Approve ${c.title}`}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = "#f0fdf4";
                              e.currentTarget.style.borderColor = "#bbf7d0";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = "#ffffff";
                              e.currentTarget.style.borderColor = "#e2e8f0";
                            }}
                          >
                            <i className="fas fa-circle-check" aria-hidden="true" />
                          </button>
                        )}

                        {/* Delete Button Icon */}
                        <button
                          type="button"
                          style={{
                            ...iconButtonStyle,
                            color: "#ef4444",
                          }}
                          onClick={() => handlePromptDelete(c)}
                          title="Delete Curriculum"
                          aria-label={`Delete ${c.title}`}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "#fef2f2";
                            e.currentTarget.style.borderColor = "#fecaca";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = "#ffffff";
                            e.currentTarget.style.borderColor = "#e2e8f0";
                          }}
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

      {/* CUSTOM MODAL for Add Academic Year */}
      {modalConfig.isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(3px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "28px 32px",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                margin: "0 0 16px 0",
                color: "#800000",
                fontSize: "1.4rem",
                fontWeight: "700",
              }}
            >
              {modalConfig.title}
            </h2>
            <form onSubmit={handleModalSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <input
                  type="text"
                  autoFocus
                  className={styles.formInput}
                  placeholder={modalConfig.placeholder}
                  value={modalConfig.inputValue}
                  onChange={(e) =>
                    setModalConfig((prev) => ({
                      ...prev,
                      inputValue: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.95rem",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    backgroundColor: "#800000",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 16px",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#600000")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#800000")}
                >
                  Save Option
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    flex: 1,
                    backgroundColor: "#cbd5e1",
                    color: "#334155",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 16px",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#b8c5d6")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#cbd5e1")}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE PROGRAMS MODAL */}
      {isManageProgramsOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 9999,
          }}
          onClick={closeManagePrograms}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              width: "min(520px, 100%)",
              padding: "28px 32px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.25)",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                margin: "0 0 8px 0",
                fontSize: "1.35rem",
                fontWeight: "700",
                color: "#800000",
              }}
            >
              Manage Programs
            </h2>
            <p
              style={{
                margin: "0 0 20px 0",
                color: "#64748b",
                fontSize: "0.9rem",
                lineHeight: 1.45,
              }}
            >
              Add or remove programs available in the curriculum form. Programs with
              existing curriculum records cannot be deleted.
            </p>

            <form
              onSubmit={handleAddProgram}
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              <input
                type="text"
                className={styles.formInput}
                placeholder="e.g., Software Engineering"
                value={newProgramName}
                onChange={(e) => setNewProgramName(e.target.value)}
                style={{ flex: 1 }}
                aria-label="New program name"
              />
              <button
                type="submit"
                style={{
                  backgroundColor: "#800000",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  fontWeight: "600",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Add Program
              </button>
            </form>

            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                overflow: "hidden",
                marginBottom: "20px",
              }}
            >
              {programOptions.length === 0 ? (
                <div
                  style={{
                    padding: "16px",
                    color: "#64748b",
                    fontSize: "0.9rem",
                    textAlign: "center",
                  }}
                >
                  No programs available.
                </div>
              ) : (
                programOptions.map((p, index) => (
                  <div
                    key={p}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      padding: "12px 14px",
                      borderTop: index === 0 ? "none" : "1px solid #f1f5f9",
                      backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8fafc",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.925rem",
                        fontWeight: "600",
                        color: "#0f172a",
                      }}
                    >
                      {p}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteProgram(p)}
                      title={`Delete ${p}`}
                      aria-label={`Delete ${p}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "34px",
                        height: "34px",
                        borderRadius: "8px",
                        border: "1px solid #fecaca",
                        backgroundColor: "#ffffff",
                        color: "#ef4444",
                        cursor: "pointer",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = "#fef2f2";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = "#ffffff";
                      }}
                    >
                      <i className="fas fa-trash-can" aria-hidden="true" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={closeManagePrograms}
              style={{
                width: "100%",
                padding: "10px 16px",
                borderRadius: "8px",
                border: "none",
                background: "#cbd5e1",
                color: "#1e293b",
                fontWeight: "600",
                fontSize: "0.95rem",
                cursor: "pointer",
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#b8c5d6")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#cbd5e1")}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* VIEW CURRICULUM MODAL — Student Appraisal Sheet format */}
      {curriculumToView && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 9999,
          }}
          onClick={() => setCurriculumToView(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "min(1100px, 100%)",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "24px 28px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "1.35rem",
                    fontWeight: "700",
                    color: "#800000",
                  }}
                >
                  {curriculumToView.title}
                </h2>
                <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
                  Published appraisal format · {curriculumToView.status}
                  {curriculumToView.approvedByName
                    ? ` · Approved by ${curriculumToView.approvedByName}`
                    : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCurriculumToView(null)}
                style={{
                  ...iconButtonStyle,
                  color: "#64748b",
                }}
                title="Close"
                aria-label="Close curriculum view"
              >
                <i className="fas fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <CurriculumAppraisalSheet
              courses={curriculumToView.courses || []}
              title={curriculumToView.title}
              program={curriculumToView.program}
              academicYear={curriculumToView.academicYear}
              department={curriculumToView.department}
              includeEmpty
              showGradeColumn
              showAdvisingHistory
            />

            {curriculumToView.attachments?.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, color: "#334155" }}>
                  Attachments
                </div>
                {curriculumToView.attachments.map((attachment, index) => (
                  <div key={index} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div style={{ flex: 1 }}>{attachment.name}</div>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => downloadAttachment(attachment)}
                      >
                        Download
                      </button>
                    </div>
                    <div>{previewAttachment(attachment)}</div>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "24px",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setCurriculumToView(null)}
              >
                Close
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => {
                  handleEdit(curriculumToView.id);
                  setCurriculumToView(null);
                }}
              >
                Edit Curriculum
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CURRICULUM CONFIRMATION MODAL */}
      {curriculumToDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 9999,
          }}
          onClick={() => setCurriculumToDelete(null)}
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
                color: "#800000",
              }}
            >
              Confirm Curriculum Deletion
            </h2>

            <p
              style={{
                margin: "0 0 24px 0",
                color: "#475569",
                fontSize: "1.05rem",
                lineHeight: "1.5",
              }}
            >
              Are you sure you want to permanently delete the curriculum for{" "}
              <strong>{curriculumToDelete.title}</strong>? This action cannot be undone.
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
                onClick={handleConfirmDelete}
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
                Yes, Delete Curriculum
              </button>

              <button
                type="button"
                onClick={() => setCurriculumToDelete(null)}
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
      )}
    </ModuleShell>
  );
};

export default CurriculumManager;