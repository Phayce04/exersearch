// src/utils/exerciseApi.js
import { api } from "./apiClient";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://exersearch.test";

function apiError(e, fallback = "Request failed.") {
  return (
    e?.response?.data?.message ||
    (e?.response?.data ? JSON.stringify(e.response.data, null, 2) : null) ||
    e?.message ||
    fallback
  );
}

export async function getExercises(params = {}) {
  try {
    const res = await api.get("/exercises", { params });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load exercises."));
  }
}

export async function getExercise(id) {
  try {
    const res = await api.get(`/exercises/${id}`);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load exercise."));
  }
}

export async function createExercise(payload) {
  try {
    const res = await api.post("/exercises", payload);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to create exercise."));
  }
}

export async function updateExercise(id, payload) {
  try {
    const res = await api.patch(`/exercises/${id}`, payload);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to update exercise."));
  }
}

export async function deleteExercise(id) {
  try {
    const res = await api.delete(`/exercises/${id}`);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to delete exercise."));
  }
}

export function absoluteUrl(maybeRelativeUrl) {
  if (!maybeRelativeUrl) return "";
  if (/^https?:\/\//i.test(maybeRelativeUrl)) return maybeRelativeUrl;
  return `${API_BASE_URL}${maybeRelativeUrl.startsWith("/") ? "" : "/"}${maybeRelativeUrl}`;
}