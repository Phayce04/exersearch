import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "https://exersearch.test";
const TOKEN_KEY = "token";

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useAuthMe() {
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const loadMe = async () => {
    setLoadingMe(true);
    try {
      const res = await axios.get(`${API_BASE}/api/v1/me`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      setMe(res.data.user || res.data);
      return res.data.user || res.data;
    } catch {
      setMe(null);
      return null;
    } finally {
      setLoadingMe(false);
    }
  };

  useEffect(() => {
    loadMe();
  }, []);

  const isAdmin = me?.role === "admin" || me?.role === "superadmin";

  return { me, loadingMe, isAdmin, reloadMe: loadMe };
}
