import { AUTH_ROLES, ROLE_DASHBOARD_PATHS } from "./constants";

// ==========================================
// 1. Helper Functions
// ==========================================

export const getAuthRole = (role) => {
  return AUTH_ROLES[role] || AUTH_ROLES.student;
};

export const getDashboardPath = (role) => {
  return ROLE_DASHBOARD_PATHS[role] || ROLE_DASHBOARD_PATHS.student;
};

export const generateInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};


// ==========================================
// 2. Auth Session Helpers
// ==========================================

// Used by local mock login mode to check static strings
export const validateCredentials = (email, password) => {
  if (!email || !password) return false;
  // Basic mock check: if it contains an @ and password is at least 6 characters
  return email.includes("@") && password.length >= 6;
};

// Infers a capitalized display name from an email address (e.g., john.doe@... -> John Doe)
export const generateNameFromEmail = (email) => {
  if (!email) return "";
  const namePart = email.split("@")[0];
  return namePart
    .split(/[._-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Helper to deduce app roles from email patterns if needed for legacy compatibility
export const getRole = (email) => {
  const lowerEmail = email.toLowerCase();
  if (lowerEmail.includes("admin")) return "admin";
  if (lowerEmail.includes("staff") || lowerEmail.includes("teacher")) return "staff";
  return "student";
};

// Local storage session managers
export const storeUserSession = (userName, userRole) => {
  localStorage.setItem("userName", userName);
  localStorage.setItem("userRole", userRole);
};

export const getUserSession = () => {
  return {
    userName: localStorage.getItem("userName") || "",
    userRole: localStorage.getItem("userRole") || "student",
  };
};

// CRITICAL: The function AuthContext was looking for to handle logouts!
export const clearUserSession = () => {
  localStorage.removeItem("userName");
  localStorage.removeItem("userRole");
};