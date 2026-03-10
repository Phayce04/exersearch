// src/utils/gymRatingApi.js
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

/* ------------------------------------------------------------------
 * PUBLIC
 * ------------------------------------------------------------------ */

export async function getGymRatings(gymId, params = {}) {
  try {
    const res = await api.get(`/gyms/${gymId}/ratings`, { params });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load gym ratings."));
  }
}

/* ------------------------------------------------------------------
 * AUTH
 * ------------------------------------------------------------------ */

export async function getMyRatings(params = {}) {
  try {
    const res = await api.get("/me/ratings", { params });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load your ratings."));
  }
}

export async function getCanRateGym(gymId) {
  try {
    const res = await api.get(`/gyms/${gymId}/ratings/can-rate`);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to check if gym can be rated."));
  }
}

export async function upsertMyGymRating(gymId, payload) {
  try {
    const res = await api.post(`/gyms/${gymId}/ratings`, payload);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to submit gym rating."));
  }
}

export async function ownerGetGymRatings(gymId, params = {}) {
  try {
    const res = await api.get(`/owner/gyms/${gymId}/ratings`, { params });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load owner gym ratings."));
  }
}

/* ------------------------------------------------------------------
 * HELPERS
 * ------------------------------------------------------------------ */

export function ratingBadgeMeta(r) {
  const verified = !!r?.verified;
  if (verified) return { label: "Verified", tone: "verified" };

  if (r?.verified_via) return { label: "Verified", tone: "verified" };

  return { label: "Unverified", tone: "unverified" };
}

export function normalizeGymRatingsResponse(data) {
  const summary = data?.summary || {};
  const ratingsPaginated = data?.ratings || {};

  const rows = Array.isArray(ratingsPaginated?.data) ? ratingsPaginated.data : [];

  return {
    summary: {
      public_avg_stars:
        typeof summary.public_avg_stars === "number"
          ? summary.public_avg_stars
          : null,
      verified_count:
        typeof summary.verified_count === "number" ? summary.verified_count : 0,
      unverified_count:
        typeof summary.unverified_count === "number"
          ? summary.unverified_count
          : 0,
      total_count:
        typeof summary.total_count === "number" ? summary.total_count : 0,
      note: summary.note || "",
    },
    ratings: rows,
    pagination: {
      current_page: ratingsPaginated.current_page ?? 1,
      per_page: ratingsPaginated.per_page ?? rows.length,
      last_page: ratingsPaginated.last_page ?? 1,
      total: ratingsPaginated.total ?? rows.length,
      next_page_url: ratingsPaginated.next_page_url ?? null,
      prev_page_url: ratingsPaginated.prev_page_url ?? null,
    },
  };
}