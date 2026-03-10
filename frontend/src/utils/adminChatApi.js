// src/utils/adminChatApi.js
import { api } from "./apiClient";

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
    const res = await api.get(`/admin/chat-history`, { params });
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
    const res = await api.post(`/admin/chat-history/clear`, payload);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to clear chat history."));
  }
}