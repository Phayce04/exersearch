// src/utils/tableUtils.js

// Toggle sort: asc -> desc -> off
export function toggleSort(prev, key) {
  if (prev.key !== key) return { key, dir: "asc" };
  if (prev.dir === "asc") return { key, dir: "desc" };
  return { key: null, dir: "asc" };
}

export function sortIndicator(sort, key) {
  if (sort.key !== key) return "";
  return sort.dir === "asc" ? " ▲" : " ▼";
}

function normalizeString(v) {
  return (v ?? "").toString().trim().toLowerCase();
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toDateMs(v) {
  if (!v) return -Infinity;
  const s = String(v).replace(" ", "T");
  const ms = Date.parse(s);
  return Number.isNaN(ms) ? -Infinity : ms;
}

/**
 * Generic sorter:
 * - sort: { key: string|null, dir: 'asc'|'desc' }
 * - getValue: (row, sortKey) => value (string/number/date ms)
 */
export function sortRows(rows, sort, getValue) {
  if (!sort?.key) return rows;

  const dir = sort.dir === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    const av = getValue(a, sort.key);
    const bv = getValue(b, sort.key);

    // numbers
    if (typeof av === "number" && typeof bv === "number") {
      return (av - bv) * dir;
    }

    // fallback: string compare
    return normalizeString(av).localeCompare(normalizeString(bv)) * dir;
  });
}

/**
 * Convenience getters you can reuse in getValue() per table
 */
export const tableValue = {
  str: (v) => normalizeString(v),
  num: (v) => toNumber(v),
  dateMs: (v) => toDateMs(v),
};

/**
 * Pagination helper
 */
export function paginate(rows, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const start = (safePage - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  const left = rows.length === 0 ? 0 : start + 1;
  const right = Math.min(safePage * pageSize, rows.length);

  return { totalPages, safePage, pageRows, left, right };
}

/**
 * Basic global search helper
 * fields: array of field extractor functions (row) => any
 */
export function globalSearch(rows, query, fields) {
  const q = normalizeString(query);
  if (!q) return rows;

  return rows.filter((r) => {
    const hay = fields
      .map((fn) => fn(r))
      .filter(Boolean)
      .join(" ");
    return normalizeString(hay).includes(q);
  });
}
