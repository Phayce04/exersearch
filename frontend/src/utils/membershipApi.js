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

export async function getMyMemberships(params = {}) {
  const res = await api.get("/me/memberships", { params: cleanParams(params) });
  return res.data;
}

export async function createOrUpdateMembershipIntent(gymId, payload = {}) {
  if (!gymId) throw new Error("gymId is required");
  const res = await api.post(`/gyms/${gymId}/membership/intent`, payload);
  return res.data;
}

export async function listApprovedGyms(params = {}) {
  const res = await api.get("/gyms", { params: cleanParams(params) });
  return res.data;
}