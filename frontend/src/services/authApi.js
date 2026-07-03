const API_BASE = import.meta.env.VITE_API_URL || "/api/auth";

const parseResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Something went wrong. Please try again.");
  }
  return data;
};

export const requestPasswordReset = async (identifier) => {
  return parseResponse(
    await fetch(`${API_BASE}/forgot-password/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier }),
    }),
  );
};

export const verifyPasswordResetCode = async (identifier, code) => {
  return parseResponse(
    await fetch(`${API_BASE}/forgot-password/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, code }),
    }),
  );
};

export const resetPassword = async (identifier, newPassword) => {
  return parseResponse(
    await fetch(`${API_BASE}/forgot-password/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, newPassword }),
    }),
  );
};

export const loginWithBackend = async (email, password) => {
  return parseResponse(
    await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  );
};
