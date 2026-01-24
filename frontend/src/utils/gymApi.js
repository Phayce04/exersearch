// src/utils/gymApi.js
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

/* ------------------------------------------------------------------
 * CRUD
 * ------------------------------------------------------------------ */

// CREATE gym
export function createGym(payload) {
  return request(`/api/v1/gyms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// UPDATE gym
export function updateGym(id, payload) {
  return request(`/api/v1/gyms/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// DELETE gym
export function deleteGym(id) {
  return request(`/api/v1/gyms/${id}`, { method: "DELETE" });
}

/* ------------------------------------------------------------------
 * READ
 * ------------------------------------------------------------------ */

export function getGyms(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/api/v1/gyms${qs ? `?${qs}` : ""}`);
}

export function getGym(id) {
  return request(`/api/v1/gyms/${id}`);
}

export function getMyGyms(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/api/v1/my-gyms${qs ? `?${qs}` : ""}`);
}

/* ------------------------------------------------------------------
 * MEDIA UPLOADS (GYMS)
 * ------------------------------------------------------------------ */

export async function uploadGymImage(file, kind = "covers") {
  const token = getTokenMaybe();

  const form = new FormData();
  form.append("type", "gyms"); // ✅ required by MediaUploadController
  form.append("kind", kind); // covers | logos | gallery
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

  const url = data.url || "";
  if (!url) throw new Error("Upload succeeded but no URL was returned.");

  return { url };
}

/* ------------------------------------------------------------------
 * MAP HELPERS
 * ------------------------------------------------------------------ */

// Normalizes map output (Google Maps, Leaflet, etc.)
// Supports:
// - normalizeLatLng(lat, lng)
// - normalizeLatLng({ lat, lng })
// - normalizeLatLng({ latitude, longitude })
// - normalizeLatLng(googleLatLngObject)
export function normalizeLatLng(a, b) {
  const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  // Case 1: called as (lat, lng)
  if (typeof a === "number" || typeof a === "string") {
    const latitude = toNum(a);
    const longitude = toNum(b);
    return { latitude, longitude };
  }

  // Case 2: null/undefined
  if (!a) return { latitude: null, longitude: null };

  // Case 3: Google Maps LatLng object
  if (typeof a.lat === "function" && typeof a.lng === "function") {
    return {
      latitude: toNum(a.lat()),
      longitude: toNum(a.lng()),
    };
  }

  // Case 4: plain objects
  if (typeof a === "object") {
    if ("lat" in a && "lng" in a) {
      return { latitude: toNum(a.lat), longitude: toNum(a.lng) };
    }
    if ("latitude" in a && "longitude" in a) {
      return { latitude: toNum(a.latitude), longitude: toNum(a.longitude) };
    }
  }

  return { latitude: null, longitude: null };
}

/* ------------------------------------------------------------------
 * URL UTILS
 * ------------------------------------------------------------------ */

export function absoluteUrl(maybeRelativeUrl) {
  if (!maybeRelativeUrl) return "";
  if (/^https?:\/\//i.test(maybeRelativeUrl)) return maybeRelativeUrl;
  return `${API}${maybeRelativeUrl.startsWith("/") ? "" : "/"}${maybeRelativeUrl}`;
}

export const API_BASE_URL = API;
