import { api } from "./apiClient";

function cleanParams(params = {}) {
  const out = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === "string" && v.trim() === "") return;
    out[k] = v;
  });
  return out;
}

function extractRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.gyms)) return payload.gyms;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

function getMeta(payload) {
  if (!payload) return {};
  if (payload?.meta) return payload.meta;
  if (payload?.data?.meta) return payload.data.meta;
  return payload;
}

function getLastPage(payload) {
  const meta = getMeta(payload);
  const lp = Number(meta?.last_page ?? meta?.lastPage ?? 1);
  return Number.isFinite(lp) && lp > 0 ? lp : 1;
}

export async function getGym(gymId) {
  const res = await api.get(`/gyms/${gymId}`);
  return res.data;
}

export async function getMyGyms(params = {}) {
  const p = Number(params?.page ?? 1);
  const perPage = Number(params?.per_page ?? params?.perPage ?? 50);

  const res = await api.get(`/my-gyms`, {
    params: cleanParams({
      page: Number.isFinite(p) && p > 0 ? p : 1,
      per_page: Number.isFinite(perPage) && perPage > 0 ? perPage : 50,
      q: params?.q ?? params?.search ?? undefined,
    }),
  });

  return res.data;
}

export async function getAllMyGyms(params = {}) {
  const perPage = Number(params?.per_page ?? params?.perPage ?? 50);
  const safePerPage = Number.isFinite(perPage) && perPage > 0 ? perPage : 50;

  const firstPayload = await getMyGyms({ ...params, per_page: safePerPage, page: 1 });
  const lastPage = getLastPage(firstPayload);

  let merged = [...extractRows(firstPayload)];

  if (lastPage > 1) {
    const promises = [];
    for (let p = 2; p <= lastPage; p++) {
      promises.push(getMyGyms({ ...params, per_page: safePerPage, page: p }));
    }
    const rest = await Promise.all(promises);
    for (const payload of rest) merged.push(...extractRows(payload));
  }

  return merged;
}

export async function updateGym(gymId, payload) {
  const res = await api.patch(`/gyms/${gymId}`, payload);
  return res.data;
}

export async function deleteGym(gymId) {
  const res = await api.delete(`/gyms/${gymId}`);
  return res.data;
}

export async function addGymEquipment(gymId, payload) {
  const res = await api.post(`/gyms/${gymId}/equipments`, payload);
  return res.data;
}

export async function updateGymEquipment(gymId, equipmentId, payload) {
  const res = await api.patch(`/gyms/${gymId}/equipments/${equipmentId}`, payload);
  return res.data;
}

export async function deleteGymEquipment(gymId, equipmentId) {
  const res = await api.delete(`/gyms/${gymId}/equipments/${equipmentId}`);
  return res.data;
}

export async function addGymAmenity(gymId, payload) {
  const res = await api.post(`/gyms/${gymId}/amenities`, payload);
  return res.data;
}

export async function updateGymAmenity(gymId, amenityId, payload) {
  const res = await api.patch(`/gyms/${gymId}/amenities/${amenityId}`, payload);
  return res.data;
}

export async function deleteGymAmenity(gymId, amenityId) {
  const res = await api.delete(`/gyms/${gymId}/amenities/${amenityId}`);
  return res.data;
}

export async function listEquipments() {
  const res = await api.get(`/equipments`);
  return res.data;
}

export async function listAmenities() {
  const res = await api.get(`/amenities`);
  return res.data;
}

export async function getGymAnalytics(gymId) {
  const res = await api.get(`/gyms/${gymId}/analytics`);
  return res.data;
}

export async function uploadMedia({ file, type, kind }) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);
  if (kind) formData.append("kind", kind);

  const res = await api.post(`/media/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
}