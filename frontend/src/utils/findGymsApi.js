// src/utils/findGymsApi.js
import { api } from "./apiClient";

function apiError(e, fallback = "Request failed.") {
  return (
    e?.response?.data?.message ||
    e?.response?.data?.error ||
    (e?.response?.data ? JSON.stringify(e.response.data, null, 2) : null) ||
    e?.message ||
    fallback
  );
}

// -------------------------
// GET: existing user picks
// -------------------------

export async function getUserPreference() {
  try {
    const res = await api.get("/user/preferences");
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load user preferences."));
  }
}

export async function getUserPreferredEquipments() {
  try {
    const res = await api.get("/user/preferred-equipments");
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load preferred equipments."));
  }
}

export async function getUserPreferredAmenities() {
  try {
    const res = await api.get("/user/preferred-amenities");
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load preferred amenities."));
  }
}

export async function getUserProfile() {
  try {
    const res = await api.get("/user/profile");
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load user profile."));
  }
}

// -------------------------
// SAVE: preferences (POST)
// -------------------------

export async function saveUserPreferences(fields = {}) {
  const payload = {};

  if (fields.goal !== undefined && fields.goal !== null && fields.goal !== "") {
    payload.goal = fields.goal;
  }

  if (
    fields.activity_level !== undefined &&
    fields.activity_level !== null &&
    fields.activity_level !== ""
  ) {
    payload.activity_level = fields.activity_level;
  }

  if (
    fields.budget !== undefined &&
    fields.budget !== null &&
    fields.budget !== ""
  ) {
    payload.budget = fields.budget;
  }

  if (
    fields.plan_type !== undefined &&
    fields.plan_type !== null &&
    fields.plan_type !== ""
  ) {
    payload.plan_type = fields.plan_type;
  }

  try {
    const res = await api.post("/user/preferences", payload);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to save user preferences."));
  }
}

export async function savePreferredEquipments(equipment_ids) {
  try {
    const res = await api.post("/user/preferred-equipments", { equipment_ids });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to save preferred equipments."));
  }
}

export async function savePreferredAmenities(amenity_ids) {
  try {
    const res = await api.post("/user/preferred-amenities", { amenity_ids });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to save preferred amenities."));
  }
}

export async function saveUserProfileLocation({
  address = null,
  latitude = null,
  longitude = null,
}) {
  try {
    const res = await api.put("/user/profile", {
      address,
      latitude,
      longitude,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to save user profile location."));
  }
}