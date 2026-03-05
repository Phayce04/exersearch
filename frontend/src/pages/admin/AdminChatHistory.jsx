// src/pages/admin/AdminChatHistory.jsx
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

import { getAdminChatHistory, clearAdminChatHistory } from "../../utils/adminChatApi";

import "./AdminEquipments.css";

function formatDateTimeFallback(value) {
  if (!value) return "-";
  const d = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
}

const ROLE_OPTIONS = ["All", "user", "assistant"];
const DAYS_OPTIONS = [
  { label: "Today", value: 1 },
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
  { label: "12 months", value: 365 },
];

export default function AdminChatHistory() {
  const { theme } = useOutletContext();
  const t = adminThemes[theme]?.app || adminThemes.light.app;
  const isDark = theme === "dark";

  const { isAdmin } = useAuthMe();

  const [q, setQ] = useState("");
  const [role, setRole] = useState("All");
  const [days, setDays] = useState(7);

  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [error, setError] = useState("");

  const [sort, setSort] = useState({ key: "created", dir: "desc" });
  const pageSize = 10;
  const [page, setPage] = useState(1);

  const [preview, setPreview] = useState(null); // { title, text }
  const [clearOpen, setClearOpen] = useState(false);
  const [clearBusy, setClearBusy] = useState(false);
  const [clearErr, setClearErr] = useState("");

  // clear filters form (admin)
  const [clearForm, setClearForm] = useState({
    user_id: "",
    ip_address: "",
    days: "",
  });

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setPreview(null);
        setClearOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => setPage(1), [q, role, days]);

  const reload = async () => {
    setError("");
    setLoadingRows(true);
    try {
      if (!isAdmin) {
        setRows([]);
        return;
      }

      const data = await getAdminChatHistory({
        limit: 2000,
        days,
        q: q.trim() || undefined,
        role: role !== "All" ? role : undefined,
      });

      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load chat history.");
      setRows([]);
    } finally {
      setLoadingRows(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, days, role, q]);

  const searched = useMemo(() => {
    return globalSearch(rows || [], q, [
      (r) => r.row_key,
      (r) => r.role,
      (r) => r.content,
      (r) => r.user_name,
      (r) => r.user_email,
      (r) => r.user_id,
      (r) => r.ip_address,
      (r) => r.created_at,
    ]);
  }, [rows, q]);

  const filtered = useMemo(() => {
    return searched.filter((r) => (role === "All" ? true : r.role === role));
  }, [searched, role]);

  const getValue = (r, key) => {
    switch (key) {
      case "role":
        return tableValue.str(r.role);
      case "user":
        return tableValue.str(r.user_email || r.user_name || "");
      case "ip":
        return tableValue.str(r.ip_address);
      case "content":
        return tableValue.str(r.content);
      case "created":
        return tableValue.dateMs(r.created_at);
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
    if (role !== "All") pills.push(role);
    pills.push(`${days}d`);
    return pills;
  }, [loadingRows, sorted.length, role, days]);

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

  const doClear = async () => {
    setClearErr("");
    setClearBusy(true);
    try {
      const payload = {
        user_id: clearForm.user_id ? Number(clearForm.user_id) : undefined,
        ip_address: clearForm.ip_address ? String(clearForm.ip_address).trim() : undefined,
        days: clearForm.days ? Number(clearForm.days) : undefined,
      };

      // remove undefined keys
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

      const res = await clearAdminChatHistory(payload);
      setClearOpen(false);
      setClearForm({ user_id: "", ip_address: "", days: "" });
      await reload();
      // optional: you can show a toast elsewhere; keeping styling unchanged here
      // eslint-disable-next-line no-console
      console.log("Cleared:", res);
    } catch (e) {
      setClearErr(e.message || "Clear failed.");
    } finally {
      setClearBusy(false);
    }
  };

  return (
    <div className="ae-page" data-theme={theme} style={cssVars}>
      <div className="ae-topRow">
        <div className="ae-titleWrap">
          <div className="ae-pageTitle">Chat History</div>

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
          {isAdmin ? (
            <button className="ae-btn ae-btnPrimary" onClick={() => setClearOpen(true)}>
              Clear…
            </button>
          ) : null}
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
                  placeholder="Search chat…"
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

              <select value={role} onChange={(e) => setRole(e.target.value)} className="ae-select">
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
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
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "role"))}>
                      Role{sortIndicator(sort, "role")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "user"))}>
                      User{sortIndicator(sort, "user")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "ip"))}>
                      IP{sortIndicator(sort, "ip")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "content"))}>
                      Message{sortIndicator(sort, "content")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "created"))}>
                      Time{sortIndicator(sort, "created")}
                    </th>
                    <th className="ae-th ae-thRight">View</th>
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
                        key={r.row_key ?? `${r.user_id ?? "guest"}-${r.ip_address ?? "noip"}-${r.role}-${r.created_at}`}
                      >
                        <td className="ae-td">
                          <div className="ae-equipCell">
                            <div className="ae-equipMeta">
                              <div className="ae-equipName">{r.role || "-"}</div>
                              <div className="ae-mutedTiny">{r.user_id ? `User ID: ${r.user_id}` : "Guest"}</div>
                            </div>
                          </div>
                        </td>

                        <td className="ae-td">
                          <div className="ae-mutedTiny">{r.user_email || r.user_name || "-"}</div>
                        </td>

                        <td className="ae-td">{r.ip_address || "-"}</td>

                        <td className="ae-td">
                          <div className="ae-mutedTiny">
                            {String(r.content || "-").length > 110
                              ? `${String(r.content || "-").slice(0, 110)}…`
                              : String(r.content || "-")}
                          </div>
                        </td>

                        <td className="ae-td ae-mutedCell">{formatDateTimeFallback(r.created_at)}</td>

                        <td className="ae-td ae-tdRight">
                          <div className="ae-actionsInline">
                            <IconBtn
                              title="View full"
                              className="ae-iconBtn"
                              onClick={() =>
                                setPreview({
                                  title: `${r.role || "role"} • ${r.user_email || r.user_name || "Guest"} • ${
                                    r.ip_address || "-"
                                  }`,
                                  text: String(r.content || ""),
                                })
                              }
                            >
                              👁
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

      {preview && (
        <div className="ae-backdrop ae-backdropTop" onClick={() => setPreview(null)}>
          <div className="ae-modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="ae-modalTopRow">
              <div className="ae-modalTitle">{preview.title || "Message"}</div>
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
              {preview.text || ""}
            </pre>

            <div className="ae-modalActions">
              <button className="ae-btn ae-btnSecondary" onClick={() => setPreview(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {clearOpen && (
        <div className="ae-backdrop ae-backdropTop" onClick={() => setClearOpen(false)}>
          <div className="ae-confirmModalFancy" onClick={(e) => e.stopPropagation()}>
            <div className="ae-confirmHeader">
              <div className="ae-confirmIconWrap" aria-hidden="true">
                ⚠️
              </div>

              <div className="ae-confirmHeaderText">
                <div className="ae-confirmTitle">Clear chat history</div>
                <div className="ae-mutedTiny">
                  Leave fields blank to clear <b className="ae-strongText">everything</b> (be careful).
                </div>
              </div>

              <button className="ae-modalClose" onClick={() => setClearOpen(false)}>
                ✕
              </button>
            </div>

            {clearErr ? <div className="ae-alert ae-alertError">{clearErr}</div> : null}

            <div className="ae-formGrid">
              <Field
                label="User ID (optional)"
                value={clearForm.user_id}
                onChange={(v) => setClearForm((p) => ({ ...p, user_id: v }))}
              />
              <Field
                label="IP Address (optional)"
                value={clearForm.ip_address}
                onChange={(v) => setClearForm((p) => ({ ...p, ip_address: v }))}
              />
              <Field
                label="Days (optional)"
                value={clearForm.days}
                onChange={(v) => setClearForm((p) => ({ ...p, days: v }))}
                full
              />
            </div>

            <div className="ae-confirmActions">
              <button className="ae-btn ae-btnSecondary" onClick={() => setClearOpen(false)} disabled={clearBusy}>
                Cancel
              </button>

              <button className="ae-btn ae-btnDanger" onClick={doClear} disabled={clearBusy}>
                {clearBusy ? "Clearing…" : "Yes, clear"}
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

function Field({ label, value, onChange, full }) {
  return (
    <label className={`ae-field ${full ? "ae-fieldFull" : ""}`}>
      <div className="ae-fieldLabel">{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="ae-fieldInput" />
    </label>
  );
}