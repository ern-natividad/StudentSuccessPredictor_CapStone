import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

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
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  signup: (userData) =>
    request("/auth/signup", { method: "POST", body: JSON.stringify(userData) }),

  verifyMfaLogin: (pendingToken, code) =>
    request("/auth/login/verify-mfa", {
      method: "POST",
      body: JSON.stringify({ pendingToken, code }),
    }),

  getMe: () => request("/auth/me"),

  logout: () => request("/auth/logout", { method: "POST" }),

  reportSessionTimeout: () =>
    request("/auth/session-timeout", { method: "POST" }),

  startMfaSetup: () => request("/mfa/setup/start", { method: "POST" }),

  confirmMfaSetup: (code) =>
    request("/mfa/setup/confirm", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  disableMfa: async (code, token) => {
    console.log("Session Storage Keys:", Object.keys(sessionStorage));
    console.log("Local Storage Keys:", Object.keys(localStorage));

    const authToken =
      token ||
      sessionStorage.getItem("authToken") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("token");

    console.log("Resolved Auth Token:", authToken);

    const targetUrl = `${BASE_URL.replace(/\/$/, "")}/mfa/disable`;

    const response = await axios.post(
      targetUrl,
      { code },
      { headers: { Authorization: `Bearer ${authToken}` } },
    );
    return response.data;
  },

  getAuditLogs: (limit = 100, offset = 0) =>
    request(`/audit-logs?limit=${limit}&offset=${offset}`),

  getManageableUsers: async (token) => {
  const authToken = 
    token || 
    localStorage.getItem("token") || 
    localStorage.getItem("accessToken");

  const response = await fetch("/api/auth/manageable-users", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authToken ? `Bearer ${authToken}` : "",
    },
  });

  const contentType = response.headers.get("content-type");
  let data = null;
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    const errorMsg = data?.error || `Failed to load users (${response.status})`;
    throw new Error(errorMsg);
  }

  return data || [];
},

deleteAccount: async (userId, token) => {
  const authToken = 
    token || 
    localStorage.getItem("token") || 
    localStorage.getItem("accessToken");

  const response = await fetch(`/api/auth/users/${userId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authToken ? `Bearer ${authToken}` : "",
    },
  });

  const contentType = response.headers.get("content-type");
  let data = null;
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    const errorMsg = data?.error || `Failed to delete account (${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
},
};

export const isBackendAuthEnabled = () =>
  String(import.meta.env.VITE_USE_BACKEND_AUTH).toLowerCase() === "true";
