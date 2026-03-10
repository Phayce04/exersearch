// src/utils/equipmentApi.js
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

export async function createEquipment(payload) {
  try {
    const res = await api.post("/equipments", payload);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to create equipment."));
  }
}

export async function updateEquipment(id, payload) {
  try {
    const res = await api.patch(`/equipments/${id}`, payload);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to update equipment."));
  }
}

export async function deleteEquipment(id) {
  try {
    const res = await api.delete(`/equipments/${id}`);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to delete equipment."));
  }
}

export async function importEquipmentsCsv(file) {
  try {
    const form = new FormData();
    form.append("file", file);

    const res = await api.post("/equipments/import-csv", form);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to import equipments CSV."));
  }
}

// Uploads to /storage/equipments/<kind>/...
export async function uploadEquipmentImage(file, kind = "covers") {
  try {
    const form = new FormData();
    form.append("type", "equipments");
    form.append("kind", kind);
    form.append("file", file);

    const res = await api.post("/media/upload", form);
    const data = res.data;

    const url = data?.url || "";
    if (!url) throw new Error("Upload succeeded but no URL was returned.");

    return { url };
  } catch (e) {
    throw new Error(apiError(e, "Failed to upload equipment image."));
  }
}

export function absoluteUrl(maybeRelativeUrl) {
  if (!maybeRelativeUrl) return "";
  if (/^https?:\/\//i.test(maybeRelativeUrl)) return maybeRelativeUrl;
  return `${API_BASE_URL}${maybeRelativeUrl.startsWith("/") ? "" : "/"}${maybeRelativeUrl}`;
}