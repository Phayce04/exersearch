import { API_BASE } from "./findGymsData";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Uses your UserController@updatePreferences (the one that accepts goal/activity/budget + arrays)
 * Make sure your route points to it, e.g:
 * PUT /api/v1/users/{user_id}/preferences (but it ignores user_id and uses logged-in user)
 */
export async function updateMyPreferences(payload) {
  const res = await fetch(`${API_BASE}/api/v1/users/0/preferences`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Preferences save failed: ${res.status}`);
  return json;
}
