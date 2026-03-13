// src/utils/auth.js

const TOKEN_KEY = "token";
const ROLE_KEY = "role";

export function getUserRole() {
  return localStorage.getItem(ROLE_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}

export function isGuest() {
  return getUserRole() === "guest" && !getToken();
}

export function canAccessUserPages() {
  const role = getUserRole();
  return isGuest() || role === "user";
}

export function continueAsGuest() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.setItem(ROLE_KEY, "guest");
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  window.location.replace("/login");
}