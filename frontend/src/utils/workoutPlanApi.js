// src/utils/workoutApi.js
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
 * USER PREFERENCES + PREFERRED EQUIPMENTS (auth required)
 * ------------------------------------------------------------------ */

// ✅ GET current user's preferences
export function getUserPreferences() {
  return request(`/api/v1/user/preferences`);
}

// ✅ POST upsert preferences
// Allowed fields per your controller:
// goal, activity_level, budget, plan_type,
// workout_days, workout_time, food_budget,
// workout_level, session_minutes, workout_place, preferred_style,
// dietary_restrictions[], injuries[]
export function saveUserPreferences(payload = {}) {
  return request(`/api/v1/user/preferences`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// ✅ GET current user's preferred equipments (returns equipment objects)
export function getUserPreferredEquipments() {
  return request(`/api/v1/user/preferred-equipments`);
}

// ✅ POST sync preferred equipments by ids
export function saveUserPreferredEquipments(equipmentIds = []) {
  return request(`/api/v1/user/preferred-equipments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ equipment_ids: equipmentIds }),
  });
}

// ✅ Equipments catalog for picker UI
export function getEquipments(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/api/v1/equipments${qs ? `?${qs}` : ""}`);
}

/* ------------------------------------------------------------------
 * EXERCISES (auth required in your routes)
 * ------------------------------------------------------------------ */

export function getExercises(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/api/v1/exercises${qs ? `?${qs}` : ""}`);
}

export function getExercise(id) {
  return request(`/api/v1/exercises/${id}`);
}

/* ------------------------------------------------------------------
 * WORKOUT TEMPLATES (auth required in your routes)
 * ------------------------------------------------------------------ */

export function getWorkoutTemplates(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/api/v1/workout-templates${qs ? `?${qs}` : ""}`);
}

export function getWorkoutTemplate(id) {
  return request(`/api/v1/workout-templates/${id}`);
}

/* ------------------------------------------------------------------
 * USER WORKOUT PLANS (Instances)
 * ------------------------------------------------------------------ */

// Generate plan from preferences + templates
export function generateUserWorkoutPlan(payload = {}) {
  return request(`/api/v1/user/workout-plans/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// Plans CRUD
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

/* ------------------------------------------------------------------
 * USER WORKOUT PLAN DAYS
 * ------------------------------------------------------------------ */

export function getUserWorkoutPlanDays(params = {}) {
  // params example: { user_plan_id: 15 }
  const qs = new URLSearchParams(params).toString();
  return request(`/api/v1/user/workout-plan-days${qs ? `?${qs}` : ""}`);
}

export function getUserWorkoutPlanDay(id) {
  return request(`/api/v1/user/workout-plan-days/${id}`);
}

export function createUserWorkoutPlanDay(payload) {
  // payload: { user_plan_id, template_day_id, day_number }
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

/* ------------------------------------------------------------------
 * USER WORKOUT PLAN DAY EXERCISES
 * ------------------------------------------------------------------ */

export function getUserWorkoutPlanDayExercises(params = {}) {
  // params example: { user_plan_day_id: 49 }
  const qs = new URLSearchParams(params).toString();
  return request(
    `/api/v1/user/workout-plan-day-exercises${qs ? `?${qs}` : ""}`
  );
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
 * URL UTILS
 * ------------------------------------------------------------------ */

export function absoluteUrl(maybeRelativeUrl) {
  if (!maybeRelativeUrl) return "";
  if (/^https?:\/\//i.test(maybeRelativeUrl)) return maybeRelativeUrl;
  return `${API}${maybeRelativeUrl.startsWith("/") ? "" : "/"}${maybeRelativeUrl}`;
}

export const API_BASE_URL = API;
