import rateLimit from "express-rate-limit";

// Network-level throttle on auth endpoints, layered on top of the
// application-level account lockout logic (which tracks per-account
// failures rather than per-IP request volume).
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});
