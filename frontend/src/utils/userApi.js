import { api } from "./apiClient";

const API = import.meta.env.VITE_API_BASE_URL || "https://exersearch.test";

export async function getAdminUsers(params = {}) {
  const res = await api.get("/admin/users", { params });
  return res.data;
}

export async function getAdminUser(id) {
  const res = await api.get(`/admin/users/${id}`);
  return res.data;
}

export async function getAdminUserPreferences(id) {
  const res = await api.get(`/admin/users/${id}/preferences`);
  return res.data;
}

export async function updateAdminUserPreferences(id, payload) {
  const res = await api.put(`/admin/users/${id}/preferences`, payload);
  return res.data;
}

export async function getAdminOwnerGyms(id) {
  const res = await api.get(`/admin/owners/${id}/gyms`);
  return res.data;
}

export function absoluteUrl(maybeRelativeUrl) {
  if (!maybeRelativeUrl) return "";
  if (/^https?:\/\//i.test(maybeRelativeUrl)) return maybeRelativeUrl;
  return `${API}${maybeRelativeUrl.startsWith("/") ? "" : "/"}${maybeRelativeUrl}`;
}

export const API_BASE_URL = API;