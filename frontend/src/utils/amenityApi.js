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

export async function uploadAmenityImage(file, kind = "covers") {
  const token = getTokenMaybe();

  const form = new FormData();
  form.append("file", file);
  form.append("type", "amenities");
  form.append("kind", kind);

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

  return data;
}

export function listAmenities() {
  return request("/api/v1/amenities", { method: "GET" });
}

export function getGymAmenities(gymId) {
  return request(`/api/v1/gyms/${gymId}/amenities`, { method: "GET" });
}

export function attachAmenityToGym(gymId, amenityId, pivot = {}) {
  return request(`/api/v1/gyms/${gymId}/amenities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amenity_id: Number(amenityId),
      ...pivot,
    }),
  });
}

export function updateGymAmenityPivot(gymId, amenityId, pivot = {}) {
  return request(`/api/v1/gyms/${gymId}/amenities/${amenityId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pivot),
  });
}

export function detachAmenityFromGym(gymId, amenityId) {
  return request(`/api/v1/gyms/${gymId}/amenities/${amenityId}`, {
    method: "DELETE",
  });
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
  return `${API}${maybeRelativeUrl.startsWith("/") ? "" : "/"}${maybeRelativeUrl}`;
}