import { createHmac } from "node:crypto";
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { supabase } from "../config/supabaseClient.js";
import { HttpError } from "./errorHandler.js";

const MISSING_RPC_RETRY_MS = 60_000;

export const createSharedRateLimiter = (
  scope,
  {
    windowMs = 15 * 60 * 1000,
    max = 30,
    message = "Too many requests. Please try again later.",
  } = {},
) => {
  let sharedLimiterUnavailableUntil = 0;

  const getKeyHash = (req) => {
    const clientAddress = req.ip || req.socket?.remoteAddress || "unknown";
    return createHmac("sha256", env.jwtSecret)
      .update(`api-rate-limit:${scope}:${clientAddress}`)
      .digest("hex");
  };

  const localRateLimiter = rateLimit({
    windowMs,
    limit: max,
    keyGenerator: getKeyHash,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => res.status(429).json({ error: message }),
  });

  return async (req, res, next) => {
    if (Date.now() < sharedLimiterUnavailableUntil) {
      return localRateLimiter(req, res, next);
    }

    try {
      const { data, error } = await supabase.rpc("consume_shared_rate_limit", {
        p_scope: scope,
        p_key_hash: getKeyHash(req),
        p_window_ms: windowMs,
        p_max_requests: max,
      });
      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : data;
      const resetAt = new Date(result?.reset_at).getTime();
      if (
        !result ||
        typeof result.allowed !== "boolean" ||
        !Number.isInteger(result.request_count) ||
        !Number.isFinite(resetAt)
      ) {
        throw new Error("Shared rate-limit service returned an invalid response.");
      }

      const remaining = Math.max(0, max - result.request_count);
      const resetSeconds = Math.max(
        0,
        Math.ceil((resetAt - Date.now()) / 1000),
      );
      res.setHeader("RateLimit-Limit", max);
      res.setHeader("RateLimit-Remaining", remaining);
      res.setHeader("RateLimit-Reset", resetSeconds);
      res.setHeader("RateLimit-Policy", `${max};w=${Math.ceil(windowMs / 1000)}`);

      if (!result.allowed) {
        return res.status(429).json({ error: message });
      }
      return next();
    } catch (error) {
      if (error?.code === "PGRST202") {
        sharedLimiterUnavailableUntil = Date.now() + MISSING_RPC_RETRY_MS;
        console.warn(
          "Shared rate-limit RPC is missing from the Supabase schema cache. " +
            "Using per-process rate limiting temporarily; apply backend/sql/016_shared_auth_state.sql " +
            "in Supabase and refresh the PostgREST schema cache.",
        );
        return localRateLimiter(req, res, next);
      }

      console.error("Shared rate-limit check failed:", error);
      return next(
        new HttpError(
          503,
          "Request throttling is temporarily unavailable. Please retry shortly.",
        ),
      );
    }
  };
};

export const authRateLimiter = createSharedRateLimiter("auth", {
  message: "Too many requests. Please try again later.",
});

export const recommendationRateLimiter = createSharedRateLimiter(
  "recommendation",
  { message: "Too many recommendation requests. Please try again later." },
);
