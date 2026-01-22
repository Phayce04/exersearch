// src/hooks/useApiList.js
import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "https://exersearch.test";
const TOKEN_KEY = "token";

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useApiList(path, { authed = true } = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}${path}`, {
        headers: authed ? authHeaders() : {},
        withCredentials: true,
      });
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setRows(data);
      return data;
    } catch (e) {
      setRows([]);
      setError(e?.response?.data?.message || "Failed to load.");
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return { rows, loading, error, reload: load, setRows };
}
