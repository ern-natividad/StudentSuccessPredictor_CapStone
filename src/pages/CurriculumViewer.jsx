import { useEffect, useState } from "react";
import ModuleShell from "../components/Common/ModuleShell";
import styles from "../styles/Modules.module.css";

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

const CurriculumViewer = () => {
  const [curricula, setCurricula] = useState([]);
  const [filterProgram, setFilterProgram] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setCurricula(JSON.parse(raw));
  }, []);

  const published = curricula.filter((c) => c.status === "Published");
  const visible = filterProgram
    ? published.filter((c) => (c.programs || []).includes(filterProgram))
    : published;

  const coursesByYear = (courses) => {
    if (!courses) return {};
    const groups = {};
    courses.forEach((c) => {
      const key = c.semester || "Other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    });
    return groups;
  };

  const renderCourse = (course) => {
    if (typeof course === "string") {
      return <div>{course}</div>;
    }
    return (
      <div
        style={{
          marginBottom: 8,
          padding: 8,
          backgroundColor: "#fafafa",
          borderRadius: 4,
        }}
      >
        <div style={{ fontWeight: 600 }}>
          {course.code} — {course.title}
        </div>
        <div style={{ fontSize: "0.9em", color: "#555", marginTop: 4 }}>
          Units: {course.units} (Lec: {course.lec}, Lab: {course.lab}) | Type:{" "}
          {course.type}
        </div>
        {course.prerequisites && (
          <div style={{ fontSize: "0.9em", color: "#666", marginTop: 2 }}>
            Prerequisites: {course.prerequisites}
          </div>
        )}
        {course.description && (
          <div
            style={{
              fontSize: "0.85em",
              color: "#777",
              marginTop: 4,
              fontStyle: "italic",
            }}
          >
            {course.description}
          </div>
        )}
      </div>
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
        No preview available for {att.name}
      </div>
    );
  };

  // Version diff: compare a selected version to current
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(null);
  const currentForCompare = (c) => ({
    title: c.title,
    courses: c.courses || [],
  });
  const versionForCompare = (c, idx) => ({
    title: c.versions[idx].title,
    courses: c.versions[idx].courses || [],
  });

  const renderDiff = (curr, ver) => {
    if (!curr || !ver) return null;
    const added = curr.courses.filter((x) => !ver.courses.includes(x));
    const removed = ver.courses.filter((x) => !curr.courses.includes(x));
    return (
      <div
        style={{
          marginTop: 8,
          border: "1px solid #eee",
          padding: 8,
          borderRadius: 4,
        }}
      >
        <div style={{ fontWeight: 600 }}>Version Diff</div>
        {added.length === 0 && removed.length === 0 ? (
          <div style={{ marginTop: 6 }}>No changes in course list.</div>
        ) : (
          <div style={{ marginTop: 6 }}>
            {added.length > 0 && (
              <div style={{ color: "green" }}>
                <div style={{ fontWeight: 600 }}>Added</div>
                <ul>
                  {added.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
            {removed.length > 0 && (
              <div style={{ color: "crimson", marginTop: 6 }}>
                <div style={{ fontWeight: 600 }}>Removed</div>
                <ul>
                  {removed.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <ModuleShell
      title="Curriculum"
      description="View published curricula. Advisers and instructors can review program courses."
      activeKey="curriculum"
      menuItems={moduleLinks}
    >
      <div className={styles.moduleCard}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div className={styles.moduleTitleSmall}>Available Curricula</div>
          <div>
            <select
              className={styles.formSelect}
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
            >
              <option value="">All Programs</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Electrical Engineering">
                Electrical Engineering
              </option>
              <option value="Industrial Engineering">
                Industrial Engineering
              </option>
              <option value="Computer Engineering">Computer Engineering</option>
              <option value="Mechanical Engineering">
                Mechanical Engineering
              </option>
            </select>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className={styles.placeholderChart} style={{ marginTop: 16 }}>
            No curricula available.
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            {visible.map((c) => (
              <div
                key={c.id}
                className={styles.moduleCardSmall}
                style={{ marginBottom: 12 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div className={styles.moduleTitleSmall}>
                      {c.title} — {c.academicYear}
                    </div>
                    <div className={styles.moduleSubtitle}>
                      Program: {(c.programs || []).join(", ")} | Total Units:{" "}
                      {c.totalUnits || (c.courses ? c.courses.length : 0)}
                    </div>
                  </div>
                  <div style={{ minWidth: 220 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "flex-end",
                      }}
                    >
                      <select
                        className={styles.formSelect}
                        onChange={(e) =>
                          setSelectedVersionIndex(
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                          )
                        }
                      >
                        <option value="">Compare version...</option>
                        {(c.versions || []).map((v, idx) => (
                          <option key={idx} value={idx}>
                            {v.versionedAt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>
                    Courses by Semester
                  </div>
                  {Object.entries(coursesByYear(c.courses || [])).map(
                    ([semester, courses]) => (
                      <details key={semester} style={{ marginBottom: 12 }}>
                        <summary
                          style={{
                            fontWeight: 600,
                            cursor: "pointer",
                            padding: 8,
                            backgroundColor: "#f0f0f0",
                            borderRadius: 4,
                          }}
                        >
                          {semester} — {courses.length} courses
                        </summary>
                        <div style={{ marginTop: 8, marginLeft: 8 }}>
                          {courses.map((course, idx) => (
                            <div key={idx}>{renderCourse(course)}</div>
                          ))}
                        </div>
                      </details>
                    ),
                  )}
                </div>

                {c.attachments && c.attachments.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>
                      Attachments
                    </div>
                    {c.attachments.map((a, i) => (
                      <div key={i} style={{ marginBottom: 8 }}>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                          }}
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

                {c.versions && c.versions.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <details>
                      <summary>Version history ({c.versions.length})</summary>
                      <div style={{ marginTop: 8 }}>
                        {c.versions.map((v, idx) => (
                          <div key={idx} style={{ marginBottom: 8 }}>
                            <div style={{ fontWeight: 600 }}>
                              {v.title} — {v.versionedAt}
                            </div>
                            <div>{(v.courses || []).join(", ")}</div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}

                {selectedVersionIndex !== null &&
                  c.versions &&
                  c.versions[selectedVersionIndex] && (
                    <div style={{ marginTop: 8 }}>
                      {renderDiff(
                        currentForCompare(c),
                        versionForCompare(c, selectedVersionIndex),
                      )}
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ModuleShell>
  );
};

export default CurriculumViewer;
