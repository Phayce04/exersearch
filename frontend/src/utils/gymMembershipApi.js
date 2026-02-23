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

export async function ownerListGymMembersCombined(gymId, params = {}) {
  if (!gymId) throw new Error("gymId is required");
  const res = await api.get(`/owner/gyms/${gymId}/members/combined`, {
    params: cleanParams(params),
  });
  return res.data;
}

export async function ownerListGymMemberships(gymId, params = {}) {
  if (!gymId) throw new Error("gymId is required");
  const res = await api.get(`/owner/gyms/${gymId}/memberships`, {
    params: cleanParams(params),
  });
  return res.data;
}

export async function ownerActivateMembership(membershipId, payload) {
  if (!membershipId) throw new Error("membershipId is required");
  const res = await api.post(`/owner/memberships/${membershipId}/activate`, payload);
  return res.data;
}

export async function ownerUpdateMembership(membershipId, payload) {
  if (!membershipId) throw new Error("membershipId is required");
  const res = await api.patch(`/owner/memberships/${membershipId}`, payload);
  return res.data;
}

export async function ownerCreateMembership(gymId, payload) {
  if (!gymId) throw new Error("gymId is required");
  const res = await api.post(`/owner/gyms/${gymId}/memberships`, payload);
  return res.data;
}

export async function ownerListManualMembers(gymId, params = {}) {
  if (!gymId) throw new Error("gymId is required");
  const res = await api.get(`/owner/gyms/${gymId}/manual-members`, {
    params: cleanParams(params),
  });
  return res.data;
}

export async function ownerCreateManualMember(gymId, payload) {
  if (!gymId) throw new Error("gymId is required");
  const res = await api.post(`/owner/gyms/${gymId}/manual-members`, payload);
  return res.data;
}

export async function ownerGetManualMember(gymId, manualMemberId) {
  if (!gymId) throw new Error("gymId is required");
  if (!manualMemberId) throw new Error("manualMemberId is required");
  const res = await api.get(`/owner/gyms/${gymId}/manual-members/${manualMemberId}`);
  return res.data;
}

export async function ownerUpdateManualMember(gymId, manualMemberId, payload) {
  if (!gymId) throw new Error("gymId is required");
  if (!manualMemberId) throw new Error("manualMemberId is required");
  const res = await api.patch(
    `/owner/gyms/${gymId}/manual-members/${manualMemberId}`,
    payload
  );
  return res.data;
}

export async function ownerDeleteManualMember(gymId, manualMemberId) {
  if (!gymId) throw new Error("gymId is required");
  if (!manualMemberId) throw new Error("manualMemberId is required");
  const res = await api.delete(
    `/owner/gyms/${gymId}/manual-members/${manualMemberId}`
  );
  return res.data;
}

export async function ownerImportManualMembers(gymId, rows) {
  if (!gymId) throw new Error("gymId is required");
  const res = await api.post(`/owner/gyms/${gymId}/manual-members/import`, { rows });
  return res.data;
}

export const MEMBERSHIP_STATUS = {
  INTENT: "intent",
  ACTIVE: "active",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
  REJECTED: "rejected",
};

export const MEMBER_SOURCE = {
  APP_USER: "app_user",
  MANUAL: "manual",
};

export const OWNER_TABS = [
  { key: MEMBERSHIP_STATUS.INTENT, label: "Intent" },
  { key: MEMBERSHIP_STATUS.ACTIVE, label: "Active" },
  { key: MEMBERSHIP_STATUS.EXPIRED, label: "Expired" },
];

export const OWNER_MEMBER_TABS = [
  { key: "all", label: "All" },
  { key: MEMBERSHIP_STATUS.INTENT, label: "Intent" },
  { key: MEMBERSHIP_STATUS.ACTIVE, label: "Active" },
  { key: MEMBERSHIP_STATUS.EXPIRED, label: "Expired" },
];

export function normalizeMembershipListResponse(resData) {
  if (!resData) return { rows: [], meta: null };

  if (Array.isArray(resData?.data?.data)) {
    return { rows: resData.data.data, meta: resData.data };
  }

  if (Array.isArray(resData?.data)) {
    return { rows: resData.data, meta: { ...resData } };
  }

  if (resData?.memberships && Array.isArray(resData.memberships.data)) {
    return { rows: resData.memberships.data, meta: { ...resData.memberships } };
  }

  if (Array.isArray(resData)) {
    return { rows: resData, meta: null };
  }

  const possible = resData.memberships || resData.items || resData.results;
  if (Array.isArray(possible)) return { rows: possible, meta: null };

  return { rows: [], meta: resData.meta || null };
}

export function normalizeCombinedMembersResponse(resData) {
  if (!resData) return { rows: [], meta: null };

  if (Array.isArray(resData?.data?.data)) {
    return { rows: resData.data.data, meta: resData.data };
  }

  if (Array.isArray(resData?.data)) {
    return { rows: resData.data, meta: { ...resData } };
  }

  if (Array.isArray(resData)) {
    return { rows: resData, meta: null };
  }

  const possible = resData.members || resData.items || resData.results;
  if (Array.isArray(possible)) return { rows: possible, meta: null };

  return { rows: [], meta: resData.meta || null };
}