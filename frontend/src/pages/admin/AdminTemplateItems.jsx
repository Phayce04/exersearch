// src/pages/admin/AdminTemplateDayExercises.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminThemes } from "./AdminLayout";

import { useAuthMe } from "../../utils/useAuthMe";
import { useApiList } from "../../utils/useApiList";
import {
  toggleSort,
  sortIndicator,
  sortRows,
  paginate,
  globalSearch,
  tableValue,
} from "../../utils/tableUtils";

import "./AdminEquipments.css";

/* -----------------------------
   Small helpers
------------------------------ */
function formatDateTimeFallback(value) {
  if (!value) return "-";
  const d = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const API = "https://exersearch.test";
const TOKEN_KEY = "token";

function getTokenMaybe() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

async function request(path, options = {}) {
  const token = getTokenMaybe();
  const url = `${API}${path.startsWith("/") ? "" : "/"}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await safeJson(res);

  if (!res.ok) {
    throw new Error(data?.message || `Request failed (HTTP ${res.status})`);
  }
  return data;
}

/* -----------------------------
   CRUD API for Day Exercises
------------------------------ */
function createTemplateDayExercise(payload) {
  // POST /api/v1/workout-template-day-exercises
  return request(`/api/v1/workout-template-day-exercises`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function updateTemplateDayExercise(id, payload) {
  // PUT /api/v1/workout-template-day-exercises/{id}
  return request(`/api/v1/workout-template-day-exercises/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function deleteTemplateDayExercise(id) {
  // DELETE /api/v1/workout-template-day-exercises/{id}
  return request(`/api/v1/workout-template-day-exercises/${id}`, {
    method: "DELETE",
  });
}

/* ============================================================
   PAGE
============================================================ */
export default function AdminTemplateDayExercises() {
  const { theme } = useOutletContext();
  const t = adminThemes[theme]?.app || adminThemes.light.app;
  const isDark = theme === "dark";

  const { isAdmin } = useAuthMe();

  // ------------------------------------------------------------
  // First: pick a template
  // ------------------------------------------------------------
  const {
    rows: templates,
    loading: loadingTpls,
    error: tplErr,
    reload: reloadTpls,
  } = useApiList("/api/v1/workout-templates", {
    authed: true,
    allPages: true,
    perPage: 50,
  });

  const [templateId, setTemplateId] = useState("");

  // ------------------------------------------------------------
  // Second: pick a day (we load days by template_id)
  // ------------------------------------------------------------
  const {
    rows: days,
    loading: loadingDays,
    error: daysErr,
    reload: reloadDays,
  } = useApiList("/api/v1/workout-template-days", {
    authed: true,
    allPages: true,
    perPage: 100,
    params: templateId ? { template_id: templateId } : {},
  });

  const [templateDayId, setTemplateDayId] = useState("");

  // If template changes, reset day selection
  useEffect(() => {
    setTemplateDayId("");
  }, [templateId]);

  // ------------------------------------------------------------
  // Finally: load day exercises by template_day_id (your controller supports this)
  // ------------------------------------------------------------
  const {
    rows: items,
    loading: loadingItems,
    error: itemsErr,
    reload: reloadItems,
  } = useApiList("/api/v1/workout-template-day-exercises", {
    authed: true,
    allPages: true,
    perPage: 200,
    params: templateDayId ? { template_day_id: templateDayId } : {},
  });

  // ------------------------------------------------------------
  // Table state
  // ------------------------------------------------------------
  const [q, setQ] = useState("");
  const [sort, setSort] = useState({ key: "order", dir: "asc" });
  const pageSize = 10;
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [q, templateId, templateDayId]);

  const searched = useMemo(() => {
    return globalSearch(items, q, [
      (r) => r.id,
      (r) => r.template_day_id,
      (r) => r.slot_type,
      (r) => r.exercise_id,
      (r) => r?.exercise?.name,
      (r) => r.sets,
      (r) => r.reps_min,
      (r) => r.reps_max,
      (r) => r.rest_seconds,
      (r) => r.order_index,
    ]);
  }, [items, q]);

  const getValue = (r, key) => {
    switch (key) {
      case "order":
        return tableValue.num(r.order_index);
      case "slot":
        return tableValue.str(r.slot_type);
      case "exercise":
        return tableValue.str(r?.exercise?.name || "");
      case "sets":
        return tableValue.num(r.sets);
      case "reps":
        return tableValue.str(
          r.reps_min && r.reps_max
            ? `${r.reps_min}-${r.reps_max}`
            : r.reps_min
            ? `${r.reps_min}+`
            : r.reps_max
            ? `<=${r.reps_max}`
            : ""
        );
      case "rest":
        return tableValue.num(r.rest_seconds);
      case "updated":
        return tableValue.dateMs(r.updated_at);
      default:
        return "";
    }
  };

  const sorted = useMemo(() => sortRows(searched, sort, getValue), [searched, sort]);
  const { totalPages, safePage, pageRows, left, right } = useMemo(
    () => paginate(sorted, page, pageSize),
    [sorted, page]
  );

  const headerPills = useMemo(() => {
    const pills = [];
    if (!templateId) pills.push("Select a template");
    else if (!templateDayId) pills.push("Select a day");
    else pills.push(loadingItems ? "Loading…" : `${sorted.length} items`);
    return pills;
  }, [templateId, templateDayId, loadingItems, sorted.length]);

  // ------------------------------------------------------------
  // Modals
  // ------------------------------------------------------------
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("view"); // view | edit | add
  const [active, setActive] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const [delOpen, setDelOpen] = useState(false);
  const [delBusy, setDelBusy] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setDelOpen(false);
        setSaveOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openAdd = () => {
    if (!templateDayId) {
      alert("Select a template day first.");
      return;
    }
    setErrMsg("");
    setMode("add");
    setActive(null);
    setForm({
      template_day_id: Number(templateDayId),
      slot_type: "main",
      exercise_id: "",
      sets: "",
      reps_min: "",
      reps_max: "",
      rest_seconds: "",
      order_index: "",
    });
    setOpen(true);
  };

  const openView = (r) => {
    setErrMsg("");
    setMode("view");
    setActive(r);
    setForm({
      template_day_id: Number(r.template_day_id),
      slot_type: r.slot_type || "main",
      exercise_id: r.exercise_id ?? "",
      sets: r.sets ?? "",
      reps_min: r.reps_min ?? "",
      reps_max: r.reps_max ?? "",
      rest_seconds: r.rest_seconds ?? "",
      order_index: r.order_index ?? "",
    });
    setOpen(true);
  };

  const openEdit = (r) => {
    setErrMsg("");
    setMode("edit");
    setActive(r);
    setForm({
      template_day_id: Number(r.template_day_id),
      slot_type: r.slot_type || "main",
      exercise_id: r.exercise_id ?? "",
      sets: r.sets ?? "",
      reps_min: r.reps_min ?? "",
      reps_max: r.reps_max ?? "",
      rest_seconds: r.rest_seconds ?? "",
      order_index: r.order_index ?? "",
    });
    setOpen(true);
  };

  const askDelete = (r) => {
    setErrMsg("");
    setActive(r);
    setDelOpen(true);
  };

  const doDelete = async () => {
    if (!active) return;
    setDelBusy(true);
    setErrMsg("");
    try {
      await deleteTemplateDayExercise(active.id);
      setDelOpen(false);
      setOpen(false);
      reloadItems();
    } catch (e) {
      setErrMsg(e?.message || "Delete failed.");
    } finally {
      setDelBusy(false);
    }
  };

  const validatePayload = (p) => {
    if (!Number.isFinite(p.template_day_id) || p.template_day_id <= 0) return "template_day_id is required.";
    if (!String(p.slot_type || "").trim()) return "slot_type is required.";

    // optional ranges
    if (p.reps_min != null && p.reps_max != null) {
      if (Number(p.reps_min) > Number(p.reps_max)) return "reps_min must be <= reps_max";
    }
    return "";
  };

  const save = async () => {
    if (!form) return;

    const payload = {
      template_day_id: safeNum(form.template_day_id, 0),

      slot_type: String(form.slot_type || "").trim(),

      // allow null
      exercise_id: form.exercise_id === "" ? null : safeNum(form.exercise_id, null),

      sets: form.sets === "" ? null : safeNum(form.sets, null),
      reps_min: form.reps_min === "" ? null : safeNum(form.reps_min, null),
      reps_max: form.reps_max === "" ? null : safeNum(form.reps_max, null),
      rest_seconds: form.rest_seconds === "" ? null : safeNum(form.rest_seconds, null),

      order_index: form.order_index === "" ? null : safeNum(form.order_index, null),
    };

    const msg = validatePayload(payload);
    if (msg) {
      setErrMsg(msg);
      return;
    }

    setBusy(true);
    setErrMsg("");

    try {
      if (mode === "add") {
        await createTemplateDayExercise(payload);
      } else if (mode === "edit") {
        if (!active) throw new Error("No item selected.");
        // update endpoint does not require template_day_id but it's okay to send it;
        // if you want strict, remove it:
        const { template_day_id, ...updatePayload } = payload;
        await updateTemplateDayExercise(active.id, updatePayload);
      }

      setOpen(false);
      setSaveOpen(false);
      reloadItems();
    } catch (e) {
      setErrMsg(e?.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

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

  const modalTitle =
    mode === "add"
      ? "Add Day Exercise"
      : mode === "edit"
      ? "Edit Day Exercise"
      : "View Day Exercise";

  const canEdit = isAdmin && (mode === "edit" || mode === "add");

  const handleReload = () => {
    reloadTpls();
    if (templateId) reloadDays();
    if (templateDayId) reloadItems();
  };

  return (
    <div className="ae-page" data-theme={theme} style={cssVars}>
      <div className="ae-topRow">
        <div className="ae-titleWrap">
          <div className="ae-pageTitle">Template Day Exercises</div>
          <div className="ae-headerPills">
            {headerPills.map((p, idx) => (
              <span key={idx} className={idx === 0 ? "ae-pill" : "ae-pillMuted"}>
                {p}
              </span>
            ))}
          </div>
        </div>

        <div className="ae-topActions">
          <button className="ae-btn ae-btnSecondary" onClick={handleReload}>
            Reload
          </button>
        </div>
      </div>

      <div className="ae-panelOuter">
        <div className="ae-panel">
          <div className="ae-panelTop">
            <div
              className="ae-leftActions"
              style={{ gap: 10, display: "flex", alignItems: "center", flexWrap: "wrap" }}
            >
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="ae-fieldInput"
                style={{ width: 320 }}
              >
                <option value="">Select a template…</option>
                {templates.map((tpl) => (
                  <option key={tpl.template_id} value={tpl.template_id}>
                    #{tpl.template_id} — {tpl.goal} / {tpl.level} / {tpl.split_type} ({tpl.days_per_week}d)
                  </option>
                ))}
              </select>

              <select
                value={templateDayId}
                onChange={(e) => setTemplateDayId(e.target.value)}
                className="ae-fieldInput"
                style={{ width: 260 }}
                disabled={!templateId || loadingDays}
              >
                <option value="">
                  {!templateId ? "Select a template first…" : "Select a day…"}
                </option>
                {days.map((d) => (
                  <option key={d.template_day_id} value={d.template_day_id}>
                    Day {d.day_number} {d.focus ? `— ${d.focus}` : ""} (#{d.template_day_id})
                  </option>
                ))}
              </select>

              {isAdmin ? (
                <button className="ae-btn ae-btnPrimary" onClick={openAdd} disabled={!templateDayId}>
                  + Add Exercise
                </button>
              ) : null}
            </div>

            <div className="ae-rightActions">
              <div className="ae-searchBox">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search…"
                  className="ae-searchInput"
                  disabled={!templateDayId}
                />
                <span className="ae-searchIcon">⌕</span>
              </div>
            </div>
          </div>

          <div className="ae-tableWrap">
            {tplErr ? <div className="ae-errorBox">{tplErr}</div> : null}
            {daysErr ? <div className="ae-errorBox">{daysErr}</div> : null}

            {!templateId ? (
              <div className="ae-td" style={{ padding: 16 }}>
                Pick a template first.
              </div>
            ) : !templateDayId ? (
              <div className="ae-td" style={{ padding: 16 }}>
                Pick a day to view exercises.
              </div>
            ) : itemsErr ? (
              <div className="ae-errorBox">{itemsErr}</div>
            ) : (
              <table className="ae-table">
                <thead>
                  <tr>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "order"))}>
                      Order{sortIndicator(sort, "order")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "slot"))}>
                      Slot{sortIndicator(sort, "slot")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "exercise"))}>
                      Exercise{sortIndicator(sort, "exercise")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "sets"))}>
                      Sets{sortIndicator(sort, "sets")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "reps"))}>
                      Reps{sortIndicator(sort, "reps")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "rest"))}>
                      Rest(s){sortIndicator(sort, "rest")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "updated"))}>
                      Updated{sortIndicator(sort, "updated")}
                    </th>
                    <th className="ae-th ae-thRight" />
                  </tr>
                </thead>

                <tbody>
                  {loadingItems ? (
                    <tr>
                      <td className="ae-td" colSpan={8}>
                        Loading…
                      </td>
                    </tr>
                  ) : pageRows.length === 0 ? (
                    <tr>
                      <td className="ae-td" colSpan={8}>
                        No exercises.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((r) => (
                      <tr className="ae-tr" key={r.id}>
                        <td className="ae-td">
                          <div className="ae-equipMeta">
                            <div className="ae-equipName">#{r.order_index ?? "-"}</div>
                            <div className="ae-mutedTiny">ID: {r.id}</div>
                          </div>
                        </td>

                        <td className="ae-td">{r.slot_type || "-"}</td>
                        <td className="ae-td">
                          {r?.exercise?.name || (r.exercise_id ? `Exercise #${r.exercise_id}` : "-")}
                        </td>
                        <td className="ae-td">{r.sets ?? "-"}</td>
                        <td className="ae-td">
                          {r.reps_min && r.reps_max
                            ? `${r.reps_min}-${r.reps_max}`
                            : r.reps_min
                            ? `${r.reps_min}+`
                            : r.reps_max
                            ? `<=${r.reps_max}`
                            : "-"}
                        </td>
                        <td className="ae-td">{r.rest_seconds ?? "-"}</td>
                        <td className="ae-td ae-mutedCell">{formatDateTimeFallback(r.updated_at)}</td>

                        <td className="ae-td ae-tdRight">
                          <div className="ae-actionsInline">
                            <IconBtn title="View" className="ae-iconBtn" onClick={() => openView(r)}>
                              👁
                            </IconBtn>
                            {isAdmin ? (
                              <>
                                <IconBtn title="Edit" className="ae-iconBtn" onClick={() => openEdit(r)}>
                                  ✎
                                </IconBtn>
                                <IconBtn title="Delete" className="ae-iconBtnDanger" onClick={() => askDelete(r)}>
                                  🗑
                                </IconBtn>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {templateDayId ? (
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
          ) : null}
        </div>
      </div>

      {/* Modal */}
      {open && form && (
        <div className="ae-backdrop" onClick={() => setOpen(false)}>
          <div className="ae-formModal" onClick={(e) => e.stopPropagation()}>
            <div className="ae-modalTopRow">
              <div className="ae-modalTitle">{modalTitle}</div>
            </div>

            {errMsg ? <div className="ae-alert ae-alertError">{errMsg}</div> : null}

            <div className="ae-formGrid">
              <Field
                label="Template Day ID"
                value={String(form.template_day_id)}
                disabled
                full
                onChange={() => {}}
              />

              <Field
                label="Slot type"
                value={form.slot_type}
                disabled={!canEdit}
                full
                onChange={(v) => setForm((p) => ({ ...p, slot_type: v }))}
              />

              <NumberField
                label="Exercise ID (optional)"
                value={form.exercise_id}
                disabled={!canEdit}
                min={""}
                max={""}
                onChange={(v) => setForm((p) => ({ ...p, exercise_id: v }))}
              />

              <NumberField
                label="Sets (optional)"
                value={form.sets}
                disabled={!canEdit}
                min={1}
                max={20}
                onChange={(v) => setForm((p) => ({ ...p, sets: v }))}
              />

              <NumberField
                label="Reps min (optional)"
                value={form.reps_min}
                disabled={!canEdit}
                min={1}
                max={100}
                onChange={(v) => setForm((p) => ({ ...p, reps_min: v }))}
              />

              <NumberField
                label="Reps max (optional)"
                value={form.reps_max}
                disabled={!canEdit}
                min={1}
                max={100}
                onChange={(v) => setForm((p) => ({ ...p, reps_max: v }))}
              />

              <NumberField
                label="Rest seconds (optional)"
                value={form.rest_seconds}
                disabled={!canEdit}
                min={0}
                max={600}
                onChange={(v) => setForm((p) => ({ ...p, rest_seconds: v }))}
              />

              <NumberField
                label="Order index (optional)"
                value={form.order_index}
                disabled={!canEdit}
                min={1}
                max={200}
                onChange={(v) => setForm((p) => ({ ...p, order_index: v }))}
              />
            </div>

            <div className="ae-modalFooter">
              {mode === "view" ? (
                isAdmin ? (
                  <>
                    <button className="ae-btn ae-btnSecondary" onClick={() => askDelete(active)}>
                      Delete
                    </button>
                    <button className="ae-btn ae-btnPrimary" onClick={() => setMode("edit")}>
                      Edit
                    </button>
                  </>
                ) : (
                  <button className="ae-btn ae-btnSecondary" onClick={() => setOpen(false)}>
                    Close
                  </button>
                )
              ) : (
                <>
                  <button
                    className="ae-btn ae-btnSecondary"
                    onClick={() => {
                      setErrMsg("");
                      setSaveOpen(false);
                      if (mode === "add") setOpen(false);
                      else setMode("view");
                    }}
                    disabled={busy}
                  >
                    Cancel
                  </button>

                  <button className="ae-btn ae-btnPrimary" onClick={() => setSaveOpen(true)} disabled={busy}>
                    {busy ? "Saving…" : "Save"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Save */}
      {saveOpen && open && form && (
        <div className="ae-backdrop ae-backdropTop" onClick={() => setSaveOpen(false)}>
          <div className="ae-confirmModalFancy" onClick={(e) => e.stopPropagation()}>
            <div className="ae-confirmHeader">
              <div className="ae-confirmIconWrap" aria-hidden="true">
                ✅
              </div>
              <div className="ae-confirmHeaderText">
                <div className="ae-confirmTitle">{mode === "add" ? "Add exercise?" : "Confirm changes?"}</div>
                <div className="ae-mutedTiny">
                  You’re editing Day <b className="ae-strongText">#{form.template_day_id}</b>.
                </div>
              </div>
              <button className="ae-modalClose" onClick={() => setSaveOpen(false)}>
                ✕
              </button>
            </div>

            {errMsg ? <div className="ae-alert ae-alertError">{errMsg}</div> : null}

            <div className="ae-confirmActions">
              <button className="ae-btn ae-btnSecondary" onClick={() => setSaveOpen(false)} disabled={busy}>
                Cancel
              </button>
              <button className="ae-btn ae-btnPrimary" onClick={save} disabled={busy}>
                {busy ? "Saving…" : mode === "add" ? "Yes, add" : "Yes, save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {delOpen && active && (
        <div className="ae-backdrop ae-backdropTop" onClick={() => setDelOpen(false)}>
          <div className="ae-confirmModalFancy" onClick={(e) => e.stopPropagation()}>
            <div className="ae-confirmHeader">
              <div className="ae-confirmIconWrap" aria-hidden="true">
                ⚠️
              </div>
              <div className="ae-confirmHeaderText">
                <div className="ae-confirmTitle">Delete exercise?</div>
                <div className="ae-mutedTiny">
                  This will remove <b className="ae-strongText">Order {active.order_index ?? "-"}</b> from Day{" "}
                  <b className="ae-strongText">#{active.template_day_id}</b>.
                </div>
              </div>
              <button className="ae-modalClose" onClick={() => setDelOpen(false)}>
                ✕
              </button>
            </div>

            {errMsg ? <div className="ae-alert ae-alertError">{errMsg}</div> : null}

            <div className="ae-confirmActions">
              <button className="ae-btn ae-btnSecondary" onClick={() => setDelOpen(false)} disabled={delBusy}>
                Keep it
              </button>
              <button className="ae-btn ae-btnDanger" onClick={doDelete} disabled={delBusy}>
                <span className="ae-btnIcon" aria-hidden="true">
                  🗑
                </span>
                {delBusy ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="ae-spacer" />
    </div>
  );
}

/* ============================================================
   Tiny UI components (matches your Admin styles)
============================================================ */
function IconBtn({ children, title, className, onClick }) {
  return (
    <button type="button" title={title} onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function Field({ label, value, onChange, disabled, full }) {
  return (
    <label className={`ae-field ${full ? "ae-fieldFull" : ""}`}>
      <div className="ae-fieldLabel">{label}</div>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`ae-fieldInput ${disabled ? "ae-fieldInputDisabled" : ""}`}
      />
    </label>
  );
}

function NumberField({ label, value, onChange, disabled, min, max }) {
  return (
    <label className="ae-field">
      <div className="ae-fieldLabel">{label}</div>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`ae-fieldInput ${disabled ? "ae-fieldInputDisabled" : ""}`}
      />
    </label>
  );
}
