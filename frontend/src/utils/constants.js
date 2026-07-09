export const AUTH_ROLES = {
  admin: {
    id: "admin",
    shortTitle: "Admin",
    description:
      "System oversight, student management, audit logs, and alert monitoring",
    icon: "fas fa-user-tie",
    path: "/auth/admin",
    loginTitle: "Administrator Login",
    loginSubtitle: "Access system oversight, audit logs, and model tools",
    signupTitle: "Create Administrator Account",
    signupSubtitle: "Register an account for system-level access",
    emailLabel: "Administrator Email",
    emailPlaceholder: "admin@wmsu.edu.ph",
  },
  staff: {
    id: "staff",
    shortTitle: "Staff",
    description:
      "Monitor student performance, generate reports, and coordinate interventions",
    icon: "fas fa-clipboard-user",
    path: "/auth/staff",
    loginTitle: "Staff Login",
    loginSubtitle: "Access monitoring, reports, and intervention tools",
    signupTitle: "Create Staff Account",
    signupSubtitle: "Register an account for academic support access",
    emailLabel: "Staff Email",
    emailPlaceholder: "staff@wmsu.edu.ph",
  },
  student: {
    id: "student",
    shortTitle: "Student",
    description:
      "View personal success prediction, track progress, and receive academic guidance",
    icon: "fas fa-graduation-cap",
    path: "/auth/student",
    loginTitle: "Student Login",
    loginSubtitle: "Access your prediction, progress, and academic guidance",
    signupTitle: "Create Student Account",
    signupSubtitle: "Join the student success predictor",
    emailLabel: "Student Email",
    emailPlaceholder: "student@wmsu.edu.ph",
    idLabel: "Student ID",
    idName: "studentId",
    idPlaceholder: "202301-01-001",
    groupLabel: "Year Level",
    groupName: "year",
    groupOptions: ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"],
  },
};

export const ROLE_DASHBOARD_PATHS = {
  admin: "/admin",
  staff: "/staff",
  student: "/dashboard",
};

// Alert data
export const ALERTS_DATA = [
  {
    name: "Juan Dela Cruz",
    desc: "Predicted GPA below 2.5 — academic risk detected",
    sev: "critical",
    time: "2h ago",
  },
  {
    name: "Pedro Santos",
    desc: "Current semester GPA dropped to 1.8 — probation risk",
    sev: "critical",
    time: "4h ago",
  },
  {
    name: "Rosa Manalang",
    desc: "Graduation delay probability exceeded 20%",
    sev: "high",
    time: "1d ago",
  },
  {
    name: "Marco Tan",
    desc: "3 consecutive semesters below 3.0 GPA",
    sev: "high",
    time: "2d ago",
  },
  {
    name: "Luz Ramos",
    desc: "Missing prerequisite subjects for thesis enrollment",
    sev: "medium",
    time: "3d ago",
  },
];

// Students data
export const STUDENTS = [
  {
    student_id: "202301-01-001",
    full_name: "Maria Santos",
    year_level: "3rd",
    current_gpa: 3.72,
    predicted_gpa: 3.95,
    confidence_score: 92,
    risk_level: "Low",
    assignedSectionId: "BSIT-3A",
    assignedStaffId: "staff-1",
    grade_records: [
      {
        subject: "Data Structures",
        semester: "1S",
        grade: 1,
        remarks: "Good",
      },
    ],
  },
  {
    student_id: "202301-01-002",
    full_name: "Jose Reyes",
    year_level: "3rd",
    current_gpa: 3.5,
    predicted_gpa: 3.88,
    confidence_score: 89,
    risk_level: "Low",
    assignedSectionId: "BSIT-3A",
    assignedStaffId: "staff-1",
    grade_records: [
      {
        subject: "Computer Networks",
        semester: "1S",
        grade: 2,
        remarks: "Satisfactory",
      },
    ],
  },
  {
    student_id: "202301-01-003",
    full_name: "Juan Dela Cruz",
    year_level: "3rd",
    current_gpa: 2.85,
    predicted_gpa: 2.72,
    confidence_score: 84,
    risk_level: "High",
    assignedSectionId: "BECE-4B",
    assignedStaffId: "staff-2",
    grade_records: [
      {
        subject: "Thermodynamics",
        semester: "1S",
        grade: 4,
        remarks: "Needs improvement",
      },
    ],
  },
  {
    student_id: "202301-01-004",
    full_name: "Ana Lim",
    year_level: "2nd",
    current_gpa: 3.4,
    predicted_gpa: 3.82,
    confidence_score: 91,
    risk_level: "Low",
    assignedSectionId: "BSIT-2A",
    assignedStaffId: "staff-3",
    grade_records: [
      {
        subject: "Programming Logic",
        semester: "1S",
        grade: 1,
        remarks: "Solid work",
      },
    ],
  },
  {
    student_id: "202301-01-005",
    full_name: "Carlos Mendoza",
    year_level: "4th",
    current_gpa: 3.2,
    predicted_gpa: 3.74,
    confidence_score: 88,
    risk_level: "Low",
    assignedSectionId: "BECE-4B",
    assignedStaffId: "staff-2",
    grade_records: [
      {
        subject: "Electronics I",
        semester: "1S",
        grade: 2,
        remarks: "On target",
      },
    ],
  },
  {
    student_id: "202301-01-006",
    full_name: "Sofia Garcia",
    year_level: "2nd",
    current_gpa: 3.1,
    predicted_gpa: 3.71,
    confidence_score: 86,
    risk_level: "Medium",
  },
  {
    student_id: "202301-01-007",
    full_name: "Pedro Santos",
    year_level: "3rd",
    current_gpa: 1.8,
    predicted_gpa: 2.1,
    confidence_score: 78,
    risk_level: "Critical",
  },
  {
    student_id: "202301-01-008",
    full_name: "Rosa Manalang",
    year_level: "4th",
    current_gpa: 2.5,
    predicted_gpa: 2.65,
    confidence_score: 80,
    risk_level: "High",
  },
  {
    student_id: "202301-01-009",
    full_name: "Marco Tan",
    year_level: "3rd",
    current_gpa: 2.7,
    predicted_gpa: 2.8,
    confidence_score: 82,
    risk_level: "High",
  },
  {
    student_id: "202301-01-010",
    full_name: "Luz Ramos",
    year_level: "5th",
    current_gpa: 2.95,
    predicted_gpa: 3.05,
    confidence_score: 85,
    risk_level: "Medium",
  },
];

export const SECTIONS = [
  {
    id: "BSIT-3A",
    name: "BSIT 3A",
    adviserId: "staff-1",
    description:
      "Bachelor of Science in Information Technology, 3rd year section A",
  },
  {
    id: "BECE-4B",
    name: "BECE 4B",
    adviserId: "staff-2",
    description: "Bachelor of Elementary Education, 4th year section B",
  },
  {
    id: "BSIT-2A",
    name: "BSIT 2A",
    adviserId: "staff-3",
    description:
      "Bachelor of Science in Information Technology, 2nd year section A",
  },
];

export const STAFF_MEMBERS = [
  {
    id: "staff-1",
    full_name: "Rhea Navarro",
    email: "rhea.navarro@wmsu.edu.ph",
    role: "staff",
    title: "Academic Adviser",
  },
  {
    id: "staff-2",
    full_name: "Mark Villanueva",
    email: "mark.villanueva@wmsu.edu.ph",
    role: "staff",
    title: "Department Coordinator",
  },
  {
    id: "staff-3",
    full_name: "Aileen Cruz",
    email: "aileen.cruz@wmsu.edu.ph",
    role: "staff",
    title: "Student Support Officer",
  },
];

// Risk classification
export const RISK_CLASS = {
  Low: "risk-low",
  Medium: "risk-medium",
  High: "risk-high",
  Critical: "risk-critical",
};

// Alert icons mapping
export const ALERT_ICONS = {
  critical: "exclamation-triangle",
  high: "bell",
  medium: "thumbtack",
  low: "info-circle",
};

// Chart colors
export const CHART_COLORS = {
  low: "#2d7a4f",
  medium: "#C9A200",
  high: "#d47000",
  critical: "#c0392b",
};
