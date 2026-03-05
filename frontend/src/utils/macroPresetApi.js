import axios from "axios";

const API_BASE = "https://exersearch.test";
const TOKEN_KEY = "token";

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
    const res = await axios.get(`${API_BASE}/api/v1/macro-presets`, {
      withCredentials: true,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load macro presets."));
  }
}

export async function getMacroPreset(id) {
  try {
    const res = await axios.get(`${API_BASE}/api/v1/macro-presets/${id}`, {
      withCredentials: true,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load macro preset."));
  }
}

export async function calculateMacroPreset(id, calories) {
  try {
    const res = await axios.post(
      `${API_BASE}/api/v1/macro-presets/${id}/calculate`,
      { calories },
      { withCredentials: true }
    );
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to calculate macros."));
  }
}

/* ---------------- ADMIN ---------------- */

export async function getAdminMacroPresets(params = {}) {
  try {
    const res = await axios.get(`${API_BASE}/api/v1/admin/macro-presets`, {
      headers: authHeaders(),
      withCredentials: true,
      params,
    });
    return res.data; // rows array
  } catch (e) {
    throw new Error(apiError(e, "Failed to load admin macro presets."));
  }
}

export async function createMacroPreset(payload) {
  try {
    const res = await axios.post(`${API_BASE}/api/v1/admin/macro-presets`, payload, {
      headers: authHeaders(),
      withCredentials: true,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to create macro preset."));
  }
}

export async function updateMacroPreset(id, payload) {
  try {
    const res = await axios.patch(`${API_BASE}/api/v1/admin/macro-presets/${id}`, payload, {
      headers: authHeaders(),
      withCredentials: true,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to update macro preset."));
  }
}

export async function deleteMacroPreset(id) {
  try {
    const res = await axios.delete(`${API_BASE}/api/v1/admin/macro-presets/${id}`, {
      headers: authHeaders(),
      withCredentials: true,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to delete macro preset."));
  }
}

export async function toggleMacroPreset(id) {
  try {
    const res = await axios.patch(`${API_BASE}/api/v1/admin/macro-presets/${id}/toggle`, null, {
      headers: authHeaders(),
      withCredentials: true,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to toggle macro preset."));
  }
}

export const API_BASE_URL = API_BASE;