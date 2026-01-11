import { useNavigate } from "react-router-dom";

export function getUserRole() {


  const role = localStorage.getItem("userRole"); 
  return role;
}

export function isLoggedIn() {
  return !!localStorage.getItem("authToken");
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role"); // also remove role
  window.location.replace("/login"); // redirect to login page
}