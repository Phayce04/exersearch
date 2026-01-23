// src/utils/amenityApi.js
const API = "https://exersearch.test";

export const API_BASE_URL = API;

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

// CRUD
export function createAmenity(payload) {
  return request("/api/v1/amenities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateAmenity(id, payload) {
  return request(`/api/v1/amenities/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteAmenity(id) {
  return request(`/api/v1/amenities/${id}`, { method: "DELETE" });
}

export function importAmenitiesCsv(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/api/v1/amenities/import-csv", { method: "POST", body: form });
}

// ✅ Media upload (sends required `type`)
export async function uploadAmenityImage(file, kind = "covers") {
  const token = getTokenMaybe();

  const form = new FormData();
  form.append("file", file);
  form.append("type", "amenities"); // ✅ REQUIRED by backend
  form.append("kind", kind);        // optional

  const res = await fetch(`${API}/api/v1/media/upload`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // ❌ don't set Content-Type for FormData
    },
    body: form,
  });

  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(data?.message || `Upload failed (HTTP ${res.status})`);
  }

  // returns { message: "Uploaded", url: "/storage/amenities/covers/xxx.webp" }
  return data;
}

// URL helper
export function absoluteUrl(maybeRelativeUrl) {
  if (!maybeRelativeUrl) return "";
  if (/^https?:\/\//i.test(maybeRelativeUrl)) return maybeRelativeUrl;
  return `${API}${maybeRelativeUrl.startsWith("/") ? "" : "/"}${maybeRelativeUrl}`;
}
