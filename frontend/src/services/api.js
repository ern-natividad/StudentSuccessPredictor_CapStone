const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

const request = async (path, options = {}) => {
  const token = sessionStorage.getItem("authToken");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong. Please try again.");
  }

  return data;
};

export const api = {
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  signup: (userData) =>
    request("/auth/signup", { method: "POST", body: JSON.stringify(userData) }),

  verifyMfaLogin: (pendingToken, code) =>
    request("/auth/login/verify-mfa", {
      method: "POST",
      body: JSON.stringify({ pendingToken, code }),
    }),

  getMe: () => request("/auth/me"),

  logout: () => request("/auth/logout", { method: "POST" }),

  reportSessionTimeout: () => request("/auth/session-timeout", { method: "POST" }),

  startMfaSetup: () => request("/mfa/setup/start", { method: "POST" }),

  confirmMfaSetup: (code) =>
    request("/mfa/setup/confirm", { method: "POST", body: JSON.stringify({ code }) }),

  disableMfa: async (code, token) => {
  const authToken = token || sessionStorage.getItem("authToken");
  const response = await axios.post("/api/mfa/disable", 
    { code }, 
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  return response.data;
},

  getAuditLogs: (limit = 100, offset = 0) =>
    request(`/audit-logs?limit=${limit}&offset=${offset}`),
};

export const isBackendAuthEnabled = () =>
  String(import.meta.env.VITE_USE_BACKEND_AUTH).toLowerCase() === "true";