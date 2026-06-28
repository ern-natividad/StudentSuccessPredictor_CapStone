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
  {
    id: "202301-01-001",
    name: "Maria Santos",
    program: "Civil Engineering",
    currentGwa: 3.72,
    predictedGwa: 3.95,
    outcome: "On Track",
    risk: "Low",
    recommendation: "Maintain study plan",
  },
  {
    id: "202301-01-003",
    name: "Juan Dela Cruz",
    program: "Electrical Engineering",
    currentGwa: 2.85,
    predictedGwa: 2.72,
    outcome: "At Risk",
    risk: "High",
    recommendation: "Enroll in tutoring",
  },
  {
    id: "202301-01-006",
    name: "Sofia Garcia",
    program: "Industrial Engineering",
    currentGwa: 3.10,
    predictedGwa: 3.38,
    outcome: "Caution",
    risk: "Medium",
    recommendation: "Review core subjects",
  },
];

const AcademicPerformanceModule = () => {
  const [filters, setFilters] = useState({ course: "All", yearLevel: "All", risk: "All", academicYear: "2025-2026" });
  const [search, setSearch] = useState("");

  const filteredStudents = useMemo(() => {
    const query = search.toLowerCase();
    return students.filter((student) => {
      const matchesText =
        student.name.toLowerCase().includes(query) ||
        student.id.toLowerCase().includes(query) ||
        student.program.toLowerCase().includes(query);
      const matchesRisk = filters.risk === "All" || student.risk === filters.risk;
      const matchesYear = filters.yearLevel === "All" || filters.yearLevel === student.program;
      return matchesText && matchesRisk && matchesYear;
    });
  }, [filters, search]);

  const riskClass = (risk) => {
    switch (risk) {
      case "Low":
        return styles.statusLow;
      case "Medium":
        return styles.statusMedium;
      case "High":
        return styles.statusHigh;
      default:
        return styles.statusCritical;
    }
  };

  return (
    <ModuleShell
      title="Academic Performance Forecasting and Early Warning Module"
      description="Predict student academic performance and identify learners requiring intervention before risks surface."
      activeKey="academic-performance"
      menuItems={moduleLinks}
    >
      <div className={styles.metricGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Total Students</div>
          <div className={styles.metricValue}>128</div>
          <div className={styles.metricSubtext}>Active student cohort</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Predicted Low Risk</div>
          <div className={styles.metricValue}>72%</div>
          <div className={styles.metricSubtext}>Students on strong trajectory</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Predicted Moderate Risk</div>
          <div className={styles.metricValue}>18%</div>
          <div className={styles.metricSubtext}>Monitor progress closely</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Predicted High Risk</div>
          <div className={styles.metricValue}>10%</div>
          <div className={styles.metricSubtext}>Intervention required</div>
        </div>
      </div>

      <div className={styles.moduleCard}>
        <div className={styles.moduleTitleSmall}>Student Prediction Table</div>
        <div className={styles.buttonGroup}>
          <input
            type="search"
            className={styles.formInput}
            placeholder="Search student, ID, or program"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className={styles.formSelect}
            value={filters.risk}
            onChange={(event) => setFilters((prev) => ({ ...prev, risk: event.target.value }))}
          >
            {['All', 'Low', 'Medium', 'High'].map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <select
            className={styles.formSelect}
            value={filters.academicYear}
            onChange={(event) => setFilters((prev) => ({ ...prev, academicYear: event.target.value }))}
          >
            {['2025-2026', '2024-2025', '2023-2024'].map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <button className={styles.secondaryButton}>Export Excel</button>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.moduleTable}>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Program</th>
                <th>Current GWA</th>
                <th>Predicted GWA</th>
                <th>Graduation Outcome</th>
                <th>Risk Level</th>
                <th>Recommendation</th>
              </tr>
            </thead>
            <tbody className={styles.tableStriped}>
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td>{student.id}</td>
                  <td>{student.name}</td>
                  <td>{student.program}</td>
                  <td>{student.currentGwa.toFixed(2)}</td>
                  <td>{student.predictedGwa.toFixed(2)}</td>
                  <td>{student.outcome}</td>
                  <td>
                    <span className={`${styles.statusChip} ${riskClass(student.risk)}`}>
                      {student.risk}
                    </span>
                  </td>
                  <td>{student.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.sectionGrid}>
        <div className={styles.moduleCard}>
          <div className={styles.moduleTitleSmall}>Feature Importance</div>
          <div className={styles.placeholderChart}>
            <div>Feature Importance Chart</div>
            <span>Review the top factors that influence risk and predicted GWA.</span>
          </div>
        </div>
        <div className={styles.moduleCard}>
          <div className={styles.moduleTitleSmall}>Risk Distribution</div>
          <div className={styles.placeholderChart}>
            <div>Risk Distribution</div>
            <span>Visualize how students are segmented by predicted risk level.</span>
          </div>
        </div>
      </div>

      <div className={styles.cardRow}>
        <div className={styles.moduleCard}>
          <div className={styles.moduleTitleSmall}>Model Comparison</div>
          <div className={styles.infoBlock}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Random Forest Accuracy</span>
              <span className={styles.infoValue}>91.4%</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Gradient Boosting Accuracy</span>
              <span className={styles.infoValue}>93.2%</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Precision</span>
              <span className={styles.infoValue}>89.6%</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Recall</span>
              <span className={styles.infoValue}>87.1%</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>F1 Score</span>
              <span className={styles.infoValue}>88.3%</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>ROC-AUC</span>
              <span className={styles.infoValue}>0.94</span>
            </div>
          </div>
        </div>
        <div className={styles.moduleCard}>
          <div className={styles.moduleTitleSmall}>Confusion Matrices</div>
          <div className={styles.placeholderChart}>
            <div>Random Forest Confusion Matrix</div>
          </div>
          <div className={styles.placeholderChart} style={{ minHeight: "150px" }}>
            <div>Gradient Boosting Confusion Matrix</div>
          </div>
        </div>
      </div>
    </ModuleShell>
  );
};

export default AcademicPerformanceModule;
