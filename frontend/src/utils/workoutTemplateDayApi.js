// src/utils/workoutTemplateDayApi.js
const API = "https://exersearch.test";
const TOKEN_KEY = "token";

export function getTokenMaybe() {
  return localStorage.getItem(TOKEN_KEY) || "";
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

export function createTemplateDay(payload) {
  // POST /api/v1/workout-template-days
  return request(`/api/v1/workout-template-days`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateTemplateDay(id, payload) {
  // PUT /api/v1/workout-template-days/{id}
  return request(`/api/v1/workout-template-days/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteTemplateDay(id) {
  return request(`/api/v1/workout-template-days/${id}`, { method: "DELETE" });
}

/* ------------------------------------------------------------------
 * READ (we'll just use useApiList to GET /workout-templates and show nested)
 * If you want later: create an index endpoint for days.
 * ------------------------------------------------------------------ */

export const API_BASE_URL = API;
