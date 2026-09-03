import { useEffect, useState } from "react";
import ModuleShell from "../../../components/Common/ModuleShell";
import { useToast } from "../../../components/Common/Toast";
import { supabase } from "../../../lib/supabaseClient";
import { getPublishedCurricula } from "../../../services/curriculumService";
import CurriculumAppraisalSheet from "../../admin/components/CurriculumAppraisalSheet";
import {
  compareCurriculumCourses,
  downloadCurriculumAppraisal,
  formatVersionTimestamp,
  getCourseTotalUnits,
  getUniqueCurriculumVersions,
} from "../../../utils/curriculumAppraisalUtils";
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

const CurriculumViewer = () => {
  const toast = useToast();
  const [published, setPublished] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProgram, setFilterProgram] = useState("");
  const [compareByCurriculumId, setCompareByCurriculumId] = useState({});

  const loadCurricula = async () => {
    try {
      setLoading(true);
      setPublished(await getPublishedCurricula());
    } catch (err) {
      console.error("Failed to load curricula:", err);
      toast.error(err.message || "Failed to load curricula.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurricula();

    // Reflect Curriculum Manager (admin) changes live, without a manual refresh.
    const subscription = supabase
      .channel("public:curricula_viewer")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "curricula" },
        () => {
          loadCurricula();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const visible = filterProgram
    ? published.filter((c) => c.program === filterProgram)
    : published;

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

  // Version diff: compare a selected snapshot to the current published sheet
  const handleCompareChange = (curriculumId, value) => {
    setCompareByCurriculumId((prev) => ({
      ...prev,
      [curriculumId]: value === "" ? "" : Number(value),
    }));
  };

  const renderCourseLabel = (course) =>
    `${course.code || "Untitled"} — ${course.title || "No description"} (${getCourseTotalUnits(course)} u)`;

  const renderDiff = (currentCourses, versionCourses) => {
    const { added, removed, changed } = compareCurriculumCourses(
      currentCourses,
      versionCourses,
    );

    if (added.length === 0 && removed.length === 0 && changed.length === 0) {
      return (
        <div style={{ marginTop: 8, color: "#64748b", fontSize: "0.9rem" }}>
          No course differences from the selected version.
        </div>
      );
    }

    return (
      <div
        style={{
          marginTop: 12,
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          padding: 14,
          background: "#f8fafc",
        }}
      >
        <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
          Changes from selected version
        </div>
        {added.length > 0 && (
          <div style={{ color: "#15803d", marginBottom: 8 }}>
            <div style={{ fontWeight: 700 }}>Added ({added.length})</div>
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {added.map((course, index) => (
                <li key={`added-${course.code}-${index}`}>{renderCourseLabel(course)}</li>
              ))}
            </ul>
          </div>
        )}
        {removed.length > 0 && (
          <div style={{ color: "#b91c1c", marginBottom: 8 }}>
            <div style={{ fontWeight: 700 }}>Removed ({removed.length})</div>
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {removed.map((course, index) => (
                <li key={`removed-${course.code}-${index}`}>{renderCourseLabel(course)}</li>
              ))}
            </ul>
          </div>
        )}
        {changed.length > 0 && (
          <div style={{ color: "#b45309" }}>
            <div style={{ fontWeight: 700 }}>Updated ({changed.length})</div>
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {changed.map((item, index) => (
                <li key={`changed-${item.current.code}-${index}`}>
                  {item.current.code}: {item.previous.title} → {item.current.title}
                </li>
              ))}
            </ul>
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

        {loading ? (
          <div className={styles.placeholderChart} style={{ marginTop: 16 }}>
            Loading curricula…
          </div>
        ) : visible.length === 0 ? (
          <div className={styles.placeholderChart} style={{ marginTop: 16 }}>
            No curricula available.
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            {visible.map((c) => {
              const uniqueVersions = getUniqueCurriculumVersions(
                c.versions || [],
                c,
              );
              const selectedCompareIndex = compareByCurriculumId[c.id];
              const selectedVersion =
                typeof selectedCompareIndex === "number"
                  ? uniqueVersions[selectedCompareIndex]
                  : null;

              return (
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
                      Department: {c.department} | Program: {c.program} |
                      Total Units: {c.courses ? c.courses.length : 0}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      className={styles.performanceIconButton}
                      onClick={() => downloadCurriculumAppraisal(c)}
                      title="Download curriculum"
                      aria-label={`Download ${c.title}`}
                    >
                      <i className="fas fa-download" aria-hidden="true" />
                    </button>
                    {uniqueVersions.length > 0 ? (
                    <div style={{ minWidth: 220 }}>
                      <select
                        className={styles.formSelect}
                        value={compareByCurriculumId[c.id] ?? ""}
                        onChange={(e) => handleCompareChange(c.id, e.target.value)}
                        aria-label={`Compare versions of ${c.title}`}
                      >
                        <option value="">Current published version</option>
                        {uniqueVersions.map((version, idx) => (
                          <option key={`${c.id}-v-${version.versionedAt}-${idx}`} value={idx}>
                            Compare: {formatVersionTimestamp(version.versionedAt)}
                          </option>
                        ))}
                      </select>
                    </div>
                    ) : null}
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>
                    Student Appraisal Sheet Format
                  </div>
                  <CurriculumAppraisalSheet
                    courses={c.courses || []}
                    title={c.title}
                    program={c.program}
                    academicYear={c.academicYear}
                    department={c.department}
                    includeEmpty={false}
                    showGradeColumn
                    showAdvisingHistory
                    compact
                  />
                </div>

                {selectedVersion && (
                    <div style={{ marginTop: 12 }}>
                      {renderDiff(c.courses || [], selectedVersion.courses || [])}
                      <details style={{ marginTop: 12 }}>
                        <summary
                          style={{
                            cursor: "pointer",
                            fontWeight: 600,
                            color: "#334155",
                          }}
                        >
                          View selected previous version
                        </summary>
                        <div style={{ marginTop: 10 }}>
                          <CurriculumAppraisalSheet
                            courses={selectedVersion.courses || []}
                            title={selectedVersion.title || c.title}
                            program={selectedVersion.program || c.program}
                            academicYear={
                              selectedVersion.academicYear || c.academicYear
                            }
                            department={
                              selectedVersion.department || c.department
                            }
                            includeEmpty={false}
                            showGradeColumn
                            showAdvisingHistory
                            compact
                          />
                        </div>
                      </details>
                    </div>
                  )}

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
              </div>
              );
            })}
          </div>
        )}
      </div>
    </ModuleShell>
  );
};

export default CurriculumViewer;
