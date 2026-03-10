import { api } from "./apiClient";

function apiError(e, fallback = "Request failed.") {
  return (
    e?.response?.data?.message ||
    (e?.response?.data ? JSON.stringify(e.response.data, null, 2) : null) ||
    e?.message ||
    fallback
  );
}

/* ---------------- PUBLIC ---------------- */

export async function getMacroPresets() {
  try {
    const res = await api.get("/macro-presets");
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load macro presets."));
  }
}

export async function getMacroPreset(id) {
  try {
    const res = await api.get(`/macro-presets/${id}`);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load macro preset."));
  }
}

export async function calculateMacroPreset(id, calories) {
  try {
    const res = await api.post(`/macro-presets/${id}/calculate`, { calories });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to calculate macros."));
  }
}

/* ---------------- ADMIN ---------------- */

export async function getAdminMacroPresets(params = {}) {
  try {
    const res = await api.get("/admin/macro-presets", { params });
    return res.data; // rows array
  } catch (e) {
    throw new Error(apiError(e, "Failed to load admin macro presets."));
  }
}

export async function createMacroPreset(payload) {
  try {
    const res = await api.post("/admin/macro-presets", payload);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to create macro preset."));
  }
}

export async function updateMacroPreset(id, payload) {
  try {
    const res = await api.patch(`/admin/macro-presets/${id}`, payload);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to update macro preset."));
  }
}

export async function deleteMacroPreset(id) {
  try {
    const res = await api.delete(`/admin/macro-presets/${id}`);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to delete macro preset."));
  }
}

export async function toggleMacroPreset(id) {
  try {
    const res = await api.patch(`/admin/macro-presets/${id}/toggle`);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to toggle macro preset."));
  }
}