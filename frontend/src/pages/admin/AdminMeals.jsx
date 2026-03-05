// src/pages/admin/AdminMeals.jsx
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

import { getIngredients } from "../../utils/ingredientApi";
import {
  getAdminMeals,
  getAdminMeal,
  createMeal,
  updateMeal,
  deleteMeal,
  toggleMeal,
} from "../../utils/mealAdminApi";

import * as XLSX from "xlsx";
import "./AdminEquipments.css";

const TYPE_OPTIONS = ["breakfast", "lunch", "dinner", "snack"];
const ACTIVE_OPTIONS = [
  { label: "All", value: "All" },
  { label: "Active", value: "1" },
  { label: "Inactive", value: "0" },
];

function safeStr(v) {
  return v == null ? "" : String(v);
}

function numOrZero(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeKey(s) {
  return safeStr(s)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w_]/g, "");
}

/* ---------------- CSV parsing ---------------- */

function splitCsvLine(line, delimiter) {
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      cur += '"';
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && ch === delimiter) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((x) => x.trim());
}

function parseTableText(text) {
  const raw = safeStr(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!raw) return { rows: [], delimiter: null };

  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return { rows: [], delimiter: null };

  const first = lines[0];
  const commaCount = (first.match(/,/g) || []).length;
  const tabCount = (first.match(/\t/g) || []).length;
  const semiCount = (first.match(/;/g) || []).length;

  let delimiter = ",";
  if (tabCount >= commaCount && tabCount >= semiCount) delimiter = "\t";
  else if (semiCount > commaCount && semiCount > tabCount) delimiter = ";";

  const parsed = lines.map((line) => splitCsvLine(line, delimiter));
  return { rows: parsed, delimiter };
}

function looksLikeHeaderRow(cells) {
  const keys = (cells || []).map(normalizeKey);
  const headerHints = new Set([
    "ingredient",
    "name",
    "ingredient_name",
    "id",
    "ingredient_id",
    "grams",
    "amount_grams",
    "display_amount",
    "display_unit",
    "calories",
    "protein",
    "carbs",
    "fats",
    "cost",
  ]);
  let hits = 0;
  for (const k of keys) if (headerHints.has(k)) hits++;
  return hits >= 2;
}

function buildRowFromMapping(map) {
  const id = map.id ?? map.ingredient_id ?? "";
  const ingredient = map.ingredient ?? map.name ?? map.ingredient_name ?? "";
  const grams = map.grams ?? map.amount_grams ?? map.amount ?? "0";

  return {
    id: safeStr(id).trim(),
    ingredient: safeStr(ingredient).trim(),
    amount_grams: safeStr(grams).trim() || "0",
    display_amount: safeStr(map.display_amount ?? "").trim(),
    display_unit: safeStr(map.display_unit ?? map.unit ?? "").trim(),
    calories: safeStr(map.calories ?? "0").trim() || "0",
    protein: safeStr(map.protein ?? "0").trim() || "0",
    carbs: safeStr(map.carbs ?? "0").trim() || "0",
    fats: safeStr(map.fats ?? "0").trim() || "0",
    cost: safeStr(map.cost ?? "0").trim() || "0",
  };
}

function parseBulkIngredients(text) {
  const { rows } = parseTableText(text);
  if (!rows.length) return { items: [], errors: ["Nothing to import."] };

  const header = rows[0];
  const hasHeader = looksLikeHeaderRow(header);

  let items = [];
  let errors = [];

  if (hasHeader) {
    const keys = header.map(normalizeKey);
    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i];
      const map = {};
      for (let c = 0; c < keys.length; c++) {
        const k = keys[c];
        if (!k) continue;
        map[k] = cells[c] ?? "";
      }
      const row = buildRowFromMapping(map);
      if (!row.id && !row.ingredient) continue;
      items.push(row);
    }
  } else {
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i];
      const ingredient = cells[0] ?? "";
      const grams = cells[1] ?? "0";
      const calories = cells[2] ?? "0";
      const protein = cells[3] ?? "0";
      const carbs = cells[4] ?? "0";
      const fats = cells[5] ?? "0";
      const cost = cells[6] ?? "0";

      const row = {
        id: "",
        ingredient: safeStr(ingredient).trim(),
        amount_grams: safeStr(grams).trim() || "0",
        display_amount: "",
        display_unit: "",
        calories: safeStr(calories).trim() || "0",
        protein: safeStr(protein).trim() || "0",
        carbs: safeStr(carbs).trim() || "0",
        fats: safeStr(fats).trim() || "0",
        cost: safeStr(cost).trim() || "0",
      };
      if (!row.ingredient) continue;
      items.push(row);
    }
  }

  if (!items.length) errors.push("No valid rows found.");
  return { items, errors };
}

/* ---------------- Excel parsing ---------------- */

function parseBulkIngredientsFromRows(rows) {
  const cleanRows = (Array.isArray(rows) ? rows : [])
    .map((r) => (Array.isArray(r) ? r.map((c) => safeStr(c).trim()) : []))
    .filter((r) => r.some((c) => safeStr(c).trim() !== ""));

  if (!cleanRows.length) return { items: [], errors: ["Nothing to import."] };

  const header = cleanRows[0];
  const hasHeader = looksLikeHeaderRow(header);

  let items = [];
  let errors = [];

  if (hasHeader) {
    const keys = header.map(normalizeKey);
    for (let i = 1; i < cleanRows.length; i++) {
      const cells = cleanRows[i];
      const map = {};
      for (let c = 0; c < keys.length; c++) {
        const k = keys[c];
        if (!k) continue;
        map[k] = cells[c] ?? "";
      }
      const row = buildRowFromMapping(map);
      if (!row.id && !row.ingredient) continue;
      items.push(row);
    }
  } else {
    for (let i = 0; i < cleanRows.length; i++) {
      const cells = cleanRows[i];
      const ingredient = cells[0] ?? "";
      const grams = cells[1] ?? "0";
      const calories = cells[2] ?? "0";
      const protein = cells[3] ?? "0";
      const carbs = cells[4] ?? "0";
      const fats = cells[5] ?? "0";
      const cost = cells[6] ?? "0";

      const row = {
        id: "",
        ingredient: safeStr(ingredient).trim(),
        amount_grams: safeStr(grams).trim() || "0",
        display_amount: "",
        display_unit: "",
        calories: safeStr(calories).trim() || "0",
        protein: safeStr(protein).trim() || "0",
        carbs: safeStr(carbs).trim() || "0",
        fats: safeStr(fats).trim() || "0",
        cost: safeStr(cost).trim() || "0",
      };
      if (!row.ingredient) continue;
      items.push(row);
    }
  }

  if (!items.length) errors.push("No valid rows found.");
  return { items, errors };
}

/* ---------------- Templates download ---------------- */

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function makeBulkTemplateAOA() {
  // Supports matching ingredient by name OR id
  return [
    [
      "ingredient",
      "grams",
      "calories",
      "protein",
      "carbs",
      "fats",
      "cost",
      "display_amount",
      "display_unit",
      "id",
    ],
    ["Chicken breast", "200", "330", "62", "0", "7", "80", "", "", ""],
    ["Rice", "150", "195", "4", "42", "0", "20", "", "", ""],
    // Example using ingredient ID:
    ["", "100", "143", "13", "1", "10", "15", "", "", "12"],
  ];
}

/* ---------------- Component ---------------- */

export default function AdminMeals() {
  const { theme } = useOutletContext();
  const t = adminThemes[theme]?.app || adminThemes.light.app;
  const isDark = theme === "dark";

  const { isAdmin } = useAuthMe();

  const [q, setQ] = useState("");
  const [type, setType] = useState("All");
  const [active, setActive] = useState("All");

  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [error, setError] = useState("");

  const [sort, setSort] = useState({ key: "updated", dir: "desc" });
  const pageSize = 10;
  const [page, setPage] = useState(1);

  const [ingredients, setIngredients] = useState([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("view"); // view | add | edit
  const [activeRow, setActiveRow] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState("");

  const [bulkErr, setBulkErr] = useState("");
  const [bulkOk, setBulkOk] = useState("");
  const [bulkFileName, setBulkFileName] = useState("");

  const [delOpen, setDelOpen] = useState(false);
  const [delBusy, setDelBusy] = useState(false);

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

  useEffect(() => setPage(1), [q, type, active]);

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

  const reload = async () => {
    setError("");
    setLoadingRows(true);
    try {
      if (!isAdmin) {
        setRows([]);
        return;
      }
      const data = await getAdminMeals({
        limit: 5000,
        q: q.trim() || undefined,
        type: type !== "All" ? type : undefined,
        active: active !== "All" ? active : undefined,
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load meals.");
      setRows([]);
    } finally {
      setLoadingRows(false);
    }
  };

  const loadIngredients = async () => {
    setLoadingIngredients(true);
    try {
      const res = await getIngredients();
      const list = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setIngredients(list);
    } catch (e) {
      setIngredients([]);
    } finally {
      setLoadingIngredients(false);
    }
  };

  useEffect(() => {
    reload();
    loadIngredients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const searched = useMemo(() => {
    return globalSearch(rows || [], q, [(r) => r.id, (r) => r.name, (r) => r.meal_type]);
  }, [rows, q]);

  const filtered = useMemo(() => {
    return searched
      .filter((r) => (type === "All" ? true : r.meal_type === type))
      .filter((r) => (active === "All" ? true : String(Number(!!r.is_active)) === active));
  }, [searched, type, active]);

  const getValue = (r, key) => {
    switch (key) {
      case "name":
        return tableValue.str(r.name);
      case "type":
        return tableValue.str(r.meal_type);
      case "cal":
        return tableValue.num(r.total_calories);
      case "p":
        return tableValue.num(r.total_protein);
      case "c":
        return tableValue.num(r.total_carbs);
      case "f":
        return tableValue.num(r.total_fats);
      case "cost":
        return tableValue.num(r.estimated_cost);
      case "active":
        return tableValue.num(r.is_active ? 1 : 0);
      case "updated":
        return tableValue.dateMs(r.updated_at);
      default:
        return "";
    }
  };

  const sorted = useMemo(() => sortRows(filtered, sort, getValue), [filtered, sort]);
  const { totalPages, safePage, pageRows, left, right } = useMemo(
    () => paginate(sorted, page, pageSize),
    [sorted, page]
  );

  const modalTitle =
    mode === "add" ? "Add Meal" : mode === "edit" ? "Edit Meal" : "View Meal";

  const canEdit = isAdmin && (mode === "add" || mode === "edit");

  const openAdd = () => {
    setFormErr("");
    setBulkErr("");
    setBulkOk("");
    setBulkFileName("");
    setMode("add");
    setActiveRow(null);
    setForm({
      name: "",
      meal_type: "",
      description: "",
      serving_size: "",
      prep_time: "",
      cook_time: "",
      instructions: "",
      cooking_tips: "",
      diet_tags: "",
      allergens: "",
      total_calories: "0",
      total_protein: "0",
      total_carbs: "0",
      total_fats: "0",
      estimated_cost: "0",
      is_active: true,
      ingredients: [],
    });
    setModalOpen(true);
  };

  const hydrateFromApiMeal = (meal) => {
    const m = meal || {};
    return {
      name: safeStr(m.name),
      meal_type: safeStr(m.meal_type),
      description: safeStr(m.description),
      serving_size: safeStr(m.serving_size),
      prep_time: safeStr(m.prep_time),
      cook_time: safeStr(m.cook_time),
      instructions: safeStr(m.instructions),
      cooking_tips: safeStr(m.cooking_tips),
      diet_tags: Array.isArray(m.diet_tags) ? m.diet_tags.join(", ") : safeStr(m.diet_tags),
      allergens: Array.isArray(m.allergens) ? m.allergens.join(", ") : safeStr(m.allergens),
      total_calories: String(m.total_calories ?? 0),
      total_protein: String(m.total_protein ?? 0),
      total_carbs: String(m.total_carbs ?? 0),
      total_fats: String(m.total_fats ?? 0),
      estimated_cost: String(m.estimated_cost ?? 0),
      is_active: !!m.is_active,
      ingredients: Array.isArray(m.ingredients)
        ? m.ingredients.map((x) => ({
            id: String(x.id ?? ""),
            name: x.name || "",
            category: x.category || "",
            amount_grams: String(x.amount_grams ?? 0),
            display_amount: safeStr(x.display_amount),
            display_unit: safeStr(x.display_unit),
            calories: String(x.calories ?? 0),
            protein: String(x.protein ?? 0),
            carbs: String(x.carbs ?? 0),
            fats: String(x.fats ?? 0),
            cost: String(x.cost ?? 0),
          }))
        : [],
    };
  };

  const openView = async (r) => {
    setFormErr("");
    setBulkErr("");
    setBulkOk("");
    setBulkFileName("");
    setMode("view");
    setActiveRow(r);
    setBusy(true);
    try {
      const res = await getAdminMeal(r.id);
      const meal = res?.data?.data ?? res?.data ?? null;
      setForm(hydrateFromApiMeal(meal));
      setActiveRow((p) => ({ ...p, id: r.id }));
      setModalOpen(true);
    } catch (e) {
      setFormErr(e.message || "Failed to load meal.");
      setModalOpen(true);
    } finally {
      setBusy(false);
    }
  };

  const openEdit = async (r) => {
    setFormErr("");
    setBulkErr("");
    setBulkOk("");
    setBulkFileName("");
    setMode("edit");
    setActiveRow(r);
    setBusy(true);
    try {
      const res = await getAdminMeal(r.id);
      const meal = res?.data?.data ?? res?.data ?? null;
      setForm(hydrateFromApiMeal(meal));
      setActiveRow((p) => ({ ...p, id: r.id }));
      setModalOpen(true);
    } catch (e) {
      setFormErr(e.message || "Failed to load meal.");
      setModalOpen(true);
    } finally {
      setBusy(false);
    }
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
      await deleteMeal(activeRow.id);
      setDelOpen(false);
      setModalOpen(false);
      reload();
    } catch (e) {
      setFormErr(e.message || "Delete failed.");
    } finally {
      setDelBusy(false);
    }
  };

  const doToggle = async (r) => {
    setFormErr("");
    try {
      await toggleMeal(r.id);
      reload();
    } catch (e) {
      setFormErr(e.message || "Toggle failed.");
    }
  };

  const addIngredientRow = () => {
    if (!form) return;
    setForm((p) => ({
      ...p,
      ingredients: [
        ...(p.ingredients || []),
        {
          id: "",
          name: "",
          category: "",
          amount_grams: "0",
          display_amount: "",
          display_unit: "",
          calories: "0",
          protein: "0",
          carbs: "0",
          fats: "0",
          cost: "0",
        },
      ],
    }));
  };

  const removeIngredientRow = (idx) => {
    setForm((p) => ({
      ...p,
      ingredients: (p.ingredients || []).filter((_, i) => i !== idx),
    }));
  };

  const onPickIngredient = (idx, ingId) => {
    const picked = ingredients.find((x) => String(x.id) === String(ingId));
    setForm((p) => {
      const next = [...(p.ingredients || [])];
      next[idx] = {
        ...next[idx],
        id: String(ingId || ""),
        name: picked?.name || "",
        category: picked?.category || "",
      };
      return { ...p, ingredients: next };
    });
  };

  const updateIngField = (idx, key, value) => {
    setForm((p) => {
      const next = [...(p.ingredients || [])];
      next[idx] = { ...next[idx], [key]: value };
      return { ...p, ingredients: next };
    });
  };

  const applyMappedItemsIntoForm = (items) => {
    const byId = new Map(ingredients.map((x) => [String(x.id), x]));
    const byName = new Map(ingredients.map((x) => [safeStr(x.name).trim().toLowerCase(), x]));

    const failed = [];
    const mapped = [];

    for (const it of items) {
      const wantId = safeStr(it.id).trim();
      const wantName = safeStr(it.ingredient).trim().toLowerCase();

      let picked = null;
      if (wantId && byId.has(wantId)) picked = byId.get(wantId);
      if (!picked && wantName && byName.has(wantName)) picked = byName.get(wantName);

      if (!picked) {
        failed.push(wantId ? `#${wantId}` : safeStr(it.ingredient) || "(blank)");
        continue;
      }

      mapped.push({
        id: String(picked.id),
        name: picked.name || "",
        category: picked.category || "",
        amount_grams: safeStr(it.amount_grams || "0") || "0",
        display_amount: safeStr(it.display_amount || ""),
        display_unit: safeStr(it.display_unit || ""),
        calories: safeStr(it.calories || "0") || "0",
        protein: safeStr(it.protein || "0") || "0",
        carbs: safeStr(it.carbs || "0") || "0",
        fats: safeStr(it.fats || "0") || "0",
        cost: safeStr(it.cost || "0") || "0",
      });
    }

    if (!mapped.length) {
      setBulkErr("No rows matched your ingredients list.");
      if (failed.length) {
        setBulkErr(
          (p) =>
            `${p} Unmatched: ${failed.slice(0, 15).join(", ")}${
              failed.length > 15 ? "…" : ""
            }`
        );
      }
      return;
    }

    setForm((p) => ({
      ...p,
      ingredients: [...(p.ingredients || []), ...mapped],
    }));

    const okMsg = `Added ${mapped.length} row(s).`;
    const failMsg = failed.length
      ? ` Unmatched: ${failed.slice(0, 12).join(", ")}${failed.length > 12 ? "…" : ""}`
      : "";
    setBulkOk(okMsg + failMsg);
    if (failed.length) setBulkErr("");
  };

  // ✅ Upload CSV/Excel -> auto-import, no textarea
  const onBulkFile = async (file) => {
    setBulkErr("");
    setBulkOk("");
    setBulkFileName("");

    if (!canEdit) return;
    if (!file) return;

    const name = (file.name || "").toLowerCase();
    setBulkFileName(file.name || "");

    try {
      if (name.endsWith(".csv")) {
        const text = await file.text();
        const { items, errors } = parseBulkIngredients(text);
        if (errors.length) {
          setBulkErr(errors.join(" "));
          return;
        }
        applyMappedItemsIntoForm(items);
        return;
      }

      if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const firstSheetName = wb.SheetNames?.[0];
        if (!firstSheetName) throw new Error("No sheets found in the file.");

        const ws = wb.Sheets[firstSheetName];
        const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });

        const { items, errors } = parseBulkIngredientsFromRows(aoa);
        if (errors.length) {
          setBulkErr(errors.join(" "));
          return;
        }
        applyMappedItemsIntoForm(items);
        return;
      }

      throw new Error("Unsupported file type. Upload .csv, .xlsx, or .xls");
    } catch (e) {
      setBulkErr(e.message || "Failed to import file.");
    }
  };

  const downloadCsvTemplate = () => {
    const aoa = makeBulkTemplateAOA();
    const lines = aoa.map((r) =>
      r
        .map((cell) => {
          const s = safeStr(cell);
          if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
          return s;
        })
        .join(",")
    );
    const csv = lines.join("\n");
    downloadBlob("meal_ingredients_template.csv", new Blob([csv], { type: "text/csv;charset=utf-8" }));
  };

  const downloadExcelTemplate = () => {
    const aoa = makeBulkTemplateAOA();
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ingredients");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    downloadBlob(
      "meal_ingredients_template.xlsx",
      new Blob([out], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
    );
  };

  const save = async () => {
    if (!form) return;

    const name = safeStr(form.name).trim();
    const meal_type = safeStr(form.meal_type).trim();

    if (!name) {
      setFormErr("Name is required.");
      return;
    }

    if (!meal_type) {
      setFormErr("Meal type is required.");
      return;
    }

    const dietTags = safeStr(form.diet_tags)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const allergens = safeStr(form.allergens)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const ings = (form.ingredients || [])
      .filter((x) => x && String(x.id || "").trim() !== "")
      .map((x) => ({
        id: Number(x.id),
        amount_grams: numOrZero(x.amount_grams),
        display_amount: safeStr(x.display_amount).trim() || null,
        display_unit: safeStr(x.display_unit).trim() || null,
        calories: numOrZero(x.calories),
        protein: numOrZero(x.protein),
        carbs: numOrZero(x.carbs),
        fats: numOrZero(x.fats),
        cost: numOrZero(x.cost),
      }));

    if (ings.some((x) => !Number.isFinite(x.id) || x.id <= 0)) {
      setFormErr("Invalid ingredient selection.");
      return;
    }

    setBusy(true);
    setFormErr("");
    try {
      const payload = {
        name,
        meal_type,
        description: safeStr(form.description).trim() || null,
        serving_size: safeStr(form.serving_size).trim() || null,
        prep_time: safeStr(form.prep_time).trim() || null,
        cook_time: safeStr(form.cook_time).trim() || null,
        instructions: safeStr(form.instructions).trim() || null,
        cooking_tips: safeStr(form.cooking_tips).trim() || null,
        diet_tags: dietTags,
        allergens,
        total_calories: numOrZero(form.total_calories),
        total_protein: numOrZero(form.total_protein),
        total_carbs: numOrZero(form.total_carbs),
        total_fats: numOrZero(form.total_fats),
        estimated_cost: numOrZero(form.estimated_cost),
        is_active: !!form.is_active,
        ingredients: ings,
      };

      if (mode === "add") {
        await createMeal(payload);
      } else if (mode === "edit") {
        if (!activeRow) throw new Error("No meal selected.");
        await updateMeal(activeRow.id, payload);
      }

      setModalOpen(false);
      reload();
    } catch (e) {
      setFormErr(e.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const headerCount = loadingRows ? "Loading…" : `${sorted.length} items`;

  return (
    <div className="ae-page" data-theme={theme} style={cssVars}>
      <div className="ae-topRow">
        <div className="ae-titleWrap">
          <div className="ae-pageTitle">Meals</div>
          <div className="ae-headerPills">
            <span className="ae-pill">{headerCount}</span>
            {type !== "All" ? <span className="ae-pillMuted">{type}</span> : null}
            {active !== "All" ? (
              <span className="ae-pillMuted">{active === "1" ? "Active" : "Inactive"}</span>
            ) : null}
          </div>
        </div>

        <div className="ae-topActions">
          <button className="ae-btn ae-btnSecondary" onClick={reload}>
            Reload
          </button>

          {isAdmin ? (
            <button className="ae-btn ae-btnPrimary" onClick={openAdd}>
              + Add Meal
            </button>
          ) : null}
        </div>
      </div>

      <div className="ae-panelOuter">
        <div className="ae-panel">
          <div className="ae-panelTop">
            <div className="ae-leftActions">
              {formErr ? <div className="ae-alert ae-alertError">{formErr}</div> : null}
              {loadingIngredients ? <div className="ae-mutedSmall">Loading ingredients…</div> : null}
            </div>

            <div className="ae-rightActions">
              <div className="ae-searchBox">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search meals…"
                  className="ae-searchInput"
                />
                <span className="ae-searchIcon">⌕</span>
              </div>

              <select value={type} onChange={(e) => setType(e.target.value)} className="ae-select">
                <option value="All">All</option>
                {TYPE_OPTIONS.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>

              <select value={active} onChange={(e) => setActive(e.target.value)} className="ae-select">
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
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "name"))}>
                      Name{sortIndicator(sort, "name")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "type"))}>
                      Type{sortIndicator(sort, "type")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "cal"))}>
                      Calories{sortIndicator(sort, "cal")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "p"))}>
                      Protein{sortIndicator(sort, "p")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "c"))}>
                      Carbs{sortIndicator(sort, "c")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "f"))}>
                      Fats{sortIndicator(sort, "f")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "cost"))}>
                      Cost{sortIndicator(sort, "cost")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "active"))}>
                      Active{sortIndicator(sort, "active")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "updated"))}>
                      Updated{sortIndicator(sort, "updated")}
                    </th>
                    <th className="ae-th ae-thRight" />
                  </tr>
                </thead>

                <tbody>
                  {loadingRows ? (
                    <tr>
                      <td className="ae-td" colSpan={10}>
                        Loading…
                      </td>
                    </tr>
                  ) : pageRows.length === 0 ? (
                    <tr>
                      <td className="ae-td" colSpan={10}>
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
                        <td className="ae-td">{r.meal_type || "-"}</td>
                        <td className="ae-td">{r.total_calories ?? "-"}</td>
                        <td className="ae-td">{r.total_protein ?? "-"}</td>
                        <td className="ae-td">{r.total_carbs ?? "-"}</td>
                        <td className="ae-td">{r.total_fats ?? "-"}</td>
                        <td className="ae-td">{r.estimated_cost ?? "-"}</td>
                        <td className="ae-td">{r.is_active ? "Yes" : "No"}</td>
                        <td className="ae-td">
                          {r.updated_at ? new Date(String(r.updated_at).replace(" ", "T")).toLocaleString() : "-"}
                        </td>

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

      {/* ---------------- Modal ---------------- */}
      {modalOpen && form && (
        <div className="ae-backdrop" onClick={() => setModalOpen(false)}>
          <div
            className="ae-formModal"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(980px, 96vw)",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div className="ae-modalTopRow" style={{ flex: "0 0 auto" }}>
              <div className="ae-modalTitle">{modalTitle}</div>
              <button className="ae-modalClose" onClick={() => setModalOpen(false)} title="Close">
                ✕
              </button>
            </div>

            {formErr ? (
              <div className="ae-alert ae-alertError" style={{ flex: "0 0 auto" }}>
                {formErr}
              </div>
            ) : null}

            <div style={{ flex: "1 1 auto", overflowY: "auto", paddingRight: 4 }}>
              {/* ✅ Bulk add (no textarea) */}
              {canEdit ? (
                <div style={{ padding: "0 2px 14px 2px" }}>
                  <div className="ae-fieldLabel" style={{ marginBottom: 10 }}>
                    Bulk add ingredients
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <label className="ae-btn ae-btnSecondary" style={{ cursor: "pointer" }}>
                      Upload CSV/Excel
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        style={{ display: "none" }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          await onBulkFile(file);
                          e.target.value = "";
                        }}
                      />
                    </label>

                    <button type="button" className="ae-btn ae-btnSecondary" onClick={downloadCsvTemplate}>
                      Download CSV template
                    </button>

                    <button type="button" className="ae-btn ae-btnSecondary" onClick={downloadExcelTemplate}>
                      Download Excel template
                    </button>

                    <button
                      type="button"
                      className="ae-btn ae-btnSecondary"
                      onClick={() => {
                        setBulkErr("");
                        setBulkOk("");
                        setBulkFileName("");
                      }}
                    >
                      Clear status
                    </button>
                  </div>

                  <div style={{ marginTop: 10 }} className="ae-mutedTiny">
                    Upload imports instantly. Matches by ingredient <b className="ae-strongText">name</b> or{" "}
                    <b className="ae-strongText">id</b>.
                    {bulkFileName ? (
                      <>
                        {" "}
                        • File: <b className="ae-strongText">{bulkFileName}</b>
                      </>
                    ) : null}
                  </div>

                  {bulkErr ? <div className="ae-alert ae-alertError">{bulkErr}</div> : null}
                  {bulkOk ? <div className="ae-alert">{bulkOk}</div> : null}
                </div>
              ) : null}

              <div className="ae-formGrid">
                <Field
                  label="Name"
                  value={form.name}
                  disabled={!canEdit}
                  onChange={(v) => setForm((p) => ({ ...p, name: v }))}
                />

                <label className="ae-field">
                  <div className="ae-fieldLabel">Meal type</div>
                  <select
                    value={form.meal_type || ""}
                    disabled={!canEdit}
                    className={`ae-select ${!canEdit ? "ae-fieldInputDisabled" : ""}`}
                    onChange={(e) => setForm((p) => ({ ...p, meal_type: e.target.value }))}
                    style={{ height: 42 }}
                  >
                    <option value="">—</option>
                    {TYPE_OPTIONS.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </label>

                <Field label="Calories" value={form.total_calories} disabled={!canEdit} onChange={(v) => setForm((p) => ({ ...p, total_calories: v }))} />
                <Field label="Protein" value={form.total_protein} disabled={!canEdit} onChange={(v) => setForm((p) => ({ ...p, total_protein: v }))} />
                <Field label="Carbs" value={form.total_carbs} disabled={!canEdit} onChange={(v) => setForm((p) => ({ ...p, total_carbs: v }))} />
                <Field label="Fats" value={form.total_fats} disabled={!canEdit} onChange={(v) => setForm((p) => ({ ...p, total_fats: v }))} />
                <Field label="Estimated cost" value={form.estimated_cost} disabled={!canEdit} onChange={(v) => setForm((p) => ({ ...p, estimated_cost: v }))} />

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

                <Field full label="Serving size" value={form.serving_size} disabled={!canEdit} onChange={(v) => setForm((p) => ({ ...p, serving_size: v }))} />
                <Field full label="Prep time" value={form.prep_time} disabled={!canEdit} onChange={(v) => setForm((p) => ({ ...p, prep_time: v }))} />
                <Field full label="Cook time" value={form.cook_time} disabled={!canEdit} onChange={(v) => setForm((p) => ({ ...p, cook_time: v }))} />
                <Field full label="Description" value={form.description} disabled={!canEdit} onChange={(v) => setForm((p) => ({ ...p, description: v }))} />
                <Field full label="Instructions" value={form.instructions} disabled={!canEdit} onChange={(v) => setForm((p) => ({ ...p, instructions: v }))} />
                <Field full label="Cooking tips" value={form.cooking_tips} disabled={!canEdit} onChange={(v) => setForm((p) => ({ ...p, cooking_tips: v }))} />
                <Field full label="Diet tags (comma)" value={form.diet_tags} disabled={!canEdit} onChange={(v) => setForm((p) => ({ ...p, diet_tags: v }))} />
                <Field full label="Allergens (comma)" value={form.allergens} disabled={!canEdit} onChange={(v) => setForm((p) => ({ ...p, allergens: v }))} />

                <div className="ae-field ae-fieldFull">
                  <div className="ae-fieldLabel">Ingredients</div>

                  {Array.isArray(form.ingredients) && form.ingredients.length > 0 ? (
                    <div style={{ display: "grid", gap: 10 }}>
                      {form.ingredients.map((ing, idx) => (
                        <div key={idx} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 10 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 10 }}>
                            <label className="ae-field" style={{ margin: 0 }}>
                              <div className="ae-fieldLabel">Ingredient</div>
                              <select
                                value={ing.id || ""}
                                disabled={!canEdit}
                                className={`ae-select ${!canEdit ? "ae-fieldInputDisabled" : ""}`}
                                onChange={(e) => onPickIngredient(idx, e.target.value)}
                                style={{ height: 42 }}
                              >
                                <option value="">—</option>
                                {ingredients.map((x) => (
                                  <option key={x.id} value={x.id}>
                                    {x.name} {x.category ? `(${x.category})` : ""}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <button
                              type="button"
                              className="ae-btn ae-btnSecondary"
                              onClick={() => removeIngredientRow(idx)}
                              disabled={!canEdit}
                              style={{ height: 42, alignSelf: "end" }}
                            >
                              Remove
                            </button>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                            <FieldInline label="Grams" value={ing.amount_grams} disabled={!canEdit} onChange={(v) => updateIngField(idx, "amount_grams", v)} />
                            <FieldInline label="Display amount" value={ing.display_amount} disabled={!canEdit} onChange={(v) => updateIngField(idx, "display_amount", v)} />
                            <FieldInline label="Unit" value={ing.display_unit} disabled={!canEdit} onChange={(v) => updateIngField(idx, "display_unit", v)} />
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginTop: 10 }}>
                            <FieldInline label="Calories" value={ing.calories} disabled={!canEdit} onChange={(v) => updateIngField(idx, "calories", v)} />
                            <FieldInline label="Protein" value={ing.protein} disabled={!canEdit} onChange={(v) => updateIngField(idx, "protein", v)} />
                            <FieldInline label="Carbs" value={ing.carbs} disabled={!canEdit} onChange={(v) => updateIngField(idx, "carbs", v)} />
                            <FieldInline label="Fats" value={ing.fats} disabled={!canEdit} onChange={(v) => updateIngField(idx, "fats", v)} />
                            <FieldInline label="Cost" value={ing.cost} disabled={!canEdit} onChange={(v) => updateIngField(idx, "cost", v)} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="ae-mutedTiny">No ingredients.</div>
                  )}

                  {canEdit ? (
                    <div className="ae-inlineTools" style={{ marginTop: 10, justifyContent: "flex-start" }}>
                      <button type="button" className="ae-btn ae-btnSecondary" onClick={addIngredientRow}>
                        + Add ingredient
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="ae-modalFooter" style={{ flex: "0 0 auto" }}>
              {mode === "view" ? (
                isAdmin ? (
                  <>
                    <button className="ae-btn ae-btnSecondary" onClick={() => askDelete(activeRow)}>
                      Delete
                    </button>
                    <button className="ae-btn ae-btnPrimary" onClick={() => setMode("edit")}>
                      Edit
                    </button>
                  </>
                ) : (
                  <button className="ae-btn ae-btnSecondary" onClick={() => setModalOpen(false)}>
                    Close
                  </button>
                )
              ) : (
                <>
                  <button
                    className="ae-btn ae-btnSecondary"
                    onClick={() => {
                      setFormErr("");
                      if (mode === "add") setModalOpen(false);
                      else setMode("view");
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

      {/* ---------------- Delete Confirm ---------------- */}
      {delOpen && activeRow && (
        <div className="ae-backdrop ae-backdropTop" onClick={() => setDelOpen(false)}>
          <div className="ae-confirmModalFancy" onClick={(e) => e.stopPropagation()}>
            <div className="ae-confirmHeader">
              <div className="ae-confirmIconWrap" aria-hidden="true">
                ⚠️
              </div>

              <div className="ae-confirmHeaderText">
                <div className="ae-confirmTitle">Delete meal?</div>
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

function FieldInline({ label, value, onChange, disabled }) {
  return (
    <label className="ae-field" style={{ margin: 0 }}>
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