// Authentication credentials and role mapping
export const AUTH_ROLES = {
  admin: {
    id: "admin",
    title: "Administrator",
    shortTitle: "Admin",
    description:
      "System oversight, student management, audit logs, alert monitoring, and model management",
    icon: "fas fa-user-tie",
    path: "/auth/admin",
    loginTitle: "Administrator Login",
    loginSubtitle: "Access system oversight, audit logs, and model tools",
    signupTitle: "Create Administrator Account",
    signupSubtitle: "Register an account for system-level access",
    emailLabel: "Administrator Email",
    emailPlaceholder: "admin@wmsu.edu.ph",
    idLabel: "Administrator ID",
    idName: "employeeId",
    idPlaceholder: "ADM-2026-001",
    groupLabel: "Administrative Office",
    groupName: "department",
    groupOptions: ["System Office", "College Dean", "Registrar", "Program Chair"],
    accessCodeLabel: "Admin Access Code",
    accessCodePlaceholder: "Enter admin access code",
  },
  staff: {
    id: "staff",
    title: "Staff",
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
    idLabel: "Staff ID",
    idName: "employeeId",
    idPlaceholder: "STF-2026-001",
    groupLabel: "Assigned Unit",
    groupName: "department",
    groupOptions: [
      "Engineering Department",
      "Guidance Office",
      "Student Affairs",
      "Academic Advising",
    ],
    accessCodeLabel: "Staff Access Code",
    accessCodePlaceholder: "Enter staff access code",
  },
  student: {
    id: "student",
    title: "Student",
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

export const ROLE_MAP = {
  "admin@wmsu.edu.ph": "admin",
  "staff@wmsu.edu.ph": "staff",
  "student@wmsu.edu.ph": "student",
  admin: "admin",
  staff: "staff",
};

export const VALID_CREDS = {
  admin: "admin123",
  staff: "staff123",
  "admin@wmsu.edu.ph": "admin123",
  "staff@wmsu.edu.ph": "staff123",
  "student@wmsu.edu.ph": "student123",
  student: "student123",
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
    id: "202301-01-001",
    name: "Maria Santos",
    year: "3rd",
    gpa: 3.72,
    pred: 3.95,
    conf: 92,
    risk: "Low",
  },
  {
    id: "202301-01-002",
    name: "Jose Reyes",
    year: "3rd",
    gpa: 3.5,
    pred: 3.88,
    conf: 89,
    risk: "Low",
  },
  {
    id: "202301-01-003",
    name: "Juan Dela Cruz",
    year: "3rd",
    gpa: 2.85,
    pred: 2.72,
    conf: 84,
    risk: "High",
  },
  {
    id: "202301-01-004",
    name: "Ana Lim",
    year: "2nd",
    gpa: 3.4,
    pred: 3.82,
    conf: 91,
    risk: "Low",
  },
  {
    id: "202301-01-005",
    name: "Carlos Mendoza",
    year: "4th",
    gpa: 3.2,
    pred: 3.74,
    conf: 88,
    risk: "Low",
  },
  {
    id: "202301-01-006",
    name: "Sofia Garcia",
    year: "2nd",
    gpa: 3.1,
    pred: 3.71,
    conf: 86,
    risk: "Medium",
  },
  {
    id: "202301-01-007",
    name: "Pedro Santos",
    year: "3rd",
    gpa: 1.8,
    pred: 2.1,
    conf: 78,
    risk: "Critical",
  },
  {
    id: "202301-01-008",
    name: "Rosa Manalang",
    year: "4th",
    gpa: 2.5,
    pred: 2.65,
    conf: 80,
    risk: "High",
  },
  {
    id: "202301-01-009",
    name: "Marco Tan",
    year: "3rd",
    gpa: 2.7,
    pred: 2.8,
    conf: 82,
    risk: "High",
  },
  {
    id: "202301-01-010",
    name: "Luz Ramos",
    year: "5th",
    gpa: 2.95,
    pred: 3.05,
    conf: 85,
    risk: "Medium",
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
