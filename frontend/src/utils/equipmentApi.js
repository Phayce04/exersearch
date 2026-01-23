// src/utils/equipmentApi.js
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

export function createEquipment(payload) {
  return request(`/api/v1/equipments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateEquipment(id, payload) {
  return request(`/api/v1/equipments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteEquipment(id) {
  return request(`/api/v1/equipments/${id}`, { method: "DELETE" });
}

export function importEquipmentsCsv(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/api/v1/equipments/import-csv", { method: "POST", body: form });
}

// Uploads to /storage/equipments/<kind>/...
export async function uploadEquipmentImage(file, kind = "covers") {
  const token = getTokenMaybe();

  const form = new FormData();
  form.append("type", "equipments"); // ✅ required by MediaUploadController
  form.append("kind", kind);         // covers | logos | gallery
  form.append("file", file);

  const res = await fetch(`${API}/api/v1/media/upload`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });

  const data = await safeJson(res);

  if (!res.ok) {
    throw new Error(data?.message || `Upload failed (HTTP ${res.status})`);
  }

  // controller returns { url: "/storage/..." }
  const url = data.url || "";
  if (!url) throw new Error("Upload succeeded but no URL was returned.");
  return { url };
}

export function absoluteUrl(maybeRelativeUrl) {
  if (!maybeRelativeUrl) return "";
  if (/^https?:\/\//i.test(maybeRelativeUrl)) return maybeRelativeUrl;
  return `${API}${maybeRelativeUrl.startsWith("/") ? "" : "/"}${maybeRelativeUrl}`;
}

export const API_BASE_URL = API;
