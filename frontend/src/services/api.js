import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

export const isEmptyDataError = (error) => {
  if (!error) return false;
  if (error.status === 404) return true;
  if (error.isNetworkError) return true;

  const message = (error.message || "").toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed") ||
    message.includes("load failed") ||
    message.includes("connection refused") ||
    message.includes("no prediction") ||
    message.includes("at least one grade") ||
    message.includes("no grade") ||
    message.includes("no record")
  );
};

const request = async (path, options = {}) => {
  const token = sessionStorage.getItem("authToken");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    const error = new Error("Failed to fetch");
    error.isNetworkError = true;
    throw error;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || "Something went wrong. Please try again.");
    error.status = response.status;
    throw error;
  }

  return data;
};

export const api = {
  login: (email, password, accessCode, role) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, accessCode, role }),
    }),

  signup: (userData) => {
    console.log("api.js -> signup -> year_level:", userData.year_level);
    return request("/auth/signup", { method: "POST", body: JSON.stringify(userData) });
  },

  verifyMfaLogin: (pendingToken, code) =>
    request("/auth/login/verify-mfa", {
      method: "POST",
      body: JSON.stringify({ pendingToken, code }),
    }),

  getMe: () => request("/auth/me"),

  updateProfile: (payload) =>
    request("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

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
      sessionStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken");

    const response = await fetch(`${BASE_URL.replace(/\/$/, "")}/auth/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken ? `Bearer ${authToken}` : "",
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

  getStudentGrades: (studentId) => request(`/grades/${studentId}`),
  getMyGrades: () => request(`/grades/me`),

  getMyPrediction: () => request("/predictions/me"),
  getStudentPrediction: (studentId) => request(`/predictions/${studentId}`),

  getAcademicPerformanceForecasts: ({
    academicYear = "",
    riskLevel = "",
    program = "",
    search = "",
    sync = "true",
  } = {}) => {
    const params = new URLSearchParams();
    if (academicYear) params.set("academicYear", academicYear);
    if (riskLevel) params.set("riskLevel", riskLevel);
    if (program) params.set("program", program);
    if (search) params.set("search", search);
    if (sync) params.set("sync", sync);
    const query = params.toString();
    return request(`/academic-performance/forecasts${query ? `?${query}` : ""}`);
  },

  syncAcademicPerformance: (academicYear) =>
    request("/academic-performance/sync", {
      method: "POST",
      body: JSON.stringify({ academicYear }),
    }),

  createStudentGrade: (grade) =>
    request("/grades", {
      method: "POST",
      body: JSON.stringify(grade),
    }),

  updateStudentGrade: (gradeId, grade) =>
    request(`/grades/${gradeId}`, { method: "PUT", body: JSON.stringify(grade) }),

  deleteStudentGrade: (gradeId) => request(`/grades/${gradeId}`, { method: "DELETE" }),

  deleteAccount: async (userId, token) => {
    const authToken =
      token ||
      sessionStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken");

    const response = await fetch(`${BASE_URL.replace(/\/$/, "")}/auth/users/${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken ? `Bearer ${authToken}` : "",
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
