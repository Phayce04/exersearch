// ✅ WHOLE FILE: src/utils/useAuthMe.js
import { useEffect, useState } from "react";
import { api } from "./apiClient";

export function useAuthMe() {
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const loadMe = async () => {
    setLoadingMe(true);
    try {
      const res = await api.get("/me");
      setMe(res.data.user || res.data);
      return res.data.user || res.data;
    } catch (err) {
      if (err?.response?.status === 503) {
        return null;
      }

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
