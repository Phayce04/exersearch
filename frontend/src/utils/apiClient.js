import axios from "axios";
import Swal from "sweetalert2";

const API_BASE = "https://exersearch.test";
const TOKEN_KEY = "token";

// 🔑 change this if your project uses a different key
const ROLE_KEY = "role";

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ✅ prevents infinite redirects / spam
let handlingMaintenance = false;

export const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  config.headers = {
    ...(config.headers || {}),
    ...authHeaders(),
  };
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;

    // ✅ Maintenance detector (reliable)
    if (status === 503 && !handlingMaintenance) {
      handlingMaintenance = true;

      const role = localStorage.getItem(ROLE_KEY);
      const isAdmin = role === "admin" || role === "superadmin";

      // ✅ Users/owners/guests get redirected to /maintenance
      if (!isAdmin) {
        window.location.replace("/maintenance");
        return new Promise(() => {});
      }

      // ✅ Admins stay in admin panel (optional popup)
      await Swal.fire({
        title: "Maintenance Mode",
        text: "Maintenance is enabled. Users/owners are blocked.",
        icon: "warning",
        confirmButtonText: "OK",
        allowOutsideClick: false,
        allowEscapeKey: false,
      });

      // keep original error behavior for admins
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);