import { api } from "./apiClient";

const API = import.meta.env.VITE_API_BASE_URL || "https://exersearch.test";

export async function getUserPreferences() {
  const res = await api.get("/user/preferences");
  return res.data;
}

export async function saveUserPreferences(payload = {}) {
  const res = await api.post("/user/preferences", payload);
  return res.data;
}

export async function getUserPreferredEquipments() {
  const res = await api.get("/user/preferred-equipments");
  return res.data;
}

export async function saveUserPreferredEquipments(equipmentIds = []) {
  const res = await api.post("/user/preferred-equipments", {
    equipment_ids: equipmentIds,
  });
  return res.data;
}

export async function getEquipments(params = {}) {
  const res = await api.get("/equipments", { params });
  return res.data;
}

export async function getExercises(params = {}) {
  const res = await api.get("/exercises", { params });
  return res.data;
}

export async function getExercise(id) {
  const res = await api.get(`/exercises/${id}`);
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

export async function generateUserWorkoutPlan(payload = {}) {
  const res = await api.post("/user/workout-plans/generate", payload);
  return res.data;
}

export async function getUserWorkoutPlans(params = {}) {
  const res = await api.get("/user/workout-plans", { params });
  return res.data;
}

export async function getUserWorkoutPlan(id) {
  const res = await api.get(`/user/workout-plans/${id}`);
  return res.data;
}

export async function createUserWorkoutPlan(payload) {
  const res = await api.post("/user/workout-plans", payload);
  return res.data;
}

export async function updateUserWorkoutPlan(id, payload) {
  const res = await api.patch(`/user/workout-plans/${id}`, payload);
  return res.data;
}

export async function deleteUserWorkoutPlan(id) {
  const res = await api.delete(`/user/workout-plans/${id}`);
  return res.data;
}

export async function recalibrateWorkoutPlanGym(user_plan_id, gym_id) {
  const res = await api.post(`/user/workout-plans/${user_plan_id}/recalibrate-gym`, {
    gym_id,
  });
  return res.data;
}

export async function getUserWorkoutPlanDays(params = {}) {
  const res = await api.get("/user/workout-plan-days", { params });
  return res.data;
}

export async function getUserWorkoutPlanDay(id) {
  const res = await api.get(`/user/workout-plan-days/${id}`);
  return res.data;
}

export async function createUserWorkoutPlanDay(payload) {
  const res = await api.post("/user/workout-plan-days", payload);
  return res.data;
}

export async function updateUserWorkoutPlanDay(id, payload) {
  const res = await api.patch(`/user/workout-plan-days/${id}`, payload);
  return res.data;
}

export async function deleteUserWorkoutPlanDay(id) {
  const res = await api.delete(`/user/workout-plan-days/${id}`);
  return res.data;
}

export async function recalibrateWorkoutDayGym(user_plan_day_id, gym_id) {
  const res = await api.post(
    `/user/workout-plan-days/${user_plan_day_id}/recalibrate-gym`,
    { gym_id }
  );
  return res.data;
}

export async function getUserWorkoutPlanDayExercises(params = {}) {
  const res = await api.get("/user/workout-plan-day-exercises", { params });
  return res.data;
}

export async function getUserWorkoutPlanDayExercise(id) {
  const res = await api.get(`/user/workout-plan-day-exercises/${id}`);
  return res.data;
}

export async function createUserWorkoutPlanDayExercise(payload) {
  const res = await api.post("/user/workout-plan-day-exercises", payload);
  return res.data;
}

export async function updateUserWorkoutPlanDayExercise(id, payload) {
  const res = await api.patch(`/user/workout-plan-day-exercises/${id}`, payload);
  return res.data;
}

export async function deleteUserWorkoutPlanDayExercise(id) {
  const res = await api.delete(`/user/workout-plan-day-exercises/${id}`);
  return res.data;
}

export async function getWorkoutExerciseReplacementOptions(id, limit = 5) {
  const res = await api.get(`/user/workout-plan-day-exercises/${id}/replacement-options`, {
    params: { limit },
  });
  return res.data;
}

export async function replaceWorkoutExerciseWithChoice(id, new_exercise_id) {
  const res = await api.post(`/user/workout-plan-day-exercises/${id}/replace`, {
    new_exercise_id,
  });
  return res.data;
}

export async function getUserSavedGyms() {
  const res = await api.get("/user/saved-gyms");
  return res.data;
}

export async function saveUserGym(gym_id) {
  const res = await api.post("/user/saved-gyms", { gym_id });
  return res.data;
}

export async function searchGyms(params = {}) {
  const res = await api.get("/gyms", { params });
  return res.data;
}

export async function getGym(id) {
  const res = await api.get(`/gyms/${id}`);
  return res.data;
}

export function absoluteUrl(maybeRelativeUrl) {
  if (!maybeRelativeUrl) return "";
  if (/^https?:\/\//i.test(maybeRelativeUrl)) return maybeRelativeUrl;
  return `${API}${maybeRelativeUrl.startsWith("/") ? "" : "/"}${maybeRelativeUrl}`;
}

export const API_BASE_URL = API;

export function equipmentImageUrl(equipment) {
  const u = equipment?.image_url || "";
  return absoluteUrl(u);
}