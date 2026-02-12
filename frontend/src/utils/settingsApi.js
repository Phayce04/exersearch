import axios from "axios";

const API_BASE = "https://exersearch.test";
const TOKEN_KEY = "token";

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// GET /api/v1/admin/settings
export async function getAdminSettings() {
  const res = await axios.get(`${API_BASE}/api/v1/admin/settings`, {
    headers: authHeaders(),
    withCredentials: true,
  });

  return res.data?.data ?? res.data;
}

// PUT /api/v1/admin/settings
export async function updateAdminSettings(payload) {

  const res = await axios.put(`${API_BASE}/api/v1/admin/settings`, payload, {
    headers: authHeaders(),
    withCredentials: true,
  });

  return res.data?.data ?? res.data;
}
