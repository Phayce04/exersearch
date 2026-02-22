import { api } from "./apiClient";

export async function getGym(gymId) {
  const res = await api.get(`/gyms/${gymId}`);
  return res.data;
}

export async function getMyGyms(page = 1) {
  const res = await api.get(`/my-gyms?page=${page}`);
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