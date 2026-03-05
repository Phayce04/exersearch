// src/utils/adminChatApi.js
import axios from "axios";

const API_BASE = "https://exersearch.test";
const TOKEN_KEY = "token";

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function apiError(e, fallback = "Request failed.") {
  return (
    e?.response?.data?.message ||
    (e?.response?.data ? JSON.stringify(e.response.data, null, 2) : null) ||
    e?.message ||
    fallback
  );
}

/* ------------------------------------------------------------------
 * ADMIN: READ
 * ------------------------------------------------------------------ */

export async function getAdminChatHistory(params = {}) {
  try {
    const res = await axios.get(`${API_BASE}/api/v1/admin/chat-history`, {
      headers: authHeaders(),
      withCredentials: true,
      params,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load chat history."));
  }
}

/* ------------------------------------------------------------------
 * ADMIN: CLEAR
 * ------------------------------------------------------------------ */

export async function clearAdminChatHistory(payload = {}) {
  try {
    const res = await axios.post(`${API_BASE}/api/v1/admin/chat-history/clear`, payload, {
      headers: authHeaders(),
      withCredentials: true,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to clear chat history."));
  }
}

export const API_BASE_URL = API_BASE;