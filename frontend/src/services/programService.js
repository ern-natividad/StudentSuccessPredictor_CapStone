const getBaseUrl = () =>
  (import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api").replace(
    /\/$/,
    "",
  );

const authHeaders = () => {
  const token = sessionStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const requestPrograms = async (path = "", options = {}) => {
  const response = await fetch(`${getBaseUrl()}/programs${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Unable to process program request.");
  }
  return data;
};

export const listPrograms = async ({ includeInactive = false } = {}) => {
  const query = includeInactive ? "?includeInactive=true" : "";
  const data = await requestPrograms(query);
  return data.programs || [];
};

export const createProgram = async ({ name, code }) => {
  const data = await requestPrograms("", {
    method: "POST",
    body: JSON.stringify({ name, code }),
  });
  return data.program;
};

export const updateProgram = async (id, payload) => {
  const data = await requestPrograms(`/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return data.program;
};

export const deleteProgram = async (id) => {
  await requestPrograms(`/${id}`, { method: "DELETE" });
  return true;
};
