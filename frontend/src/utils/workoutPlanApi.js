// ✅ UPDATED API FILE: src/utils/workoutPlanApi.js
const API = "https://exersearch.test";

export function getTokenMaybe() {
  return localStorage.getItem("token") || "";
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

async function request(path, options = {}) {
  const token = getTokenMaybe();
  const url = `${API}${path.startsWith("/") ? "" : "/"}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await safeJson(res);

  if (!res.ok) {
    throw new Error(data?.message || `Request failed (HTTP ${res.status})`);
  }

  return data;
}

/* ------------------------------------------------------------------
 * USER PREFERENCES + PREFERRED EQUIPMENTS
 * ------------------------------------------------------------------ */
export function getUserPreferences() {
  return request(`/api/v1/user/preferences`);
}

export function saveUserPreferences(payload = {}) {
  return request(`/api/v1/user/preferences`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function getUserPreferredEquipments() {
  return request(`/api/v1/user/preferred-equipments`);
}

export function saveUserPreferredEquipments(equipmentIds = []) {
  return request(`/api/v1/user/preferred-equipments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ equipment_ids: equipmentIds }),
  });
}

export function getEquipments(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/api/v1/equipments${qs ? `?${qs}` : ""}`);
}

/* ------------------------------------------------------------------
 * EXERCISES
 * ------------------------------------------------------------------ */
export function getExercises(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/api/v1/exercises${qs ? `?${qs}` : ""}`);
}

export function getExercise(id) {
  return request(`/api/v1/exercises/${id}`);
}

/* ------------------------------------------------------------------
 * WORKOUT TEMPLATES
 * ------------------------------------------------------------------ */
export function getWorkoutTemplates(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/api/v1/workout-templates${qs ? `?${qs}` : ""}`);
}

export function getWorkoutTemplate(id) {
  return request(`/api/v1/workout-templates/${id}`);
}

/* ------------------------------------------------------------------
 * USER WORKOUT PLANS
 * ------------------------------------------------------------------ */
export function generateUserWorkoutPlan(payload = {}) {
  return request(`/api/v1/user/workout-plans/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function getUserWorkoutPlans(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/api/v1/user/workout-plans${qs ? `?${qs}` : ""}`);
}

export function getUserWorkoutPlan(id) {
  return request(`/api/v1/user/workout-plans/${id}`);
}

export function createUserWorkoutPlan(payload) {
  return request(`/api/v1/user/workout-plans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateUserWorkoutPlan(id, payload) {
  return request(`/api/v1/user/workout-plans/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteUserWorkoutPlan(id) {
  return request(`/api/v1/user/workout-plans/${id}`, { method: "DELETE" });
}

/* ✅ Recalibrate WHOLE PLAN (week) for gym */
export function recalibrateWorkoutPlanGym(user_plan_id, gym_id) {
  return request(`/api/v1/user/workout-plans/${user_plan_id}/recalibrate-gym`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gym_id }),
  });
}

/* ------------------------------------------------------------------
 * USER WORKOUT PLAN DAYS
 * ------------------------------------------------------------------ */
export function getUserWorkoutPlanDays(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/api/v1/user/workout-plan-days${qs ? `?${qs}` : ""}`);
}

export function getUserWorkoutPlanDay(id) {
  return request(`/api/v1/user/workout-plan-days/${id}`);
}

export function createUserWorkoutPlanDay(payload) {
  return request(`/api/v1/user/workout-plan-days`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateUserWorkoutPlanDay(id, payload) {
  return request(`/api/v1/user/workout-plan-days/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteUserWorkoutPlanDay(id) {
  return request(`/api/v1/user/workout-plan-days/${id}`, { method: "DELETE" });
}

/* ✅ Recalibrate SINGLE DAY for gym */
export function recalibrateWorkoutDayGym(user_plan_day_id, gym_id) {
  return request(
    `/api/v1/user/workout-plan-days/${user_plan_day_id}/recalibrate-gym`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gym_id }),
    }
  );
}

/* ------------------------------------------------------------------
 * USER WORKOUT PLAN DAY EXERCISES
 * ------------------------------------------------------------------ */
export function getUserWorkoutPlanDayExercises(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/api/v1/user/workout-plan-day-exercises${qs ? `?${qs}` : ""}`);
}

export function getUserWorkoutPlanDayExercise(id) {
  return request(`/api/v1/user/workout-plan-day-exercises/${id}`);
}

export function createUserWorkoutPlanDayExercise(payload) {
  return request(`/api/v1/user/workout-plan-day-exercises`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateUserWorkoutPlanDayExercise(id, payload) {
  return request(`/api/v1/user/workout-plan-day-exercises/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteUserWorkoutPlanDayExercise(id) {
  return request(`/api/v1/user/workout-plan-day-exercises/${id}`, {
    method: "DELETE",
  });
}

/* ------------------------------------------------------------------
 * GYMS
 * ------------------------------------------------------------------ */
export function getUserSavedGyms() {
  return request(`/api/v1/user/saved-gyms`);
}

export function saveUserGym(gym_id) {
  return request(`/api/v1/user/saved-gyms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gym_id }),
  });
}

export function searchGyms(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/api/v1/gyms${qs ? `?${qs}` : ""}`);
}

export function getGym(id) {
  return request(`/api/v1/gyms/${id}`);
}

/* ------------------------------------------------------------------
 * URL UTILS
 * ------------------------------------------------------------------ */
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
