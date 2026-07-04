import { AUTH_ROLES, ROLE_DASHBOARD_PATHS } from "./constants";

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
 * Generate initials from name
 */
export const generateInitials = (name) => {
  if (!name) return "";
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

/*
 * NOTE:
 * getRole(), validateCredentials(), generateNameFromEmail(),
 * storeUserSession(), getUserSession(), and clearUserSession() have all
 * been removed. Supabase Auth now owns the session (persisted in
 * localStorage by the Supabase client itself) and role/name are read from
 * the authenticated user's metadata — see src/contexts/AuthContext.jsx.
 */
