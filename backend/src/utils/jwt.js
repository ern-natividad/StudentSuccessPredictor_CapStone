import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signToken = (payload) =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export const verifyToken = (token) => jwt.verify(token, env.jwtSecret);

export const signPendingMfaToken = (userId) =>
  jwt.sign({ sub: userId, pendingMfa: true }, env.jwtSecret, { expiresIn: "5m" });

export const verifyPendingMfaToken = (token) => {
  const payload = jwt.verify(token, env.jwtSecret);
  if (!payload.pendingMfa) {
    throw new Error("Invalid pending MFA token.");
  }
  return payload;
};
