import { AUTH_ROLES, ROLE_DASHBOARD_PATHS, ROLE_MAP, VALID_CREDS } from "./constants";

/**
 * Get the role for a given email
 */
export const getRole = (email) => {
  return ROLE_MAP[email.toLowerCase()] || "student";
};

/**
 * Get supported role content for auth screens
 */
export const getAuthRole = (role) => {
  return AUTH_ROLES[role] || AUTH_ROLES.student;
};

/**
 * Get the landing page for a role after authentication
 */
export const getDashboardPath = (role) => {
  return ROLE_DASHBOARD_PATHS[role] || ROLE_DASHBOARD_PATHS.student;
};

/**
 * Validate user credentials
 */
export const validateCredentials = (email, password) => {
  const emailLower = email.toLowerCase();
  return VALID_CREDS[emailLower] && VALID_CREDS[emailLower] === password;
};

/**
 * Generate user name from email
 */
export const generateNameFromEmail = (email) => {
  return email
    .split("@")[0]
    .replace(/\./g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Generate initials from name
 */
export const generateInitials = (name) => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

/**
 * Capitalize a string
 */
export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Store user in session
 */
export const storeUserSession = (name, role) => {
  sessionStorage.setItem("userName", name);
  sessionStorage.setItem("userRole", role);
};

/**
 * Get user from session
 */
export const getUserSession = () => {
  return {
    userName: sessionStorage.getItem("userName") || "",
    userRole: sessionStorage.getItem("userRole") || "student",
  };
};

/**
 * Clear user session
 */
export const clearUserSession = () => {
  sessionStorage.clear();
};
