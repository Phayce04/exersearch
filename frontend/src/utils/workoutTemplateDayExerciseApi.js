import { api } from "./apiClient";

const API = import.meta.env.VITE_API_BASE_URL || "https://exersearch.test";

export async function createTemplateDayExercise(payload) {
  const res = await api.post("/workout-template-day-exercises", payload);
  return res.data;
}

export async function updateTemplateDayExercise(id, payload) {
  const res = await api.put(`/workout-template-day-exercises/${id}`, payload);
  return res.data;
}

export async function deleteTemplateDayExercise(id) {
  const res = await api.delete(`/workout-template-day-exercises/${id}`);
  return res.data;
}

export const API_BASE_URL = API;