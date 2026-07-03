import { useEffect, useState } from "react";
import ModuleShell from "../../../components/Common/ModuleShell";
import styles from "../../../styles/Modules.module.css";
import BSIT_CURRICULUM from "../../../utils/curriculumData";

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
  {
    key: "what-if-simulator",
    label: "What-If Simulator",
    path: "/modules/what-if-simulator",
  },
  { key: "ai-advising", label: "AI Advising", path: "/modules/ai-advising" },
];

const STORAGE_KEY = "CURRICULA";

const PROGRAM_OPTIONS = [
  "Civil Engineering",
  "Electrical Engineering",
  "Industrial Engineering",
  "Computer Engineering",
  "Mechanical Engineering",
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
  const [title, setTitle] = useState("");
  const [academicYear, setAcademicYear] = useState("2025-2026");
  const [programs, setPrograms] = useState([]);
  const [status, setStatus] = useState("Draft");
  const [attachments, setAttachments] = useState([]);
  const [curricula, setCurricula] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [courses, setCourses] = useState([]);

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

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      setCurricula(JSON.parse(raw));
    } else {
      // Pre-populate with sample BSIT curriculum on first load
      const initial = [BSIT_CURRICULUM];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      setCurricula(initial);
    }
  }, []);

  const save = (next) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setCurricula(next);
  };

  const resetForm = () => {
    setTitle("");
    setAcademicYear("2025-2026");
    setCourses([]);
    setPrograms([]);
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
      alert("Course code and title are required");
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

  const handleAddOrUpdate = () => {
    if (!title.trim()) return;

    if (editingId) {
      // update with versioning
      const next = curricula.map((c) => {
        if (c.id !== editingId) return c;
        const versionEntry = {
          versionedAt: new Date().toISOString(),
          title: c.title,
          academicYear: c.academicYear,
          courses: c.courses,
          programs: c.programs,
          attachments: c.attachments || [],
          status: c.status,
        };
        const updated = {
          ...c,
          title: title.trim(),
          academicYear,
          courses,
          programs,
          attachments: [...(c.attachments || []), ...attachments],
          status,
          updatedAt: new Date().toISOString(),
          versions: [versionEntry, ...(c.versions || [])],
        };
        return updated;
      });
      save(next);
      resetForm();
      return;
    }

    const entry = {
      id: `CURR-${Date.now()}`,
      title: title.trim(),
      academicYear,
      courses,
      programs,
      attachments,
      status,
      createdAt: new Date().toISOString(),
      versions: [],
    };
    const next = [entry, ...curricula];
    save(next);
    resetForm();
  };

  const handleEdit = (id) => {
    const c = curricula.find((x) => x.id === id);
    if (!c) return;
    setEditingId(c.id);
    setTitle(c.title || "");
    setAcademicYear(c.academicYear || "2025-2026");
    setCourses(c.courses || []);
    setPrograms(c.programs || []);
    setAttachments(c.attachments || []);
    setStatus(c.status || "Draft");
    resetCourseForm();
  };

  const handleDelete = (id) => {
    const next = curricula.filter((c) => c.id !== id);
    save(next);
  };

  const handleApprove = (id, approver = "admin") => {
    const next = curricula.map((c) =>
      c.id === id
        ? {
            ...c,
            status: "Published",
            approvedBy: approver,
            approvedAt: new Date().toISOString(),
          }
        : c,
    );
    save(next);
  };

  const toggleProgram = (prog) => {
    setPrograms((prev) =>
      prev.includes(prog) ? prev.filter((p) => p !== prog) : [...prev, prog],
    );
  };

  const downloadAttachment = (att) => {
    const a = document.createElement("a");
    a.href = att.data;
    a.download = att.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <ModuleShell
      title="Curriculum Manager"
      description="Post and manage curricula for programs. Instructors and advisers can view posted curricula."
      activeKey="curriculum-manager"
      menuItems={moduleLinks}
    >
      <div className={styles.moduleCard}>
        <div className={styles.moduleTitleSmall}>
          {editingId ? "Edit Curriculum" : "Create Curriculum"}
        </div>
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Curriculum Title</label>
            <input
              className={styles.formInput}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Academic Year</label>
            <select
              className={styles.formSelect}
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
            >
              <option>2025-2026</option>
              <option>2026-2027</option>
              <option>2027-2028</option>
            </select>
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Visibility (Programs)</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {PROGRAM_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={
                    programs.includes(p)
                      ? styles.primaryButton
                      : styles.secondaryButton
                  }
                  onClick={() => toggleProgram(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.formField} style={{ gridColumn: "1 / -1" }}>
            <label className={styles.formLabel}>Add Courses</label>
            <div
              style={{
                border: "1px solid #ddd",
                padding: 12,
                borderRadius: 4,
                backgroundColor: "#fafafa",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  gap: 8,
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
                  gap: 8,
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
              <div className={styles.formField} style={{ marginBottom: 12 }}>
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
            {courses.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
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
                        <th>Actions</th>
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
                          <td>
                            <button
                              className={styles.secondaryButton}
                              onClick={() => handleEditCourse(idx)}
                            >
                              Edit
                            </button>
                            <button
                              className={styles.secondaryButton}
                              onClick={() => handleDeleteCourse(idx)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

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
        <div className={styles.buttonGroup}>
          <button className={styles.primaryButton} onClick={handleAddOrUpdate}>
            {editingId ? "Save Changes" : "Post Curriculum"}
          </button>
          <button className={styles.secondaryButton} onClick={resetForm}>
            Cancel
          </button>
        </div>
      </div>

      <div className={styles.moduleCard}>
        <div className={styles.moduleTitleSmall}>Published Curricula</div>
        {curricula.length === 0 ? (
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
                  <th>Programs</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className={styles.tableStriped}>
                {curricula.map((c) => (
                  <tr key={c.id}>
                    <td>{c.title}</td>
                    <td>{c.academicYear}</td>
                    <td>{(c.programs || []).join(", ")}</td>
                    <td>
                      {c.status}
                      {c.approvedBy ? ` — Approved by ${c.approvedBy}` : ""}
                    </td>
                    <td>
                      <button
                        className={styles.secondaryButton}
                        onClick={() => handleEdit(c.id)}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.secondaryButton}
                        onClick={() => handleDelete(c.id)}
                      >
                        Delete
                      </button>
                      {c.status !== "Published" && (
                        <button
                          className={styles.primaryButton}
                          onClick={() => handleApprove(c.id)}
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ModuleShell>
  );
};

export default CurriculumManager;
