import { api } from "./apiClient";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://exersearch.test";

function apiError(e, fallback = "Request failed.") {
  return (
    e?.response?.data?.message ||
    (e?.response?.data ? JSON.stringify(e.response.data, null, 2) : null) ||
    e?.message ||
    fallback
  );
}

export async function getAdminMeals(params = {}) {
  try {
    const res = await api.get("/admin/meals", { params });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load meals."));
  }
}

export async function getAdminMeal(id) {
  try {
    const res = await api.get(`/admin/meals/${id}`);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load meal."));
  }
}

export async function createMeal(payload) {
  try {
    const res = await api.post("/admin/meals", payload);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to create meal."));
  }
}

export async function updateMeal(id, payload) {
  try {
    const res = await api.patch(`/admin/meals/${id}`, payload);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to update meal."));
  }
}

export async function deleteMeal(id) {
  try {
    const res = await api.delete(`/admin/meals/${id}`);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to delete meal."));
  }
}

export async function toggleMeal(id) {
  try {
    const res = await api.patch(`/admin/meals/${id}/toggle`);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to toggle meal."));
  }
}

export function absoluteUrl(maybeRelativeUrl) {
  if (!maybeRelativeUrl) return "";
  if (/^https?:\/\//i.test(maybeRelativeUrl)) return maybeRelativeUrl;
  return `${API_BASE}${maybeRelativeUrl.startsWith("/") ? "" : "/"}${maybeRelativeUrl}`;
}

export const API_BASE_URL = API_BASE;