const resetRequests = new Map();
const CODE_TTL_MS = 15 * 60 * 1000;
const VERIFIED_TTL_MS = 30 * 60 * 1000;

const generateCode = () =>
  String(Math.floor(100000 + Math.random() * 900000));

const purgeExpired = () => {
  const now = Date.now();
  for (const [key, entry] of resetRequests.entries()) {
    if (entry.expiresAt <= now) {
      resetRequests.delete(key);
    }
  }
};

export const createResetCode = (identifier) => {
  purgeExpired();
  const key = identifier.trim().toLowerCase();
  const code = generateCode();
  resetRequests.set(key, {
    code,
    verified: false,
    expiresAt: Date.now() + CODE_TTL_MS,
  });
  return code;
};

export const verifyResetCode = (identifier, code) => {
  purgeExpired();
  const key = identifier.trim().toLowerCase();
  const entry = resetRequests.get(key);

  if (!entry) {
    return { valid: false, reason: "No reset request found. Please request a new code." };
  }

  if (entry.expiresAt <= Date.now()) {
    resetRequests.delete(key);
    return { valid: false, reason: "This code has expired. Please request a new one." };
  }

  if (entry.code !== code.trim()) {
    return { valid: false, reason: "Invalid verification code. Please try again." };
  }

  entry.verified = true;
  entry.expiresAt = Date.now() + VERIFIED_TTL_MS;
  resetRequests.set(key, entry);
  return { valid: true };
};

export const consumeVerifiedReset = (identifier) => {
  purgeExpired();
  const key = identifier.trim().toLowerCase();
  const entry = resetRequests.get(key);

  if (!entry?.verified || entry.expiresAt <= Date.now()) {
    return false;
  }

  resetRequests.delete(key);
  return true;
};
