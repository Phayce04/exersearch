// src/utils/gymApi.js
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

/* ------------------------------------------------------------------
 * CRUD
 * ------------------------------------------------------------------ */

// CREATE gym
export async function createGym(payload) {
  try {
    const res = await api.post("/gyms", payload);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to create gym."));
  }
}

// UPDATE gym
export async function updateGym(id, payload) {
  try {
    const res = await api.patch(`/gyms/${id}`, payload);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to update gym."));
  }
}

// DELETE gym
export async function deleteGym(id) {
  try {
    const res = await api.delete(`/gyms/${id}`);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to delete gym."));
  }
}

/* ------------------------------------------------------------------
 * READ
 * ------------------------------------------------------------------ */

export async function getGyms(params = {}) {
  try {
    const res = await api.get("/gyms", { params });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load gyms."));
  }
}

export async function getGym(id) {
  try {
    const res = await api.get(`/gyms/${id}`);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load gym."));
  }
}

export async function getMyGyms(params = {}) {
  try {
    const res = await api.get("/my-gyms", { params });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load your gyms."));
  }
}

/* ------------------------------------------------------------------
 * MEDIA UPLOADS (GYMS)
 * ------------------------------------------------------------------ */

export async function uploadGymImage(file, kind = "covers") {
  try {
    const form = new FormData();
    form.append("type", "gyms");
    form.append("kind", kind);
    form.append("file", file);

    const res = await api.post("/media/upload", form);
    const data = res.data;

    const url = data?.url || "";
    if (!url) throw new Error("Upload succeeded but no URL was returned.");

    return { url };
  } catch (e) {
    throw new Error(apiError(e, "Failed to upload gym image."));
  }
}

/* ------------------------------------------------------------------
 * MAP HELPERS
 * ------------------------------------------------------------------ */

export function normalizeLatLng(a, b) {
  const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  if (typeof a === "number" || typeof a === "string") {
    const latitude = toNum(a);
    const longitude = toNum(b);
    return { latitude, longitude };
  }

  if (!a) return { latitude: null, longitude: null };

  if (typeof a.lat === "function" && typeof a.lng === "function") {
    return {
      latitude: toNum(a.lat()),
      longitude: toNum(a.lng()),
    };
  }

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
  return `${API_BASE_URL}${maybeRelativeUrl.startsWith("/") ? "" : "/"}${maybeRelativeUrl}`;
}