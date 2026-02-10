// src/hooks/useApiList.js
import { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";

const API_BASE = "https://exersearch.test";
const TOKEN_KEY = "token";

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function extractRows(payload) {
  // Laravel Resource paginator: { data: [...], meta: {...}, links: {...} }
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
}

function getLastPage(payload) {
  // supports:
  // - Laravel paginator: payload.meta.last_page
  // - plain paginator: payload.last_page
  const meta = payload?.meta || payload || {};
  const lp = Number(meta?.last_page ?? meta?.lastPage ?? 1);
  return Number.isFinite(lp) && lp > 0 ? lp : 1;
}

export function useApiList(
  path,
  {
    authed = true,

    // ✅ NEW options
    allPages = false,
    perPage = 10,
    params = null, // ✅ IMPORTANT: default to null to avoid new {} each render
    pageParam = "page",
    perPageParam = "per_page",
  } = {}
) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Make params stable (string) so hooks don't re-run forever
  const paramsStable = useMemo(() => {
    const obj = params && typeof params === "object" ? params : {};
    return JSON.stringify(obj);
  }, [params]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const baseParams =
        params && typeof params === "object" ? params : {};

      const fetchPage = async (page) => {
        const res = await axios.get(`${API_BASE}${path}`, {
          headers: authed ? authHeaders() : {},
          withCredentials: true,
          params: {
            ...baseParams,
            [perPageParam]: perPage,
            [pageParam]: page,
          },
        });
        return res.data;
      };

      // ✅ single page
      if (!allPages) {
        const payload = await fetchPage(1);
        const dataRows = extractRows(payload);
        setRows(dataRows);
        return dataRows;
      }

      // ✅ fetch all pages
      const firstPayload = await fetchPage(1);
      const lastPage = getLastPage(firstPayload);

      let merged = [...extractRows(firstPayload)];

      if (lastPage > 1) {
        // you can do parallel; keeping it parallel for speed
        const promises = [];
        for (let p = 2; p <= lastPage; p++) promises.push(fetchPage(p));
        const rest = await Promise.all(promises);
        for (const payload of rest) merged.push(...extractRows(payload));
      }

      setRows(merged);
      return merged;
    } catch (e) {
      setRows([]);
      setError(e?.response?.data?.message || "Failed to load.");
      return [];
    } finally {
      setLoading(false);
    }
  }, [
    path,
    authed,
    allPages,
    perPage,
    pageParam,
    perPageParam,
    paramsStable, // ✅ stable dependency instead of params object
  ]);

  useEffect(() => {
    load();
  }, [load]);

  return { rows, loading, error, reload: load, setRows };
}
