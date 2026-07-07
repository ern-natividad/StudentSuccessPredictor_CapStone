import { verifyToken } from "../utils/jwt.js";
import { HttpError } from "./errorHandler.js";

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(new HttpError(401, "Authentication required."));
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return next(new HttpError(401, "Invalid or expired session."));
  }
};

/** Restricts an endpoint to specific roles. Must run after requireAuth. */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new HttpError(403, "You do not have access to this resource."));
  }
  return next();
};
