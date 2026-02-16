// src/utils/workoutTemplateApi.js
const API = "https://exersearch.test";

export function getTokenMaybe() {
  return localStorage.getItem("token") || "";
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

async function request(path, options = {}) {
  const token = getTokenMaybe();
  const url = `${API}${path.startsWith("/") ? "" : "/"}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await safeJson(res);

  if (!res.ok) {
    throw new Error(data?.message || `Request failed (HTTP ${res.status})`);
  }

  return data;
}

/* ------------------------------------------------------------------
 * CRUD (ADMIN)
 * ------------------------------------------------------------------ */

export function createWorkoutTemplate(payload) {
  return request(`/api/v1/workout-templates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateWorkoutTemplate(id, payload) {
  return request(`/api/v1/workout-templates/${id}`, {
    method: "PATCH", // backend supports PUT+PATCH now
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteWorkoutTemplate(id) {
  return request(`/api/v1/workout-templates/${id}`, { method: "DELETE" });
}

/* ------------------------------------------------------------------
 * READ (optional helpers)
 * ------------------------------------------------------------------ */

export function getWorkoutTemplates(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/api/v1/workout-templates${qs ? `?${qs}` : ""}`);
}

export function getWorkoutTemplate(id) {
  return request(`/api/v1/workout-templates/${id}`);
}

export const API_BASE_URL = API;
