/**
 * Format number to currency
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
};

/**
 * Format date
 */
export const formatDate = (date) => {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
};

/**
 * Get risk level color
 */
export const getRiskColor = (risk) => {
  const colors = {
    Low: "#2d7a4f",
    Medium: "#C9A200",
    High: "#d47000",
    Critical: "#c0392b",
  };
  return colors[risk] || "#666";
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value, total) => {
  return ((value / total) * 100).toFixed(2);
};

/**
 * Filter students by risk level
 */
export const filterStudentsByRisk = (students, riskLevel) => {
  return students.filter((student) => student.risk_level === riskLevel);
};

/**
 * Sort students by GPA
 */
export const sortStudentsByGPA = (students, ascending = false) => {
  return [...students].sort((a, b) => {
    return ascending
      ? a.current_gpa - b.current_gpa
      : b.current_gpa - a.current_gpa;
  });
};

/**
 * Search students by name or ID
 */
export const searchStudents = (students, query) => {
  const q = query.toLowerCase();
  return students.filter(
    (student) =>
      student.full_name.toLowerCase().includes(q) ||
      student.student_id.toLowerCase().includes(q),
  );
};
