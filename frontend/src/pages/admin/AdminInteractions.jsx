// src/pages/admin/AdminEquipments.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminThemes } from "./AdminLayout";

import { useAuthMe } from "../../utils/useAuthMe";
import {
  toggleSort,
  sortIndicator,
  sortRows,
  paginate,
  globalSearch,
  tableValue,
} from "../../utils/tableUtils";

import { getAdminActivities } from "../../utils/activityApi";

import "./AdminEquipments.css";

function formatDateTimeFallback(value) {
  if (!value) return "-";
  const d = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
}

const EVENT_OPTIONS = ["All", "view", "click", "save", "contact", "visit", "subscribe"];
const DAYS_OPTIONS = [
  { label: "Today", value: 1 },
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
  { label: "12 months", value: 365 },
];

function safeJsonPretty(v) {
  if (v == null) return "";
  const s = String(v);
  try {
    const parsed = JSON.parse(s);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return s;
  }
}

export default function AdminEquipments() {
  const { theme } = useOutletContext();
  const t = adminThemes[theme]?.app || adminThemes.light.app;
  const isDark = theme === "dark";

  const { isAdmin } = useAuthMe();

  const [q, setQ] = useState("");
  const [event, setEvent] = useState("All");
  const [days, setDays] = useState(30);

  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [error, setError] = useState("");

  const [sort, setSort] = useState({ key: "created", dir: "desc" });
  const pageSize = 10;
  const [page, setPage] = useState(1);

  // reuse existing modal/backdrop styling classes for meta viewer
  const [previewImg, setPreviewImg] = useState(null); // { title, text }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setPreviewImg(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [q, event, days]);

  const reload = async () => {
    setError("");
    setLoadingRows(true);
    try {
      if (!isAdmin) {
        setRows([]);
        return;
      }

      const data = await getAdminActivities({
        limit: 2000,
        days,
        q: q.trim() || undefined,
        event: event !== "All" ? event : undefined,
      });

      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load activities.");
      setRows([]);
    } finally {
      setLoadingRows(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, days, event, q]);

  const searched = useMemo(() => {
    return globalSearch(rows || [], q, [
      (r) => r.row_key,
      (r) => r.event,
      (r) => r.source,
      (r) => r.gym_name,
      (r) => r.gym_id,
      (r) => r.user_email,
      (r) => r.user_name,
      (r) => r.user_id,
      (r) => r.session_id,
      (r) => r.meta,
      (r) => r.created_at,
    ]);
  }, [rows, q]);

  const filtered = useMemo(() => {
    return searched.filter((r) => (event === "All" ? true : r.event === event));
  }, [searched, event]);

  const getValue = (r, key) => {
    switch (key) {
      case "event":
        return tableValue.str(r.event);
      case "gym":
        return tableValue.str(r.gym_name || "");
      case "user":
        return tableValue.str(r.user_email || r.user_name || "");
      case "source":
        return tableValue.str(r.source);
      case "created":
        return tableValue.dateMs(r.created_at);
      case "row_key":
        return tableValue.str(r.row_key);
      default:
        return "";
    }
  };

  const sorted = useMemo(() => sortRows(filtered, sort, getValue), [filtered, sort]);

  const { totalPages, safePage, pageRows, left, right } = useMemo(
    () => paginate(sorted, page, pageSize),
    [sorted, page]
  );

  const headerPills = useMemo(() => {
    const pills = [];
    pills.push(loadingRows ? "Loading…" : `${sorted.length} items`);
    if (event !== "All") pills.push(event);
    pills.push(`${days}d`);
    return pills;
  }, [loadingRows, sorted.length, event, days]);

  const cssVars = {
    "--bg": t.bg,
    "--text": t.text,
    "--mutedText": t.mutedText,
    "--border": t.border,
    "--soft": t.soft,
    "--soft2": t.soft2,
    "--shadow": t.shadow,
    "--main": "#d23f0b",
    "--isDark": isDark ? 1 : 0,
  };

  return (
    <div className="ae-page" data-theme={theme} style={cssVars}>
      <div className="ae-topRow">
        <div className="ae-titleWrap">
          <div className="ae-pageTitle">Activities</div>

          <div className="ae-headerPills">
            {headerPills.map((p, idx) => (
              <span key={idx} className={idx === 0 ? "ae-pill" : "ae-pillMuted"}>
                {p}
              </span>
            ))}
          </div>
        </div>

        <div className="ae-topActions">
          <button className="ae-btn ae-btnSecondary" onClick={reload}>
            Reload
          </button>
        </div>
      </div>

      <div className="ae-panelOuter">
        <div className="ae-panel">
          <div className="ae-panelTop">
            <div className="ae-leftActions">{!isAdmin ? <div className="ae-mutedSmall">Admins only.</div> : null}</div>

            <div className="ae-rightActions">
              <div className="ae-searchBox">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search activities…"
                  className="ae-searchInput"
                />
                <span className="ae-searchIcon">⌕</span>
              </div>

              <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="ae-select">
                {DAYS_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>

              <select value={event} onChange={(e) => setEvent(e.target.value)} className="ae-select">
                {EVENT_OPTIONS.map((ev) => (
                  <option key={ev} value={ev}>
                    {ev}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="ae-tableWrap">
            {error ? (
              <div className="ae-errorBox">{error}</div>
            ) : (
              <table className="ae-table">
                <thead>
                  <tr>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "event"))}>
                      Event{sortIndicator(sort, "event")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "gym"))}>
                      Gym{sortIndicator(sort, "gym")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "user"))}>
                      User{sortIndicator(sort, "user")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "source"))}>
                      Source{sortIndicator(sort, "source")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "created"))}>
                      Time{sortIndicator(sort, "created")}
                    </th>
                    <th className="ae-th ae-thRight">Meta</th>
                  </tr>
                </thead>

                <tbody>
                  {loadingRows ? (
                    <tr>
                      <td className="ae-td" colSpan={6}>
                        Loading…
                      </td>
                    </tr>
                  ) : pageRows.length === 0 ? (
                    <tr>
                      <td className="ae-td" colSpan={6}>
                        No results.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((r) => (
                      <tr
                        className="ae-tr"
                        key={
                          r.row_key ??
                          `${r.gym_id}-${r.user_id ?? "guest"}-${r.session_id ?? "nosess"}-${r.event}-${r.created_at}`
                        }
                      >
                        <td className="ae-td">
                          <div className="ae-equipCell">
                            <div className="ae-equipMeta">
                              <div className="ae-equipName">{r.event || "-"}</div>
                              <div className="ae-mutedTiny">{r.row_key ? `Key: ${r.row_key}` : ""}</div>
                            </div>
                          </div>
                        </td>

                        <td className="ae-td">
                          <div className="ae-mutedTiny">{r.gym_name || "-"}</div>
                          <div className="ae-mutedTiny">Gym ID: {r.gym_id ?? "-"}</div>
                        </td>

                        <td className="ae-td">
                          <div className="ae-mutedTiny">{r.user_email || r.user_name || "Guest"}</div>
                          <div className="ae-mutedTiny">
                            {r.user_id ? `User ID: ${r.user_id}` : `Session: ${r.session_id || "-"}`}
                          </div>
                        </td>

                        <td className="ae-td">{r.source || "-"}</td>

                        <td className="ae-td ae-mutedCell">{formatDateTimeFallback(r.created_at)}</td>

                        <td className="ae-td ae-tdRight">
                          <div className="ae-actionsInline">
                            <IconBtn
                              title={r.meta ? "View meta" : "No meta"}
                              className="ae-iconBtn"
                              onClick={() => {
                                if (!r.meta) return;
                                setPreviewImg({
                                  title: `${r.event || "event"} • ${r.gym_name || "gym"} • ${
                                    r.user_email || r.user_name || "guest"
                                  }`,
                                  text: safeJsonPretty(r.meta),
                                });
                              }}
                            >
                              {r.meta ? "👁" : "—"}
                            </IconBtn>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="ae-pagerRow">
            <button
              className="ae-btn ae-btnSecondary"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>

            <div className="ae-mutedSmall">
              Page <b className="ae-strongText">{safePage}</b> of{" "}
              <b className="ae-strongText">{totalPages}</b>
            </div>

            <button
              className="ae-btn ae-btnSecondary"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>

            <div className="ae-pagerRight">
              <span className="ae-mutedSmall">
                Showing <b className="ae-strongText">{left}-{right}</b> of{" "}
                <b className="ae-strongText">{sorted.length}</b>
              </span>
            </div>
          </div>
        </div>
      </div>

      {previewImg && (
        <div className="ae-backdrop ae-backdropTop" onClick={() => setPreviewImg(null)}>
          <div className="ae-modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="ae-modalTopRow">
              <div className="ae-modalTitle">{previewImg.title || "Meta"}</div>
            </div>

            <pre
              style={{
                marginTop: 10,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: "60vh",
                overflow: "auto",
              }}
            >
              {previewImg.text || "No meta"}
            </pre>

            <div className="ae-modalActions">
              <button className="ae-btn ae-btnSecondary" onClick={() => setPreviewImg(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="ae-spacer" />
    </div>
  );
}

function IconBtn({ children, title, className, onClick }) {
  return (
    <button type="button" title={title} onClick={onClick} className={className}>
      {children}
    </button>
  );
}