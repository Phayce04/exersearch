// src/utils/amenitiesApi.js
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

export async function createAmenity(payload) {
  try {
    const res = await api.post("/amenities", payload);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to create amenity."));
  }
}

export async function updateAmenity(id, payload) {
  try {
    const res = await api.patch(`/amenities/${id}`, payload);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to update amenity."));
  }
}

export async function deleteAmenity(id) {
  try {
    const res = await api.delete(`/amenities/${id}`);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to delete amenity."));
  }
}

export async function importAmenitiesCsv(file) {
  try {
    const form = new FormData();
    form.append("file", file);

    const res = await api.post("/amenities/import-csv", form);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to import amenities CSV."));
  }
}

export async function uploadAmenityImage(file, kind = "covers") {
  try {
    const form = new FormData();
    form.append("file", file);
    form.append("type", "amenities");
    form.append("kind", kind);

    const res = await api.post("/media/upload", form);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to upload amenity image."));
  }
}

export async function listAmenities() {
  try {
    const res = await api.get("/amenities");
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load amenities."));
  }
}

export async function getGymAmenities(gymId) {
  try {
    const res = await api.get(`/gyms/${gymId}/amenities`);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load gym amenities."));
  }
}

export async function attachAmenityToGym(gymId, amenityId, pivot = {}) {
  try {
    const res = await api.post(`/gyms/${gymId}/amenities`, {
      amenity_id: Number(amenityId),
      ...pivot,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to attach amenity to gym."));
  }
}

export async function updateGymAmenityPivot(gymId, amenityId, pivot = {}) {
  try {
    const res = await api.patch(`/gyms/${gymId}/amenities/${amenityId}`, pivot);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to update gym amenity."));
  }
}

export async function detachAmenityFromGym(gymId, amenityId) {
  try {
    const res = await api.delete(`/gyms/${gymId}/amenities/${amenityId}`);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to detach amenity from gym."));
  }
}

function toAmenityId(a) {
  if (a == null) return null;
  if (typeof a === "number") return a;
  if (typeof a === "string") return Number(a);
  if (typeof a === "object") return Number(a.amenity_id ?? a.id);
  return null;
}

function uniqFiniteNums(arr) {
  const out = [];
  const seen = new Set();
  for (const v of arr) {
    const n = Number(v);
    if (!Number.isFinite(n)) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

export async function syncGymAmenitiesByIds(
  gymId,
  nextIds,
  existingAmenities = [],
  defaults = { availability_status: true, notes: null, image_url: null }
) {
  const existingIds = uniqFiniteNums(
    (Array.isArray(existingAmenities) ? existingAmenities : [])
      .map(toAmenityId)
      .filter((v) => v != null)
  );

  const desiredIds = uniqFiniteNums(nextIds || []);

  const toAdd = desiredIds.filter((id) => !existingIds.includes(id));
  const toRemove = existingIds.filter((id) => !desiredIds.includes(id));

  for (const id of toAdd) {
    await attachAmenityToGym(gymId, id, defaults);
  }

  for (const id of toRemove) {
    await detachAmenityFromGym(gymId, id);
  }

  return { added: toAdd, removed: toRemove };
}

export function absoluteUrl(maybeRelativeUrl) {
  if (!maybeRelativeUrl) return "";
  if (/^https?:\/\//i.test(maybeRelativeUrl)) return maybeRelativeUrl;
  return `${API_BASE_URL}${maybeRelativeUrl.startsWith("/") ? "" : "/"}${maybeRelativeUrl}`;
}