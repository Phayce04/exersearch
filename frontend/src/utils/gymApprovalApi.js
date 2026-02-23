// src/utils/gymApprovalApi.js
import { api } from "./apiClient";

export async function approveGym(gymId) {
  if (!gymId) throw new Error("gymId is required");
  const res = await api.patch(`/admin/gyms/${gymId}/approve`);
  return res.data;
}

export async function rejectGym(gymId, reason = null) {
  if (!gymId) throw new Error("gymId is required");
  const res = await api.patch(`/admin/gyms/${gymId}/reject`, { reason });
  return res.data;
}