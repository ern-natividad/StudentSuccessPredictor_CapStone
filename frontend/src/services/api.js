import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

const PREDICTION_CACHE_TTL_MS = 30_000;
const MAX_CACHED_PREDICTIONS = 5_000;
const DASHBOARD_DATA_INVALIDATED_EVENT = "hawk:dashboard-data-invalidated";
const studentPredictionCache = new Map();
const inFlightPredictionRequests = new Map();
let predictionCacheToken = null;
let predictionCacheSession = 0;
let dashboardDataRevision = 0;

const clearStudentPredictionCache = () => {
  studentPredictionCache.clear();
  inFlightPredictionRequests.clear();
};

export const invalidateStudentPredictionCache = (userIds) => {
  if (Array.isArray(userIds) && userIds.length > 0) {
    userIds.forEach((userId) => studentPredictionCache.delete(userId));
  } else {
    clearStudentPredictionCache();
  }

  dashboardDataRevision += 1;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(DASHBOARD_DATA_INVALIDATED_EVENT));
  }
};

export const getDashboardDataRevision = () => dashboardDataRevision;
export const getDashboardDataInvalidatedEvent = () =>
  DASHBOARD_DATA_INVALIDATED_EVENT;

const shouldInvalidateDashboardData = (path, method) => {
  if (method === "GET") return false;
  return (
    /^\/grades(?:\/|$)/.test(path) ||
    path === "/academic-performance/sync" ||
    /^\/predictions\/[^/]+\/forecast$/.test(path) ||
    path === "/students/import" ||
    path === "/adviser-assignments"
  );
};

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
  const method = String(options.method || "GET").toUpperCase();
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
    const error = new Error(
      data.error || "Something went wrong. Please try again.",
    );
    error.status = response.status;
    throw error;
  }

  if (shouldInvalidateDashboardData(path, method)) {
    invalidateStudentPredictionCache();
  }

  return data;
};

export const api = {
  login: (email, password, role) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    }),

  signup: (userData) => {
    console.log("api.js -> signup -> year_level:", userData.year_level);
    return request("/auth/signup", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  verifyMfaLogin: (pendingToken, code) =>
    request("/auth/login/verify-mfa", {
      method: "POST",
      body: JSON.stringify({ pendingToken, code }),
    }),

  getMe: () => request("/auth/me"),

  getAdviserAssignments: async () => {
    const data = await request("/adviser-assignments");
    return data.assignments || [];
  },

  saveAdviserAssignmentGroup: (payload) =>
    request("/adviser-assignments", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  updateProfile: (payload) =>
    request("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  changePassword: (currentPassword, newPassword) =>
    request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
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

  recommendProgram: (payload) =>
    request("/v1/recommendations/program", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getNextProgramApplicantId: () =>
    request("/v1/recommendations/next-applicant-id"),

  getProgramRecommendationHistory: (limit = 500) =>
    request(`/v1/recommendations/history?limit=${limit}`),

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
      const errorMsg =
        data?.error || `Failed to load users (${response.status})`;
      throw new Error(errorMsg);
    }

    return data || [];
  },

  getStudentGrades: (studentId) => request(`/grades/${studentId}`),
  getEligibleGradeSubjects: (studentId, semester, yearLevel) => {
    const params = new URLSearchParams({ semester, year_level: yearLevel });
    return request(
      `/grades/${encodeURIComponent(studentId)}/eligible-subjects?${params}`,
    );
  },
  getMyGrades: () => request(`/grades/me`),

  previewStudentAccounts: (students) =>
    request("/students/import/preview", {
      method: "POST",
      body: JSON.stringify({ students }),
    }),

  importStudentAccounts: (students) =>
    request("/students/import", {
      method: "POST",
      body: JSON.stringify({ students }),
    }),

  getMyPrediction: () => request("/predictions/me"),
  getStudentPrediction: (studentId) => request(`/predictions/${studentId}`),
  generateStudentPythonForecast: (studentId) =>
    request(`/predictions/${encodeURIComponent(studentId)}/forecast`, {
      method: "POST",
    }),
  getStudentPredictions: async (userIds) => {
    const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
    if (uniqueUserIds.length === 0) return { predictions: [] };

    const token = sessionStorage.getItem("authToken") || "";
    if (token !== predictionCacheToken) {
      clearStudentPredictionCache();
      predictionCacheToken = token;
      predictionCacheSession += 1;
    }

    const session = predictionCacheSession;
    const now = Date.now();
    const resultByUserId = new Map();
    const missingIds = [];

    uniqueUserIds.forEach((userId) => {
      const cached = studentPredictionCache.get(userId);
      if (cached?.expiresAt > now) {
        resultByUserId.set(userId, cached.result);
        studentPredictionCache.delete(userId);
        studentPredictionCache.set(userId, cached);
      } else {
        studentPredictionCache.delete(userId);
        missingIds.push(userId);
      }
    });

    const batches = [];
    for (let start = 0; start < missingIds.length; start += 5000) {
      batches.push(missingIds.slice(start, start + 5000));
    }

    const responses = await Promise.all(
      batches.map((batch) => {
        const requestKey = batch.slice().sort().join(",");
        const existingRequest = inFlightPredictionRequests.get(requestKey);
        if (existingRequest) return existingRequest;

        const batchRequest = request("/predictions/bulk", {
          method: "POST",
          body: JSON.stringify({ user_ids: batch }),
        })
          .then((response) => {
            const results = response.predictions || [];
            if (session === predictionCacheSession) {
              results.forEach((result) => {
                if (!result?.user_id) return;
                studentPredictionCache.set(result.user_id, {
                  result,
                  expiresAt: Date.now() + PREDICTION_CACHE_TTL_MS,
                });
              });
              while (studentPredictionCache.size > MAX_CACHED_PREDICTIONS) {
                const oldestId = studentPredictionCache.keys().next().value;
                studentPredictionCache.delete(oldestId);
              }
            }
            return results;
          })
          .finally(() => {
            if (inFlightPredictionRequests.get(requestKey) === batchRequest) {
              inFlightPredictionRequests.delete(requestKey);
            }
          });

        inFlightPredictionRequests.set(requestKey, batchRequest);
        return batchRequest;
      }),
    );

    responses.flat().forEach((result) => {
      if (result?.user_id) resultByUserId.set(result.user_id, result);
    });

    return {
      predictions: uniqueUserIds
        .map((userId) => resultByUserId.get(userId))
        .filter(Boolean),
    };
  },
  getPredictionModelInfo: () => request("/predictions/models"),

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
    return request(
      `/academic-performance/forecasts${query ? `?${query}` : ""}`,
    );
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

  createStudentGradesBulk: (payload) =>
    request("/grades/bulk", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  importStudentGrades: (grades) =>
    request("/grades/import", {
      method: "POST",
      body: JSON.stringify({ grades }),
    }),

  updateStudentGrade: (gradeId, grade) =>
    request(`/grades/${gradeId}`, {
      method: "PUT",
      body: JSON.stringify(grade),
    }),

  deleteStudentGrade: (gradeId) =>
    request(`/grades/${gradeId}`, { method: "DELETE" }),

  getAlertInterventions: (includeResolved = false) =>
    request(
      `/alerts/interventions${includeResolved ? "?includeResolved=true" : ""}`,
    ),

  escalateAlert: (payload) =>
    request("/alerts/escalate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  acknowledgeAlertIntervention: (interventionId) =>
    request(`/alerts/${interventionId}/acknowledge`, { method: "POST" }),

  cancelAlertIntervention: (interventionId) =>
    request(`/alerts/${interventionId}/cancel`, { method: "POST" }),

  reopenAlertIntervention: (interventionId, payload = {}) =>
    request(`/alerts/${interventionId}/reopen`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  revertAlertInterventionToAcknowledged: (interventionId, payload = {}) =>
    request(`/alerts/${interventionId}/revert-acknowledged`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateAlertInterventionProgress: (interventionId, payload) =>
    request(`/alerts/${interventionId}/progress`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  getAdminAlertNotifications: (unreadOnly = false) =>
    request(`/alerts/notifications${unreadOnly ? "?unreadOnly=true" : ""}`),

  markAdminAlertNotificationsRead: (payload = { all: true }) =>
    request("/alerts/notifications/mark-read", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getActiveAnnouncements: (limit = 5) =>
    request(`/announcements/active?limit=${encodeURIComponent(limit)}`),

  getAnnouncements: () => request("/announcements"),

  listCourseCatalog: () => request("/course-catalog"),

  createCourseCatalogEntry: (payload) =>
    request("/course-catalog", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateCourseCatalogEntry: (id, payload) =>
    request(`/course-catalog/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  archiveCourseCatalogEntry: (id) =>
    request(`/course-catalog/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  createAnnouncement: (payload) =>
    request("/announcements", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateAnnouncement: (id, payload) =>
    request(`/announcements/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteAnnouncement: (id) =>
    request(`/announcements/${id}`, { method: "DELETE" }),

  deleteAccount: async (userId, token) => {
    const authToken =
      token ||
      sessionStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken");

    const response = await fetch(
      `${BASE_URL.replace(/\/$/, "")}/auth/users/${userId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken ? `Bearer ${authToken}` : "",
        },
      },
    );

    const contentType = response.headers.get("content-type");
    let data = null;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    }

    if (!response.ok) {
      const errorMsg =
        data?.error || `Failed to delete account (${response.status})`;
      throw new Error(errorMsg);
    }

    return data;
  },
};

export const isBackendAuthEnabled = () =>
  String(import.meta.env.VITE_USE_BACKEND_AUTH).toLowerCase() === "true";
