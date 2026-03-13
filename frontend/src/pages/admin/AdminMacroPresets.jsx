// src/pages/admin/AdminMacroPresets.jsx
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

import {
  getAdminMacroPresets,
  createMacroPreset,
  updateMacroPreset,
  deleteMacroPreset,
  toggleMacroPreset,
  calculateMacroPreset,
} from "../../utils/macroPresetApi";

import "./AdminEquipments.css";

const ACTIVE_OPTIONS = [
  { label: "All", value: "All" },
  { label: "Active", value: "1" },
  { label: "Inactive", value: "0" },
];

function normalizeRows(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

export default function AdminMacroPresets() {
  const outlet = useOutletContext() || {};
  const theme = outlet.theme || "light";

  const t = adminThemes[theme]?.app || adminThemes.light.app;
  const isDark = theme === "dark";

  const { isAdmin } = useAuthMe();

  const [q, setQ] = useState("");
  const [active, setActive] = useState("All");

  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [error, setError] = useState("");

  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const pageSize = 10;
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("view"); // view | add | edit
  const [activeRow, setActiveRow] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState("");

  const [delOpen, setDelOpen] = useState(false);
  const [delBusy, setDelBusy] = useState(false);

  const [calcCalories, setCalcCalories] = useState("2000");
  const [calcResult, setCalcResult] = useState(null);
  const [calcErr, setCalcErr] = useState("");

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setModalOpen(false);
        setDelOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [q, active]);

  const reload = async () => {
    setError("");
    setLoadingRows(true);

    try {
      if (!isAdmin) {
        setRows([]);
        return;
      }

      const data = await getAdminMacroPresets({
        limit: 5000,
        q: q.trim() || undefined,
        active: active !== "All" ? active : undefined,
      });

      setRows(normalizeRows(data));
    } catch (e) {
      setError(e.message || "Failed to load macro presets.");
      setRows([]);
    } finally {
      setLoadingRows(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const searched = useMemo(() => {
    return globalSearch(rows || [], q, [(r) => r.id, (r) => r.name]);
  }, [rows, q]);

  const filtered = useMemo(() => {
    return searched.filter((r) =>
      active === "All" ? true : String(Number(!!r.is_active)) === active
    );
  }, [searched, active]);

  const getValue = (r, key) => {
    switch (key) {
      case "name":
        return tableValue.str(r.name);
      case "protein":
        return tableValue.num(r.protein_percent);
      case "carbs":
        return tableValue.num(r.carbs_percent);
      case "fats":
        return tableValue.num(r.fats_percent);
      case "active":
        return tableValue.num(r.is_active ? 1 : 0);
      default:
        return "";
    }
  };

  const sorted = useMemo(() => sortRows(filtered, sort, getValue), [filtered, sort]);

  const { totalPages, safePage, pageRows, left, right } = useMemo(
    () => paginate(sorted, page, pageSize),
    [sorted, page]
  );

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

  const openAdd = () => {
    setFormErr("");
    setMode("add");
    setActiveRow(null);
    setCalcResult(null);
    setCalcErr("");
    setCalcCalories("2000");
    setForm({
      name: "",
      protein_percent: "30",
      carbs_percent: "40",
      fats_percent: "30",
      is_active: true,
    });
    setModalOpen(true);
  };

  const openView = (r) => {
    setFormErr("");
    setMode("view");
    setActiveRow(r);
    setCalcResult(null);
    setCalcErr("");
    setCalcCalories("2000");
    setForm({
      name: r?.name ?? "",
      protein_percent: String(r?.protein_percent ?? ""),
      carbs_percent: String(r?.carbs_percent ?? ""),
      fats_percent: String(r?.fats_percent ?? ""),
      is_active: !!r?.is_active,
    });
    setModalOpen(true);
  };

  const openEdit = (r) => {
    if (!r) return;
    setFormErr("");
    setMode("edit");
    setActiveRow(r);
    setCalcResult(null);
    setCalcErr("");
    setCalcCalories("2000");
    setForm({
      name: r?.name ?? "",
      protein_percent: String(r?.protein_percent ?? ""),
      carbs_percent: String(r?.carbs_percent ?? ""),
      fats_percent: String(r?.fats_percent ?? ""),
      is_active: !!r?.is_active,
    });
    setModalOpen(true);
  };

  const askDelete = (r) => {
    setFormErr("");
    setActiveRow(r);
    setDelOpen(true);
  };

  const doDelete = async () => {
    if (!activeRow) return;

    setDelBusy(true);
    setFormErr("");

    try {
      await deleteMacroPreset(activeRow.id);
      setDelOpen(false);
      setModalOpen(false);
      await reload();
    } catch (e) {
      setFormErr(e.message || "Delete failed.");
    } finally {
      setDelBusy(false);
    }
  };

  const doToggle = async (r) => {
    if (!r?.id) return;

    setFormErr("");

    try {
      await toggleMacroPreset(r.id);
      await reload();
    } catch (e) {
      setFormErr(e.message || "Toggle failed.");
    }
  };

  const canEdit = isAdmin && (mode === "add" || mode === "edit");

  const modalTitle =
    mode === "add"
      ? "Add Macro Preset"
      : mode === "edit"
      ? "Edit Macro Preset"
      : "View Macro Preset";

  const save = async () => {
    if (!form) return;

    const name = String(form.name || "").trim();
    if (!name) {
      setFormErr("Name is required.");
      return;
    }

    const protein = Number(form.protein_percent);
    const carbs = Number(form.carbs_percent);
    const fats = Number(form.fats_percent);

    if ([protein, carbs, fats].some((x) => Number.isNaN(x))) {
      setFormErr("Protein/Carbs/Fats must be numbers.");
      return;
    }

    const sum = protein + carbs + fats;
    if (Math.abs(sum - 100) > 0.01) {
      setFormErr("Macro percentages must total 100.");
      return;
    }

    setBusy(true);
    setFormErr("");

    try {
      const payload = {
        name,
        protein_percent: protein,
        carbs_percent: carbs,
        fats_percent: fats,
        is_active: !!form.is_active,
      };

      if (mode === "add") {
        await createMacroPreset(payload);
      } else if (mode === "edit") {
        if (!activeRow?.id) throw new Error("No preset selected.");
        await updateMacroPreset(activeRow.id, payload);
      }

      setModalOpen(false);
      await reload();
    } catch (e) {
      setFormErr(e.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const runCalc = async () => {
    setCalcErr("");
    setCalcResult(null);

    if (!activeRow?.id) {
      setCalcErr("Save the preset first to calculate.");
      return;
    }

    const cals = Number(calcCalories);
    if (Number.isNaN(cals) || cals < 500 || cals > 10000) {
      setCalcErr("Calories must be between 500 and 10000.");
      return;
    }

    try {
      const res = await calculateMacroPreset(activeRow.id, cals);
      setCalcResult(res?.data || res || null);
    } catch (e) {
      setCalcErr(e.message || "Calculation failed.");
    }
  };

  return (
    <div className="ae-page" data-theme={theme} style={cssVars}>
      <div className="ae-topRow">
        <div className="ae-titleWrap">
          <div className="ae-pageTitle">Macro Presets</div>
        </div>

        <div className="ae-topActions">
          <button className="ae-btn ae-btnSecondary" onClick={reload}>
            Reload
          </button>

          {isAdmin ? (
            <button className="ae-btn ae-btnPrimary" onClick={openAdd}>
              + Add Preset
            </button>
          ) : null}
        </div>
      </div>

      <div className="ae-panelOuter">
        <div className="ae-panel">
          <div className="ae-panelTop">
            <div className="ae-leftActions">
              {formErr ? <div className="ae-alert ae-alertError">{formErr}</div> : null}
              {!isAdmin ? <div className="ae-mutedSmall">Admins only.</div> : null}
            </div>

            <div className="ae-rightActions">
              <div className="ae-searchBox">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search presets…"
                  className="ae-searchInput"
                />
                <span className="ae-searchIcon">⌕</span>
              </div>

              <select
                value={active}
                onChange={(e) => setActive(e.target.value)}
                className="ae-select"
              >
                {ACTIVE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
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
                    <th
                      className="ae-th ae-thClickable"
                      onClick={() => setSort((p) => toggleSort(p, "name"))}
                    >
                      Name{sortIndicator(sort, "name")}
                    </th>
                    <th
                      className="ae-th ae-thClickable"
                      onClick={() => setSort((p) => toggleSort(p, "protein"))}
                    >
                      Protein %{sortIndicator(sort, "protein")}
                    </th>
                    <th
                      className="ae-th ae-thClickable"
                      onClick={() => setSort((p) => toggleSort(p, "carbs"))}
                    >
                      Carbs %{sortIndicator(sort, "carbs")}
                    </th>
                    <th
                      className="ae-th ae-thClickable"
                      onClick={() => setSort((p) => toggleSort(p, "fats"))}
                    >
                      Fats %{sortIndicator(sort, "fats")}
                    </th>
                    <th
                      className="ae-th ae-thClickable"
                      onClick={() => setSort((p) => toggleSort(p, "active"))}
                    >
                      Active{sortIndicator(sort, "active")}
                    </th>
                    <th className="ae-th ae-thRight" />
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
                      <tr className="ae-tr" key={r.id}>
                        <td className="ae-td">
                          <div className="ae-equipCell">
                            <div className="ae-equipMeta">
                              <div className="ae-equipName">{r.name || "-"}</div>
                              <div className="ae-mutedTiny">ID: {r.id}</div>
                            </div>
                          </div>
                        </td>

                        <td className="ae-td">{r.protein_percent ?? "-"}</td>
                        <td className="ae-td">{r.carbs_percent ?? "-"}</td>
                        <td className="ae-td">{r.fats_percent ?? "-"}</td>
                        <td className="ae-td">{r.is_active ? "Yes" : "No"}</td>

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

                                <IconBtn
                                  title={r.is_active ? "Deactivate" : "Activate"}
                                  className="ae-iconBtn"
                                  onClick={() => doToggle(r)}
                                >
                                  ⏻
                                </IconBtn>

                                <IconBtn
                                  title="Delete"
                                  className="ae-iconBtnDanger"
                                  onClick={() => askDelete(r)}
                                >
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

      {modalOpen && form && (
        <div className="ae-backdrop" onClick={() => setModalOpen(false)}>
          <div className="ae-formModal" onClick={(e) => e.stopPropagation()}>
            <div className="ae-modalTopRow">
              <div className="ae-modalTitle">{modalTitle}</div>
            </div>

            {formErr ? <div className="ae-alert ae-alertError">{formErr}</div> : null}

            <div className="ae-formGrid">
              <Field
                label="Name"
                value={form.name}
                disabled={!canEdit}
                onChange={(v) => setForm((p) => ({ ...p, name: v }))}
              />

              <Field
                label="Protein %"
                value={form.protein_percent}
                disabled={!canEdit}
                onChange={(v) => setForm((p) => ({ ...p, protein_percent: v }))}
              />

              <Field
                label="Carbs %"
                value={form.carbs_percent}
                disabled={!canEdit}
                onChange={(v) => setForm((p) => ({ ...p, carbs_percent: v }))}
              />

              <Field
                label="Fats %"
                value={form.fats_percent}
                disabled={!canEdit}
                onChange={(v) => setForm((p) => ({ ...p, fats_percent: v }))}
              />

              <label className="ae-field ae-fieldFull">
                <div className="ae-fieldLabel">Active</div>
                <select
                  value={form.is_active ? "1" : "0"}
                  disabled={!canEdit}
                  className={`ae-select ${!canEdit ? "ae-fieldInputDisabled" : ""}`}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, is_active: e.target.value === "1" }))
                  }
                  style={{ height: 42 }}
                >
                  <option value="1">Yes</option>
                  <option value="0">No</option>
                </select>
              </label>

              {mode !== "add" ? (
                <div className="ae-field ae-fieldFull">
                  <div className="ae-fieldLabel">Calculator (grams)</div>

                  <div className="ae-inlineTools" style={{ justifyContent: "flex-start" }}>
                    <input
                      value={calcCalories}
                      onChange={(e) => setCalcCalories(e.target.value)}
                      className="ae-fieldInput"
                      style={{ maxWidth: 180 }}
                      placeholder="Calories"
                    />
                    <button className="ae-btn ae-btnSecondary" onClick={runCalc}>
                      Calculate
                    </button>
                  </div>

                  {calcErr ? <div className="ae-alert ae-alertError">{calcErr}</div> : null}

                  {calcResult?.macros ? (
                    <div className="ae-alert ae-alertNeutral" style={{ marginTop: 10 }}>
                      <div className="ae-alertTitle">
                        For {calcResult.total_calories} calories
                      </div>
                      <div className="ae-mutedTiny">
                        Protein:{" "}
                        <b className="ae-strongText">
                          {calcResult.macros.protein?.grams ?? 0}g
                        </b>{" "}
                        • Carbs:{" "}
                        <b className="ae-strongText">
                          {calcResult.macros.carbs?.grams ?? 0}g
                        </b>{" "}
                        • Fats:{" "}
                        <b className="ae-strongText">
                          {calcResult.macros.fats?.grams ?? 0}g
                        </b>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="ae-modalFooter">
              {mode === "view" ? (
                isAdmin ? (
                  <>
                    <button
                      className="ae-btn ae-btnSecondary"
                      onClick={() => askDelete(activeRow)}
                    >
                      Delete
                    </button>
                    <button
                      className="ae-btn ae-btnPrimary"
                      onClick={() => openEdit(activeRow)}
                    >
                      Edit
                    </button>
                  </>
                ) : (
                  <button
                    className="ae-btn ae-btnSecondary"
                    onClick={() => setModalOpen(false)}
                  >
                    Close
                  </button>
                )
              ) : (
                <>
                  <button
                    className="ae-btn ae-btnSecondary"
                    onClick={() => {
                      setFormErr("");
                      if (mode === "add") {
                        setModalOpen(false);
                      } else if (activeRow) {
                        openView(activeRow);
                      } else {
                        setModalOpen(false);
                      }
                    }}
                    disabled={busy}
                  >
                    Cancel
                  </button>

                  <button className="ae-btn ae-btnPrimary" onClick={save} disabled={busy}>
                    {busy ? "Saving…" : "Save"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {delOpen && activeRow && (
        <div className="ae-backdrop ae-backdropTop" onClick={() => setDelOpen(false)}>
          <div className="ae-confirmModalFancy" onClick={(e) => e.stopPropagation()}>
            <div className="ae-confirmHeader">
              <div className="ae-confirmIconWrap" aria-hidden="true">
                ⚠️
              </div>

              <div className="ae-confirmHeaderText">
                <div className="ae-confirmTitle">Delete preset?</div>
                <div className="ae-mutedTiny">
                  This will permanently remove{" "}
                  <b className="ae-strongText">{activeRow.name}</b>. This can’t be undone.
                </div>
              </div>

              <button className="ae-modalClose" onClick={() => setDelOpen(false)}>
                ✕
              </button>
            </div>

            {formErr ? <div className="ae-alert ae-alertError">{formErr}</div> : null}

            <div className="ae-confirmActions">
              <button
                className="ae-btn ae-btnSecondary"
                onClick={() => setDelOpen(false)}
                disabled={delBusy}
              >
                Keep it
              </button>

              <button className="ae-btn ae-btnDanger" onClick={doDelete} disabled={delBusy}>
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