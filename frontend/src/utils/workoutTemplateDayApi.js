import { api } from "./apiClient";

const API = import.meta.env.VITE_API_BASE_URL || "https://exersearch.test";

export async function createTemplateDay(payload) {
  const res = await api.post("/workout-template-days", payload);
  return res.data;
}

export async function updateTemplateDay(id, payload) {
  const res = await api.put(`/workout-template-days/${id}`, payload);
  return res.data;
}

export async function deleteTemplateDay(id) {
  const res = await api.delete(`/workout-template-days/${id}`);
  return res.data;
}

export const API_BASE_URL = API;