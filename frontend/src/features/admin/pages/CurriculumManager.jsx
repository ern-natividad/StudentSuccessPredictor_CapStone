import { useEffect, useState } from "react";
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
  const [editingId, setEditingId] = useState(null);
  const [courses, setCourses] = useState([]);

  // Modal State for custom prompt (Add AY / Add Program)
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "", // 'academicYear' or 'program'
    title: "",
    placeholder: "",
    inputValue: "",
  });

  // State for Curriculum Deletion Modal
  const [curriculumToDelete, setCurriculumToDelete] = useState(null);
  const [curriculumToView, setCurriculumToView] = useState(null);

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
    const val = e.target.value;
    if (val === "ADD_NEW_PROGRAM") {
      setModalConfig({
        isOpen: true,
        type: "program",
        title: "Add Program",
        placeholder: "e.g., Software Engineering",
        inputValue: "",
      });
    } else {
      setProgram(val);
    }
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
    } else if (modalConfig.type === "program") {
      if (!programOptions.includes(val)) {
        setProgramOptions((prev) => [...prev, val]);
      }
      setProgram(val);
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
      if (editingId) {
        const c = curricula.find((x) => x.id === editingId);
        if (!c) return;

        const versionEntry = {
          versionedAt: new Date().toISOString(),
          title: c.title,
          academicYear: c.academicYear,
          courses: c.courses,
          department: c.department,
          program: c.program,
          attachments: c.attachments || [],
          status: c.status,
        };

        await updateCurriculum(editingId, {
          title: title.trim(),
          academicYear,
          courses,
          department,
          program,
          attachments: [...(c.attachments || []), ...attachments],
          status,
          versions: [versionEntry, ...(c.versions || [])],
        });
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
      }

      await loadCurricula();
      resetForm();
    } catch (err) {
      console.error("Failed to save curriculum:", err);
      toast.error(err.message || "Failed to save curriculum.");
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

  const applyIconHover = (event, colors) => {
    event.currentTarget.style.backgroundColor = colors.background;
    event.currentTarget.style.borderColor = colors.border;
  };

  const resetIconHover = (event) => {
    event.currentTarget.style.backgroundColor = "#ffffff";
    event.currentTarget.style.borderColor = "#e2e8f0";
  };

  const renderCourseActionButtons = (onEdit, onDelete, labelPrefix) => (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <button
        type="button"
        style={{ ...iconButtonStyle, color: "#334155" }}
        onClick={onEdit}
        title="Edit Course"
        aria-label={`Edit ${labelPrefix}`}
        onMouseOver={(event) =>
          applyIconHover(event, { background: "#f1f5f9", border: "#cbd5e1" })
        }
        onMouseOut={resetIconHover}
      >
        <i className="fas fa-pen-to-square" aria-hidden="true" />
      </button>
      <button
        type="button"
        style={{ ...iconButtonStyle, color: "#ef4444" }}
        onClick={onDelete}
        title="Delete Course"
        aria-label={`Delete ${labelPrefix}`}
        onMouseOver={(event) =>
          applyIconHover(event, { background: "#fef2f2", border: "#fecaca" })
        }
        onMouseOut={resetIconHover}
      >
        <i className="fas fa-trash-can" aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <ModuleShell
      title="Curriculum Manager"
      description="Post and manage curricula for programs. Instructors and advisers can view posted curricula."
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
              gap: "8px",
            }}
          >
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

            {/* Dropdown with Add Option for Program */}
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
                <option value="ADD_NEW_PROGRAM" style={{ fontWeight: "bold", color: "#800000" }}>
                  + Add New Program...
                </option>
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
                    <option>1Y</option>
                    <option>2Y</option>
                    <option>3Y</option>
                    <option>4Y</option>
                    <option>Summer</option>
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

            {/* Added Courses Table */}
            {courses.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: "#334155" }}>
                  Courses Added ({courses.length})
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.moduleTable}>
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Title</th>
                        <th>Year</th>
                        <th>Sem</th>
                        <th>Units</th>
                        <th>Type</th>
                        <th style={{ textAlign: "center", width: "108px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className={styles.tableStriped}>
                      {courses.map((course, idx) => (
                        <tr key={idx}>
                          <td>{course.code}</td>
                          <td>{course.title}</td>
                          <td>{course.yearLevel}</td>
                          <td>{course.semester}</td>
                          <td>{course.units}</td>
                          <td>{course.type}</td>
                          <td style={{ textAlign: "center" }}>
                            {renderCourseActionButtons(
                              () => handleEditCourse(idx),
                              () => handleDeleteCourse(idx),
                              `${course.code} ${course.title}`,
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
              onChange={(e) => handleAttach(e.target.files)}
            />
            {attachments.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {attachments.map((a, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <div style={{ flex: 1 }}>{a.name}</div>
                      <div>
                        <button
                          className={styles.secondaryButton}
                          onClick={() => downloadAttachment(a)}
                        >
                          Download
                        </button>
                      </div>
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
          <button className={styles.primaryButton} onClick={handleAddOrUpdate}>
            {editingId ? "Save Changes" : "Post Curriculum"}
          </button>
          <button className={styles.secondaryButton} onClick={resetForm}>
            Cancel
          </button>
        </div>
      </div>

      {/* Published Curricula List */}
      <div className={styles.moduleCard}>
        <div className={styles.moduleTitleSmall}>Published Curricula</div>
        {loading ? (
          <div className={styles.placeholderChart}>Loading curricula…</div>
        ) : curricula.length === 0 ? (
          <div className={styles.placeholderChart}>
            No curricula published yet.
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
                {curricula.map((c) => (
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
                            color: "#2563eb",
                          }}
                          onClick={() => setCurriculumToView(c)}
                          title="View Curriculum"
                          aria-label={`View ${c.title}`}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "#eff6ff";
                            e.currentTarget.style.borderColor = "#bfdbfe";
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

      {/* CUSTOM MODAL for Add Academic Year / Add Program */}
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

      {/* VIEW CURRICULUM MODAL */}
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
              width: "min(920px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px 32px",
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
                marginBottom: "20px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "1.45rem",
                    fontWeight: "700",
                    color: "#800000",
                  }}
                >
                  {curriculumToView.title}
                </h2>
                <div style={{ color: "#64748b", fontSize: "0.95rem" }}>
                  {curriculumToView.academicYear} · {curriculumToView.department} ·{" "}
                  {curriculumToView.program}
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

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "10px" }}>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Status</div>
                <div style={{ fontWeight: 600, marginTop: 4 }}>{curriculumToView.status}</div>
              </div>
              <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "10px" }}>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Courses</div>
                <div style={{ fontWeight: 600, marginTop: 4 }}>
                  {(curriculumToView.courses || []).length}
                </div>
              </div>
              <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "10px" }}>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Approved By</div>
                <div style={{ fontWeight: 600, marginTop: 4 }}>
                  {curriculumToView.approvedByName || "Not yet approved"}
                </div>
              </div>
            </div>

            <div style={{ fontWeight: 600, marginBottom: 10, color: "#334155" }}>
              Courses ({curriculumToView.courses?.length || 0})
            </div>
            {(curriculumToView.courses || []).length > 0 ? (
              <div className={styles.tableWrapper}>
                <table className={styles.moduleTable}>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Title</th>
                      <th>Year</th>
                      <th>Sem</th>
                      <th>Units</th>
                      <th>Type</th>
                      <th>Prerequisites</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tableStriped}>
                    {curriculumToView.courses.map((course, idx) => (
                      <tr key={idx}>
                        <td>{course.code}</td>
                        <td>{course.title}</td>
                        <td>{course.yearLevel}</td>
                        <td>{course.semester}</td>
                        <td>{course.units}</td>
                        <td>{course.type}</td>
                        <td>{course.prerequisites || "None"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.placeholderChart}>No courses added yet.</div>
            )}

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