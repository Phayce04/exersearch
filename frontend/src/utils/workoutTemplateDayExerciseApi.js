// src/utils/workoutTemplateDayExerciseApi.js
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

export function createTemplateDayExercise(payload) {
  // POST /api/v1/workout-template-day-exercises
  return request(`/api/v1/workout-template-day-exercises`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateTemplateDayExercise(id, payload) {
  // PUT /api/v1/workout-template-day-exercises/{id}
  return request(`/api/v1/workout-template-day-exercises/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteTemplateDayExercise(id) {
  return request(`/api/v1/workout-template-day-exercises/${id}`, { method: "DELETE" });
}

export const API_BASE_URL = API;
