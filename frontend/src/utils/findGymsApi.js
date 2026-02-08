// src/utils/findGymsApi.js
import { API_BASE } from "./findGymsData";

// ---- helpers ----
function getToken() {
  return localStorage.getItem("token") || "";
}

async function readResponse(res) {
  const ct = res.headers.get("content-type") || "";
  const text = await res.text().catch(() => "");
  let json = null;

  if (text && ct.includes("application/json")) {
    try {
      json = JSON.parse(text);
    } catch {
      // ignore parse fail
    }
  }

  return { ct, text, json };
}

// ---- debug fetch ----
export async function apiRequest(path, { method = "GET", body = null } = {}) {
  const token = getToken();
  const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = {
    Accept: "application/json",
  };

  let payload;
  if (body !== null && body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  if (token) headers.Authorization = `Bearer ${token}`;

  console.groupCollapsed(
    `%c[API] ${method} ${url}`,
    "color:#ff8c00;font-weight:800;"
  );
  console.log("token?", token ? "YES" : "NO");
  console.log("headers:", headers);
  console.log("body:", body);

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      credentials: "include",
      body: payload,
    });
  } catch (e) {
    console.error("NETWORK ERROR:", e);
    console.groupEnd();
    throw new Error(`Network error: ${String(e?.message || e)}`);
  }

  const { ct, text, json } = await readResponse(res);

  console.log("status:", res.status, res.ok ? "(OK)" : "(NOT OK)");
  console.log("content-type:", ct);
  console.log("response json:", json);
  console.log("response text:", text ? text.slice(0, 1200) : "(empty)");
  console.groupEnd();

  if (!res.ok) {
    const msg =
      json?.message ||
      json?.error ||
      (text ? text.slice(0, 500) : `HTTP ${res.status}`);
    throw new Error(msg);
  }

  return json ?? text;
}

// -------------------------
// GET: existing user picks
// -------------------------
export function getUserPreference() {
  // returns { data: { goal, activity_level, budget, plan_type, ... } } (or data: null)
  return apiRequest("/api/v1/user/preferences", { method: "GET" });
}

export function getUserPreferredEquipments() {
  // returns { data: [ ... ] }
  return apiRequest("/api/v1/user/preferred-equipments", { method: "GET" });
}

export function getUserPreferredAmenities() {
  // returns { data: [ ... ] }
  return apiRequest("/api/v1/user/preferred-amenities", { method: "GET" });
}

export function getUserProfile() {
  // returns { user: {...}, user_profile: { address, latitude, longitude, ... } }
  return apiRequest("/api/v1/user/profile", { method: "GET" });
}

// -------------------------
// SAVE: preferences (POST)
// -------------------------

// ✅ IMPORTANT: omit null/empty keys so we don't wipe existing values
export function saveUserPreferences(fields = {}) {
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

  if (fields.budget !== undefined && fields.budget !== null && fields.budget !== "") {
    payload.budget = fields.budget;
  }

  if (fields.plan_type !== undefined && fields.plan_type !== null && fields.plan_type !== "") {
    payload.plan_type = fields.plan_type;
  }

  return apiRequest("/api/v1/user/preferences", { method: "POST", body: payload });
}

export function savePreferredEquipments(equipment_ids) {
  return apiRequest("/api/v1/user/preferred-equipments", {
    method: "POST",
    body: { equipment_ids },
  });
}

export function savePreferredAmenities(amenity_ids) {
  return apiRequest("/api/v1/user/preferred-amenities", {
    method: "POST",
    body: { amenity_ids },
  });
}

export function saveUserProfileLocation({ address = null, latitude = null, longitude = null }) {
  // backend is now patch-safe, so this won't wipe other profile fields
  return apiRequest("/api/v1/user/profile", {
    method: "PUT",
    body: { address, latitude, longitude },
  });
}
