import { api } from "./apiClient";

export async function getAdminSettings() {
  const res = await api.get("/admin/settings");
  return res.data?.data ?? res.data;
}

export async function updateAdminSettings(payload) {
  const res = await api.put("/admin/settings", payload);
  return res.data?.data ?? res.data;
}