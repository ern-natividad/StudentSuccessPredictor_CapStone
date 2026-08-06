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
    accessCodeLabel: "Admin Access Code",
    accessCodePlaceholder: "Enter the administrator access code",
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
    accessCodeLabel: "Staff Access Code",
    accessCodePlaceholder: "Enter the staff access code",
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
