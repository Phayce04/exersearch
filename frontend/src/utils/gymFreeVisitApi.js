// src/utils/gymFreeVisitApi.js
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

/* ============================= */
/* ========== USER ============= */
/* ============================= */

export async function claimFreeVisit(gymId) {
  if (gymId == null) throw new Error("gymId is required");

  try {
    const res = await api.post(`/gyms/${gymId}/free-visit/claim`);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to claim free visit."));
  }
}

export async function getMyFreeVisits({ page = 1, perPage = 20 } = {}) {
  try {
    const res = await api.get("/me/free-visits", {
      params: { page, per_page: perPage },
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load free visits."));
  }
}

/* Helper: always safely extract rows */

export function normalizeFreeVisitList(response) {
  if (!response) return [];

  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;

  return [];
}

export function findMyFreeVisitForGym(response, gymId) {
  const rows = normalizeFreeVisitList(response);

  return rows.find((r) => String(r?.gym_id) === String(gymId)) || null;
}

/* ============================= */
/* ========== OWNER ============ */
/* ============================= */

export async function ownerListFreeVisits(
  gymId,
  { status, q, page = 1, perPage = 20 } = {}
) {
  if (gymId == null) throw new Error("gymId is required");

  try {
    const res = await api.get(`/owner/gyms/${gymId}/free-visits`, {
      params: {
        status,
        q,
        page,
        per_page: perPage,
      },
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load owner free visits."));
  }
}

export async function ownerMarkFreeVisitUsed(freeVisitId) {
  if (freeVisitId == null) throw new Error("freeVisitId is required");

  try {
    const res = await api.post(`/owner/free-visits/${freeVisitId}/use`);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to mark free visit used."));
  }
}

export async function ownerSetFreeVisitEnabled(gymId, enabled) {
  if (gymId == null) throw new Error("gymId is required");

  try {
    const res = await api.patch(`/owner/gyms/${gymId}/free-visit-enabled`, {
      enabled: Boolean(enabled),
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to update free visit setting."));
  }
}