import { allowedUiModes, defaultUiMode } from "./roles";

const KEY = "ui_mode"; // "user" | "owner" | "admin" | "superadmin"

export function getUiMode(role) {
  const saved = localStorage.getItem(KEY);
  const allowed = allowedUiModes(role);

  if (saved && allowed.includes(saved)) return saved;
  return defaultUiMode(role);
}

export function setUiMode(mode) {
  localStorage.setItem(KEY, mode);
}
