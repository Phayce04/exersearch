// src/utils/notificationApi.js
import { api } from "./apiClient";

export function safeStr(v) {
  return v == null ? "" : String(v);
}

export function toInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function cleanParams(params = {}) {
  const out = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === "string" && v.trim() === "") return;
    out[k] = v;
  });
  return out;
}

export function normalizeNotification(n) {
  if (!n) return null;

  return {
    notification_id: toInt(n.notification_id ?? n.id),
    recipient_id: toInt(n.recipient_id),
    recipient_role: safeStr(n.recipient_role),

    type: safeStr(n.type),
    title: safeStr(n.title),
    body: safeStr(n.body ?? n.message),

    is_read: !!n.is_read,
    read_at: n.read_at ?? null,

    meta: n.meta ?? n.data ?? null,
    created_at: n.created_at ?? null,
    updated_at: n.updated_at ?? null,
  };
}

export function normalizePagination(paged) {
  const dataArr = Array.isArray(paged?.data) ? paged.data : [];
  return {
    data: dataArr.map(normalizeNotification).filter(Boolean),
    current_page: toInt(paged?.current_page || 1),
    last_page: toInt(paged?.last_page || 1),
    per_page: toInt(paged?.per_page || dataArr.length || 20),
    total: toInt(paged?.total || dataArr.length || 0),
  };
}

export async function listNotifications(params = {}) {
  const res = await api.get(`/notifications`, { params: cleanParams(params) });
  return normalizePagination(res.data);
}

export async function getUnreadNotificationsCount() {
  const res = await api.get(`/notifications/unread-count`);
  return toInt(res.data?.unread);
}

export async function markNotificationRead(id) {
  if (!id) throw new Error("id is required");
  const res = await api.post(`/notifications/${id}/read`);
  return normalizeNotification(res.data?.notification ?? res.data);
}

export async function markAllNotificationsRead() {
  const res = await api.post(`/notifications/read-all`);
  return res.data;
}