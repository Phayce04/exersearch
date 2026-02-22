import { api } from "./apiClient";

export async function getMe() {
  const res = await api.get("/me");
  return res.data;
}

export async function getMyGyms() {
  const res = await api.get("/my-gyms");
  return res.data;
}

export async function getGymAnalytics(gymId) {
  const res = await api.get(`/gyms/${gymId}/analytics`);
  return res.data;
}

export async function getOwnerActivities() {
  const res = await api.get("/owner/activities");
  return res.data;
}