// src/pages/admin/AdminIngredients.jsx
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
  getAdminIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  toggleIngredient,
} from "../../utils/ingredientApi";

import "./AdminEquipments.css";

const ACTIVE_OPTIONS = [
  { label: "All", value: "All" },
  { label: "Active", value: "1" },
  { label: "Inactive", value: "0" },
];

export default function AdminIngredients() {
  const { theme } = useOutletContext();
  const t = adminThemes[theme]?.app || adminThemes.light.app;
  const isDark = theme === "dark";

  const { isAdmin } = useAuthMe();

  const [q, setQ] = useState("");
  const [active, setActive] = useState("All");
  const [category, setCategory] = useState("All");

  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [error, setError] = useState("");

  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const pageSize = 10;
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("view"); // view | add | edit
  const [activeRow, setActiveRow] = useState(null);
  const [form, setForm] = useState(null);
  const [formBusy, setFormBusy] = useState(false);
  const [formErr, setFormErr] = useState("");

  const [delOpen, setDelOpen] = useState(false);
  const [delBusy, setDelBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setFormOpen(false);
        setDelOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => setPage(1), [q, active, category]);

  const reload = async () => {
    setError("");
    setLoadingRows(true);
    try {
      if (!isAdmin) {
        setRows([]);
        return;
      }

      const data = await getAdminIngredients({
        limit: 5000,
        q: q.trim() || undefined,
        active: active !== "All" ? active : undefined,
        category: category !== "All" ? category : undefined,
      });

      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load ingredients.");
      setRows([]);
    } finally {
      setLoadingRows(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // list filter dropdown values
  const categories = useMemo(() => {
    const set = new Set((rows || []).map((r) => r.category).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [rows]);

  // form dropdown values: use existing categories but ALSO include the currently selected one (if not in rows yet)
  const formCategoryOptions = useMemo(() => {
    const set = new Set((rows || []).map((r) => r.category).filter(Boolean));
    if (form?.category) set.add(form.category);
    return Array.from(set).sort();
  }, [rows, form?.category]);

  const searched = useMemo(() => {
    return globalSearch(rows || [], q, [
      (r) => r.id,
      (r) => r.name,
      (r) => r.category,
      (r) => r.typical_unit,
    ]);
  }, [rows, q]);

  const filtered = useMemo(() => {
    return searched
      .filter((r) => (active === "All" ? true : String(Number(!!r.is_active)) === active))
      .filter((r) => (category === "All" ? true : r.category === category));
  }, [searched, active, category]);

  const getValue = (r, key) => {
    switch (key) {
      case "name":
        return tableValue.str(r.name);
      case "category":
        return tableValue.str(r.category);
      case "cal":
        return tableValue.num(r.calories_per_100g);
      case "protein":
        return tableValue.num(r.protein_per_100g);
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
    setFormMode("add");
    setActiveRow(null);
    setForm({
      name: "",
      category: "",
      calories_per_100g: "",
      protein_per_100g: "",
      carbs_per_100g: "",
      fats_per_100g: "",
      average_cost_per_kg: "",
      typical_unit: "",
      common_stores: "",
      diet_compatible: "",
      allergen_tags: "",
      is_active: true,
    });
    setFormOpen(true);
  };

  const openView = (r) => {
    setFormErr("");
    setFormMode("view");
    setActiveRow(r);
    setForm({
      name: r.name ?? "",
      category: r.category ?? "",
      calories_per_100g: r.calories_per_100g ?? "",
      protein_per_100g: r.protein_per_100g ?? "",
      carbs_per_100g: r.carbs_per_100g ?? "",
      fats_per_100g: r.fats_per_100g ?? "",
      average_cost_per_kg: r.average_cost_per_kg ?? "",
      typical_unit: r.typical_unit ?? "",
      common_stores: r.common_stores ?? "",
      diet_compatible: r.diet_compatible ?? "",
      allergen_tags: r.allergen_tags ?? "",
      is_active: !!r.is_active,
    });
    setFormOpen(true);
  };

  const openEdit = (r) => {
    setFormErr("");
    setFormMode("edit");
    setActiveRow(r);
    setForm({
      name: r.name ?? "",
      category: r.category ?? "",
      calories_per_100g: r.calories_per_100g ?? "",
      protein_per_100g: r.protein_per_100g ?? "",
      carbs_per_100g: r.carbs_per_100g ?? "",
      fats_per_100g: r.fats_per_100g ?? "",
      average_cost_per_kg: r.average_cost_per_kg ?? "",
      typical_unit: r.typical_unit ?? "",
      common_stores: r.common_stores ?? "",
      diet_compatible: r.diet_compatible ?? "",
      allergen_tags: r.allergen_tags ?? "",
      is_active: !!r.is_active,
    });
    setFormOpen(true);
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
      await deleteIngredient(activeRow.id);
      setDelOpen(false);
      setFormOpen(false);
      reload();
    } catch (e) {
      setFormErr(e.message || "Delete failed.");
    } finally {
      setDelBusy(false);
    }
  };

  const save = async () => {
    if (!form) return;

    const name = String(form.name || "").trim();
    if (!name) {
      setFormErr("Name is required.");
      return;
    }

    setFormBusy(true);
    setFormErr("");
    try {
      const payload = {
        name,
        category: String(form.category || "").trim() || null,
        calories_per_100g: form.calories_per_100g === "" ? null : Number(form.calories_per_100g),
        protein_per_100g: form.protein_per_100g === "" ? null : Number(form.protein_per_100g),
        carbs_per_100g: form.carbs_per_100g === "" ? null : Number(form.carbs_per_100g),
        fats_per_100g: form.fats_per_100g === "" ? null : Number(form.fats_per_100g),
        average_cost_per_kg: form.average_cost_per_kg === "" ? null : Number(form.average_cost_per_kg),
        typical_unit: String(form.typical_unit || "").trim() || null,
        common_stores: form.common_stores ?? null,
        diet_compatible: form.diet_compatible ?? null,
        allergen_tags: form.allergen_tags ?? null,
        is_active: !!form.is_active,
      };

      if (formMode === "add") {
        await createIngredient(payload);
      } else if (formMode === "edit") {
        if (!activeRow) throw new Error("No ingredient selected.");
        await updateIngredient(activeRow.id, payload);
      }

      setFormOpen(false);
      reload();
    } catch (e) {
      setFormErr(e.message || "Save failed.");
    } finally {
      setFormBusy(false);
    }
  };

  const doToggle = async (r) => {
    setFormErr("");
    try {
      await toggleIngredient(r.id);
      reload();
    } catch (e) {
      setFormErr(e.message || "Toggle failed.");
    }
  };

  const canEdit = isAdmin && (formMode === "add" || formMode === "edit");
  const modalTitle =
    formMode === "add" ? "Add Ingredient" : formMode === "edit" ? "Edit Ingredient" : "View Ingredient";

  return (
    <div className="ae-page" data-theme={theme} style={cssVars}>
      <div className="ae-topRow">
        <div className="ae-titleWrap">
          <div className="ae-pageTitle">Ingredients</div>
        </div>

        <div className="ae-topActions">
          <button className="ae-btn ae-btnSecondary" onClick={reload}>
            Reload
          </button>

          {isAdmin ? (
            <button className="ae-btn ae-btnPrimary" onClick={openAdd}>
              + Add Ingredient
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
                  placeholder="Search ingredients…"
                  className="ae-searchInput"
                />
                <span className="ae-searchIcon">⌕</span>
              </div>

              <select value={active} onChange={(e) => setActive(e.target.value)} className="ae-select">
                {ACTIVE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              <select value={category} onChange={(e) => setCategory(e.target.value)} className="ae-select">
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
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
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "name"))}>
                      Name{sortIndicator(sort, "name")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "category"))}>
                      Category{sortIndicator(sort, "category")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "cal"))}>
                      Calories{sortIndicator(sort, "cal")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "protein"))}>
                      Protein{sortIndicator(sort, "protein")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "active"))}>
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

                        <td className="ae-td">{r.category || "-"}</td>
                        <td className="ae-td">{r.calories_per_100g ?? "-"}</td>
                        <td className="ae-td">{r.protein_per_100g ?? "-"}</td>
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

      {formOpen && form && (
        <div className="ae-backdrop" onClick={() => setFormOpen(false)}>
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

              {/* ✅ Category dropdown in View + Edit (disabled in view) */}
              <label className="ae-field">
                <div className="ae-fieldLabel">Category</div>
                <select
                  value={form.category || ""}
                  disabled={!canEdit}
                  className={`ae-select ${!canEdit ? "ae-fieldInputDisabled" : ""}`}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  style={{ height: 42 }}
                >
                  <option value="">—</option>
                  {formCategoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <Field
                label="Calories / 100g"
                value={String(form.calories_per_100g ?? "")}
                disabled={!canEdit}
                onChange={(v) => setForm((p) => ({ ...p, calories_per_100g: v }))}
              />

              <Field
                label="Protein / 100g"
                value={String(form.protein_per_100g ?? "")}
                disabled={!canEdit}
                onChange={(v) => setForm((p) => ({ ...p, protein_per_100g: v }))}
              />

              <Field
                label="Carbs / 100g"
                value={String(form.carbs_per_100g ?? "")}
                disabled={!canEdit}
                onChange={(v) => setForm((p) => ({ ...p, carbs_per_100g: v }))}
              />

              <Field
                label="Fats / 100g"
                value={String(form.fats_per_100g ?? "")}
                disabled={!canEdit}
                onChange={(v) => setForm((p) => ({ ...p, fats_per_100g: v }))}
              />

              <Field
                label="Average cost / kg"
                value={String(form.average_cost_per_kg ?? "")}
                disabled={!canEdit}
                onChange={(v) => setForm((p) => ({ ...p, average_cost_per_kg: v }))}
              />

              <Field
                label="Typical unit"
                value={String(form.typical_unit ?? "")}
                disabled={!canEdit}
                onChange={(v) => setForm((p) => ({ ...p, typical_unit: v }))}
              />

              {/* Active dropdown: also disabled in view */}
              <label className="ae-field ae-fieldFull">
                <div className="ae-fieldLabel">Active</div>
                <select
                  value={form.is_active ? "1" : "0"}
                  disabled={!canEdit}
                  className={`ae-select ${!canEdit ? "ae-fieldInputDisabled" : ""}`}
                  onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.value === "1" }))}
                  style={{ height: 42 }}
                >
                  <option value="1">Yes</option>
                  <option value="0">No</option>
                </select>
              </label>
            </div>

            <div className="ae-modalFooter">
              {formMode === "view" ? (
                isAdmin ? (
                  <>
                    <button className="ae-btn ae-btnSecondary" onClick={() => askDelete(activeRow)}>
                      Delete
                    </button>
                    <button className="ae-btn ae-btnPrimary" onClick={() => setFormMode("edit")}>
                      Edit
                    </button>
                  </>
                ) : (
                  <button className="ae-btn ae-btnSecondary" onClick={() => setFormOpen(false)}>
                    Close
                  </button>
                )
              ) : (
                <>
                  <button
                    className="ae-btn ae-btnSecondary"
                    onClick={() => {
                      setFormErr("");
                      if (formMode === "add") setFormOpen(false);
                      else setFormMode("view");
                    }}
                    disabled={formBusy}
                  >
                    Cancel
                  </button>

                  <button className="ae-btn ae-btnPrimary" onClick={save} disabled={formBusy}>
                    {formBusy ? "Saving…" : "Save"}
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
                <div className="ae-confirmTitle">Delete ingredient?</div>
                <div className="ae-mutedTiny">
                  This will permanently remove <b className="ae-strongText">{activeRow.name}</b>. This can’t be undone.
                </div>
              </div>

              <button className="ae-modalClose" onClick={() => setDelOpen(false)}>
                ✕
              </button>
            </div>

            {formErr ? <div className="ae-alert ae-alertError">{formErr}</div> : null}

            <div className="ae-confirmActions">
              <button className="ae-btn ae-btnSecondary" onClick={() => setDelOpen(false)} disabled={delBusy}>
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