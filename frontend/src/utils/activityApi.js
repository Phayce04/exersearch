// src/utils/activityApi.js
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
 * READ (ADMIN)
 * ------------------------------------------------------------------ */

/**
 * GET /api/v1/admin/activities
 * params:
 *  - q: string
 *  - event: string (view|click|save|contact|visit|subscribe)
 *  - source: string
 *  - days: number (1|7|30|90|365)
 *  - limit: number (max 5000 in controller)
 */
export async function getAdminActivities(params = {}) {
  try {
    const res = await axios.get(`${API_BASE}/api/v1/admin/activities`, {
      headers: authHeaders(),
      withCredentials: true,
      params,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load activities."));
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