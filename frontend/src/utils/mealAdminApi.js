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

export async function getAdminMeals(params = {}) {
  try {
    const res = await axios.get(`${API_BASE}/api/v1/admin/meals`, {
      headers: authHeaders(),
      withCredentials: true,
      params,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load meals."));
  }
}

export async function getAdminMeal(id) {
  try {
    const res = await axios.get(`${API_BASE}/api/v1/admin/meals/${id}`, {
      headers: authHeaders(),
      withCredentials: true,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load meal."));
  }
}

export async function createMeal(payload) {
  try {
    const res = await axios.post(`${API_BASE}/api/v1/admin/meals`, payload, {
      headers: authHeaders(),
      withCredentials: true,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to create meal."));
  }
}

export async function updateMeal(id, payload) {
  try {
    const res = await axios.patch(`${API_BASE}/api/v1/admin/meals/${id}`, payload, {
      headers: authHeaders(),
      withCredentials: true,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to update meal."));
  }
}

export async function deleteMeal(id) {
  try {
    const res = await axios.delete(`${API_BASE}/api/v1/admin/meals/${id}`, {
      headers: authHeaders(),
      withCredentials: true,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to delete meal."));
  }
}

export async function toggleMeal(id) {
  try {
    const res = await axios.patch(`${API_BASE}/api/v1/admin/meals/${id}/toggle`, null, {
      headers: authHeaders(),
      withCredentials: true,
    });
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