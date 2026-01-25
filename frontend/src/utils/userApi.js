// src/utils/adminUserApi.js
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

/* ============================
   ADMIN USERS
============================ */

// GET /api/v1/admin/users?page=1
export function getAdminUsers(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/api/v1/admin/users${qs ? `?${qs}` : ""}`);
}

// GET /api/v1/admin/users/{id}
export function getAdminUser(id) {
  return request(`/api/v1/admin/users/${id}`);
}

// GET /api/v1/admin/users/{id}/preferences
export function getAdminUserPreferences(id) {
  return request(`/api/v1/admin/users/${id}/preferences`);
}

// PUT /api/v1/admin/users/{id}/preferences
export function updateAdminUserPreferences(id, payload) {
  return request(`/api/v1/admin/users/${id}/preferences`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/* ============================
   ADMIN OWNERS
============================ */

// GET /api/v1/admin/owners/{id}/gyms
export function getAdminOwnerGyms(id) {
  return request(`/api/v1/admin/owners/${id}/gyms`);
}

/* ============================
   HELPERS
============================ */

export function absoluteUrl(maybeRelativeUrl) {
  if (!maybeRelativeUrl) return "";
  if (/^https?:\/\//i.test(maybeRelativeUrl)) return maybeRelativeUrl;
  return `${API}${maybeRelativeUrl.startsWith("/") ? "" : "/"}${maybeRelativeUrl}`;
}

export const API_BASE_URL = API;
