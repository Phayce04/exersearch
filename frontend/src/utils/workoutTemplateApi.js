import { api } from "./apiClient";

const API = import.meta.env.VITE_API_BASE_URL || "https://exersearch.test";

export async function createWorkoutTemplate(payload) {
  const res = await api.post("/workout-templates", payload);
  return res.data;
}

export async function updateWorkoutTemplate(id, payload) {
  const res = await api.patch(`/workout-templates/${id}`, payload);
  return res.data;
}

export async function deleteWorkoutTemplate(id) {
  const res = await api.delete(`/workout-templates/${id}`);
  return res.data;
}

export async function getWorkoutTemplates(params = {}) {
  const res = await api.get("/workout-templates", { params });
  return res.data;
}

export async function getWorkoutTemplate(id) {
  const res = await api.get(`/workout-templates/${id}`);
  return res.data;
}

export const API_BASE_URL = API;