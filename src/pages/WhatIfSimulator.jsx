import { useMemo, useState } from "react";
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
  {
    key: "ai-advising",
    label: "AI Advising",
    path: "/modules/ai-advising",
  },
];

const students = [
  { id: "202301-01-001", name: "Maria Santos", program: "Civil Engineering", gwa: 3.72, risk: "Low", status: "On Track" },
  { id: "202301-01-003", name: "Juan Dela Cruz", program: "Electrical Engineering", gwa: 2.85, risk: "High", status: "Probation" },
  { id: "202301-01-006", name: "Sofia Garcia", program: "Industrial Engineering", gwa: 3.10, risk: "Medium", status: "Caution" },
];

const WhatIfSimulator = () => {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(students[0]);
  const [futureGwa, setFutureGwa] = useState("3.55");
  const [futureUnits, setFutureUnits] = useState("18");
  const [currentGrades, setCurrentGrades] = useState({ Math: "2.0", Science: "1.8", Programming: "1.9" });

  const availableStudents = useMemo(() => {
    const query = search.toLowerCase();
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) || student.id.toLowerCase().includes(query),
    );
  }, [search]);

  const handleLoadRecord = () => {
    const nextStudent = availableStudents[0] || students[0];
    setSelectedStudent(nextStudent);
  };

  const currentRiskClass = selectedStudent.risk === "High" ? styles.statusHigh : selectedStudent.risk === "Medium" ? styles.statusMedium : styles.statusLow;
  const projectedRiskClass = futureGwa < 3.0 ? styles.statusHigh : futureGwa < 3.5 ? styles.statusMedium : styles.statusLow;

  return (
    <ModuleShell
      title="What-If Academic Simulator"
      description="Simulate future academic outcomes and compare how grade adjustments will impact graduation risk and performance."
      activeKey="what-if-simulator"
      menuItems={moduleLinks}
    >
      <div className={styles.sectionGrid}>
        <div className={styles.moduleCard}>
          <div className={styles.moduleTitleSmall}>Student Selection</div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Search Student</label>
            <input
              className={styles.formInput}
              type="search"
              value={search}
              placeholder="Search by name or ID"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className={styles.buttonGroup}>
            <button className={styles.primaryButton} onClick={handleLoadRecord}>
              Load Academic Record
            </button>
          </div>
          <div className={styles.infoBlock}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Selected Student</span>
              <span className={styles.infoValue}>{selectedStudent.name}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Program</span>
              <span className={styles.infoValue}>{selectedStudent.program}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Current GWA</span>
              <span className={styles.infoValue}>{selectedStudent.gwa.toFixed(2)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Current Risk</span>
              <span className={`${styles.statusChip} ${currentRiskClass}`}>{selectedStudent.risk}</span>
            </div>
          </div>
        </div>

        <div className={styles.moduleCard}>
          <div className={styles.moduleTitleSmall}>Simulation Inputs</div>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Projected GWA</label>
              <input
                className={styles.formInput}
                value={futureGwa}
                onChange={(event) => setFutureGwa(event.target.value)}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Future Semester Units</label>
              <input
                className={styles.formInput}
                value={futureUnits}
                onChange={(event) => setFutureUnits(event.target.value)}
              />
            </div>
          </div>
          <div className={styles.moduleTitleSmall}>Current Semester Grades</div>
          <div className={styles.formGrid}>
            {Object.keys(currentGrades).map((course) => (
              <div key={course} className={styles.formField}>
                <label className={styles.formLabel}>{course}</label>
                <input
                  className={styles.formInput}
                  value={currentGrades[course]}
                  onChange={(event) =>
                    setCurrentGrades((prev) => ({
                      ...prev,
                      [course]: event.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <div className={styles.buttonGroup}>
            <button className={styles.primaryButton}>Save Scenario</button>
            <button className={styles.secondaryButton}>Reset Simulation</button>
          </div>
        </div>
      </div>

      <div className={styles.sectionGrid}>
        <div className={styles.moduleCard}>
          <div className={styles.moduleTitleSmall}>Comparison Panel</div>
          <div className={styles.infoBlock}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Current GWA</span>
              <span className={styles.infoValue}>{selectedStudent.gwa.toFixed(2)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Projected GWA</span>
              <span className={styles.infoValue}>{parseFloat(futureGwa).toFixed(2)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Current Risk</span>
              <span className={`${styles.statusChip} ${currentRiskClass}`}>{selectedStudent.risk}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Projected Risk</span>
              <span className={`${styles.statusChip} ${projectedRiskClass}`}>{parseFloat(futureGwa) < 3.0 ? "High" : parseFloat(futureGwa) < 3.5 ? "Medium" : "Low"}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Expected Graduation Status</span>
              <span className={styles.infoValue}>{parseFloat(futureGwa) >= 3.5 ? "On Track" : "At Risk"}</span>
            </div>
          </div>
        </div>

        <div className={styles.moduleCard}>
          <div className={styles.moduleTitleSmall}>Scenario Management</div>
          <div className={styles.infoBlock}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Last Scenario</span>
              <span className={styles.infoValue}>Draft - {selectedStudent.name}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Saved Versions</span>
              <span className={styles.infoValue}>3 scenarios</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Timeline</span>
              <span className={styles.infoValue}>Updated 8m ago</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.cardRow}>
        <div className={styles.moduleCard}>
          <div className={styles.moduleTitleSmall}>GPA Trend Chart</div>
          <div className={styles.placeholderChart}>
            <div>Projected GPA Trend</div>
            <span>Preview how changes impact semester performance.</span>
          </div>
        </div>
        <div className={styles.moduleCard}>
          <div className={styles.moduleTitleSmall}>Progress Timeline</div>
          <div className={styles.placeholderChart}>
            <div>Progress Timeline</div>
            <span>Identify milestones and risk inflection points.</span>
          </div>
        </div>
      </div>
    </ModuleShell>
  );
};

export default WhatIfSimulator;
