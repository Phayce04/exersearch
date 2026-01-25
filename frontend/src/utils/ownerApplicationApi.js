// src/utils/ownerApplicationApi.js
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

/* ======================================================
   ADMIN — OWNER APPLICATIONS
   ====================================================== */


export function getOwnerApplications(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(
    `/api/v1/admin/owner-applications${query ? `?${query}` : ""}`
  );
}


export function getOwnerApplication(id) {
  return request(`/api/v1/admin/owner-applications/${id}`);
}

export function approveOwnerApplication(id) {
  return request(`/api/v1/admin/owner-applications/${id}/approve`, {
    method: "PATCH",
  });
}


export function rejectOwnerApplication(id, reason = null) {
  return request(`/api/v1/admin/owner-applications/${id}/reject`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reason ? { reason } : {}),
  });
}

/* ======================================================
   USER — OWNER APPLICATION 
   ====================================================== */


export function submitOwnerApplication(payload) {
  return request(`/api/v1/owner-applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function getMyOwnerApplication() {
  return request(`/api/v1/owner-applications/me`);
}
