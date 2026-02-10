// src/utils/adminAdminsApi.js
const API = import.meta.env.VITE_API_BASE_URL || "https://exersearch.test";

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
  if (!res.ok) throw new Error(data?.message || `Request failed (HTTP ${res.status})`);
  return data;
}

/* ============================
   ADMIN ADMINS
============================ */

// GET /api/v1/admin/admins
export function getAdminAdmins(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/api/v1/admin/admins${qs ? `?${qs}` : ""}`);
}

// POST /api/v1/admin/admins
export function createAdminUser(payload) {
  return request(`/api/v1/admin/admins`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// PUT /api/v1/admin/admins/{id}
export function updateAdminUser(userId, payload) {
  return request(`/api/v1/admin/admins/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// DELETE /api/v1/admin/admins/{id}
export function deleteAdminUser(userId) {
  return request(`/api/v1/admin/admins/${userId}`, { method: "DELETE" });
}

// POST /api/v1/admin/admins/{id}/avatar
export async function uploadAdminAvatar(userId, file) {
  const token = getTokenMaybe();
  const url = `${API}/api/v1/admin/admins/${userId}/avatar`;

  const fd = new FormData();
  fd.append("photo", file);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: fd,
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || `Upload failed (HTTP ${res.status})`);
  return data; // { avatar_url: "/storage/..." }
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
