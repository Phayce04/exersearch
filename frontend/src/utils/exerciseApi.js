// src/utils/exerciseApi.js
import axios from "axios";

const API_BASE = "https://exersearch.test";
const TOKEN_KEY = "token";

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function apiError(e, fallback = "Request failed.") {
  return (
    e?.response?.data?.message ||
    (e?.response?.data ? JSON.stringify(e.response.data, null, 2) : null) ||
    e?.message ||
    fallback
  );
}

/* ------------------------------------------------------------------
 * READ
 * ------------------------------------------------------------------ */

export async function getExercises(params = {}) {
  try {
    const res = await axios.get(`${API_BASE}/api/v1/exercises`, {
      headers: authHeaders(),
      withCredentials: true,
      params,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load exercises."));
  }
}

export async function getExercise(id) {
  try {
    const res = await axios.get(`${API_BASE}/api/v1/exercises/${id}`, {
      headers: authHeaders(),
      withCredentials: true,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load exercise."));
  }
}

/* ------------------------------------------------------------------
 * CRUD
 * ------------------------------------------------------------------ */

export async function createExercise(payload) {
  try {
    const res = await axios.post(`${API_BASE}/api/v1/exercises`, payload, {
      headers: { ...authHeaders() },
      withCredentials: true,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to create exercise."));
  }
}

// ✅ You used PATCH in gymApi, so we keep PATCH here too.
// If your Laravel controller uses PUT, tell me and we switch.
export async function updateExercise(id, payload) {
  try {
    const res = await axios.patch(`${API_BASE}/api/v1/exercises/${id}`, payload, {
      headers: { ...authHeaders() },
      withCredentials: true,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to update exercise."));
  }
}

export async function deleteExercise(id) {
  try {
    const res = await axios.delete(`${API_BASE}/api/v1/exercises/${id}`, {
      headers: authHeaders(),
      withCredentials: true,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to delete exercise."));
  }
}

/* ------------------------------------------------------------------
 * URL UTILS (optional)
 * ------------------------------------------------------------------ */

export function absoluteUrl(maybeRelativeUrl) {
  if (!maybeRelativeUrl) return "";
  if (/^https?:\/\//i.test(maybeRelativeUrl)) return maybeRelativeUrl;
  return `${API_BASE}${maybeRelativeUrl.startsWith("/") ? "" : "/"}${maybeRelativeUrl}`;
}

export const API_BASE_URL = API_BASE;
