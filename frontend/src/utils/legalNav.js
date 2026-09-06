const AUTH_RETURN_PATH_PATTERN = /^\/auth(?:\/(admin|staff|student))?$/;

/**
 * Resolve which auth screen to return to from Terms / Privacy.
 * Prefers location.state.from, then ?from=, then student auth.
 */
export const getAuthReturnPath = (location) => {
  const fromState = location?.state?.from;
  const fromQuery = new URLSearchParams(location?.search || "").get("from");
  const candidate = String(fromState || fromQuery || "").trim();

  if (AUTH_RETURN_PATH_PATTERN.test(candidate)) {
    return candidate === "/auth" ? "/auth/student" : candidate;
  }

  return "/auth/student";
};

/** Preserve return path when moving between legal pages. */
export const buildLegalNavState = (location) => ({
  from: getAuthReturnPath(location),
});
