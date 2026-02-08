import { API_BASE } from "./findGymsData";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function updateMyProfile(payload) {
  const res = await fetch(`${API_BASE}/api/v1/user/profile`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Profile save failed: ${res.status}`);
  return json;
}
