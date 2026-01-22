import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { MAIN, adminThemes } from "./AdminLayout";

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

function formatDateTimeFallback(value) {
  if (!value) return "-";
  const d = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
}

export default function AdminEquipments() {
  const { theme } = useOutletContext();
  const t = adminThemes[theme]?.app || adminThemes.light.app;
  const isDark = theme === "dark";
  const styles = makeStyles(t, isDark);

  const { me, isAdmin } = useAuthMe();
  const {
    rows,
    loading: loadingRows,
    error,
    reload,
  } = useApiList("/api/v1/equipments", {
    authed: true,
  });

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");

  const [sort, setSort] = useState({ key: "id", dir: "asc" });
  const pageSize = 10;
  const [page, setPage] = useState(1);

  // IMAGE PREVIEW MODAL
  const [previewImg, setPreviewImg] = useState(null);

  // Close preview on ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setPreviewImg(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // dropdown values
  const categories = useMemo(() => {
    const set = new Set(rows.map((r) => r.category).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [rows]);

  const difficulties = useMemo(() => {
    const set = new Set(rows.map((r) => r.difficulty).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [rows]);

  // search
  const searched = useMemo(() => {
    return globalSearch(rows, q, [
      (r) => r.equipment_id,
      (r) => r.name,
      (r) => r.category,
      (r) => r.difficulty,
      (r) => r.target_muscle_group,
    ]);
  }, [rows, q]);

  // filter
  const filtered = useMemo(() => {
    return searched
      .filter((r) => (category === "All" ? true : r.category === category))
      .filter((r) => (difficulty === "All" ? true : r.difficulty === difficulty));
  }, [searched, category, difficulty]);

  // reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [q, category, difficulty]);

  // sort mapping per-table
  const getValue = (r, key) => {
    switch (key) {
      case "equipment":
        return tableValue.str(r.name);
      case "category":
        return tableValue.str(r.category);
      case "difficulty":
        return tableValue.str(r.difficulty);
      case "target":
        return tableValue.str(r.target_muscle_group);
      case "updated":
        return tableValue.dateMs(r.updated_at);
      case "id":
        return tableValue.num(r.equipment_id);
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
    if (category !== "All") pills.push(category);
    if (difficulty !== "All") pills.push(difficulty);
    return pills;
  }, [loadingRows, sorted.length, category, difficulty]);

  const secondaryBtn = useMemo(
    () => ({
      ...styles.secondaryAction,
      color: t.text,
    }),
    [styles.secondaryAction, t.text]
  );

  return (
    <div style={styles.page}>
      {/* HEADER ROW */}
      <div style={styles.topRow}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <div style={styles.pageTitle}>Equipments</div>

          <div style={styles.headerPills}>
            {headerPills.map((p, idx) => (
              <span key={idx} style={idx === 0 ? styles.pill : styles.pillMuted}>
                {p}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button style={secondaryBtn} onClick={reload}>
            Reload
          </button>
        </div>
      </div>

      {/* PANEL */}
      <div style={{ padding: "0 16px", marginTop: 10 }}>
        <div style={styles.panel}>
          {/* TOP BAR */}
          <div style={styles.panelTop}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {isAdmin ? (
                <>
                  <button style={styles.primaryAction} onClick={() => alert("Wire Add modal")}>
                    + Add Equipment
                  </button>
                  <button style={secondaryBtn} onClick={() => alert("Wire CSV import")}>
                    Import CSV
                  </button>
                </>
              ) : null}
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={styles.searchBox}>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search equipments…"
                  style={styles.searchInput}
                />
                <span style={styles.searchIcon}>⌕</span>
              </div>

              <select value={category} onChange={(e) => setCategory(e.target.value)} style={styles.select}>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={styles.select}>
                {difficulties.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* TABLE */}
          <div style={styles.tableWrap}>
            {error ? (
              <div style={styles.errorBox}>{error}</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.thClickable} onClick={() => setSort((p) => toggleSort(p, "equipment"))}>
                      Equipment{sortIndicator(sort, "equipment")}
                    </th>
                    <th style={styles.thClickable} onClick={() => setSort((p) => toggleSort(p, "category"))}>
                      Category{sortIndicator(sort, "category")}
                    </th>
                    <th style={styles.thClickable} onClick={() => setSort((p) => toggleSort(p, "difficulty"))}>
                      Difficulty{sortIndicator(sort, "difficulty")}
                    </th>
                    <th style={styles.thClickable} onClick={() => setSort((p) => toggleSort(p, "target"))}>
                      Target{sortIndicator(sort, "target")}
                    </th>
                    <th style={styles.thClickable} onClick={() => setSort((p) => toggleSort(p, "updated"))}>
                      Updated{sortIndicator(sort, "updated")}
                    </th>
                    <th style={{ ...styles.th, textAlign: "right" }} />
                  </tr>
                </thead>

                <tbody>
                  {loadingRows ? (
                    <tr>
                      <td style={styles.td} colSpan={6}>
                        Loading…
                      </td>
                    </tr>
                  ) : pageRows.length === 0 ? (
                    <tr>
                      <td style={styles.td} colSpan={6}>
                        No results.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((r) => (
                      <tr
                        key={r.equipment_id}
                        style={styles.tr}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = styles.trHover.background;
                          e.currentTarget.style.boxShadow = styles.trHover.boxShadow || "none";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = styles.tr.background;
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <td style={styles.td}>
                          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <div style={styles.imgBox}>
                              {r.image_url ? (
                                <img
                                  src={r.image_url}
                                  alt={r.name}
                                  style={{ ...styles.img, cursor: "zoom-in" }}
                                  onClick={() =>
                                    setPreviewImg({
                                      src: r.image_url,
                                      name: r.name || "equipment",
                                    })
                                  }
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <span style={styles.mutedTiny}>N/A</span>
                              )}
                            </div>

                            <div>
                              <div style={{ fontWeight: 950, letterSpacing: -0.2 }}>{r.name || "-"}</div>
                              <div style={styles.mutedTiny}>ID: {r.equipment_id}</div>
                            </div>
                          </div>
                        </td>

                        <td style={styles.td}>{r.category || "-"}</td>
                        <td style={styles.td}>{r.difficulty || "-"}</td>
                        <td style={styles.td}>{r.target_muscle_group || "-"}</td>
                        <td style={{ ...styles.td, ...styles.mutedCell }}>{formatDateTimeFallback(r.updated_at)}</td>

                        <td style={{ ...styles.td, textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: 8 }}>
                            <IconBtn title="View" style={styles.iconBtn} onClick={() => alert(`View ${r.equipment_id}`)}>
                              👁
                            </IconBtn>

                            {isAdmin ? (
                              <>
                                <IconBtn
                                  title="Edit"
                                  style={styles.iconBtn}
                                  onClick={() => alert(`Edit ${r.equipment_id}`)}
                                >
                                  ✎
                                </IconBtn>
                                <IconBtn
                                  title="Delete"
                                  style={styles.iconBtnDanger}
                                  onClick={() => alert(`Delete ${r.equipment_id}`)}
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

          {/* PAGINATION */}
          <div style={styles.pagerRow}>
            <button
              style={secondaryBtn}
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>

            <div style={styles.mutedSmall}>
              Page <b style={{ color: t.text }}>{safePage}</b> of <b style={{ color: t.text }}>{totalPages}</b>
            </div>

            <button
              style={secondaryBtn}
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>

            <div style={{ marginLeft: "auto" }}>
              <span style={styles.mutedSmall}>
                Showing <b style={{ color: t.text }}>{left}-{right}</b> of <b style={{ color: t.text }}>{sorted.length}</b>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* IMAGE PREVIEW MODAL */}
      {previewImg && (
        <div style={styles.modalBackdrop} onClick={() => setPreviewImg(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <img src={previewImg.src} alt={previewImg.name} style={styles.modalImg} />

            <div style={styles.modalActions}>
              <a href={previewImg.src} download style={{ textDecoration: "none" }}>
                <span style={styles.primaryAction}>Download</span>
              </a>

              <button style={styles.secondaryAction} onClick={() => setPreviewImg(null)}>
                Close
              </button>
            </div>

            <button style={styles.modalClose} onClick={() => setPreviewImg(null)}>
              ✕
            </button>
          </div>
        </div>
      )}

      <div style={{ height: 24 }} />
    </div>
  );
}

function IconBtn({ children, title, style, onClick }) {
  return (
    <button type="button" title={title} onClick={onClick} style={style}>
      {children}
    </button>
  );
}

function makeStyles(t, isDark) {
  return {
    page: { width: "100%", background: t.bg, color: t.text },

    topRow: {
      padding: "16px 16px 0",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 16,
      flexWrap: "wrap",
    },

    pageTitle: { fontSize: 26, fontWeight: 950, letterSpacing: -0.2 },

    headerPills: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },

    pill: {
      padding: "8px 10px",
      borderRadius: 999,
      border: `1px solid ${t.border}`,
      background: t.soft,
      color: t.text,
      fontWeight: 950,
      fontSize: 12,
    },

    pillMuted: {
      padding: "8px 10px",
      borderRadius: 999,
      border: `1px solid ${t.border}`,
      background: t.soft2,
      color: t.mutedText,
      fontWeight: 900,
      fontSize: 12,
    },

    mutedSmall: { color: t.mutedText, fontWeight: 700, fontSize: 13 },
    mutedTiny: { color: t.mutedText, fontWeight: 800, fontSize: 12, marginTop: 3 },

    panel: {
      border: `1px solid ${t.border}`,
      borderRadius: 14,
      background: t.soft2,
      boxShadow: t.shadow,
      overflow: "hidden",
    },

    panelTop: {
      padding: 14,
      borderBottom: `1px solid ${t.border}`,
      background: t.soft,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
    },

    searchBox: { position: "relative", minWidth: 240, maxWidth: 420, flex: 1 },

    searchInput: {
      width: "100%",
      height: 42,
      borderRadius: 12,
      border: `1px solid ${t.border}`,
      background: t.soft2,
      color: t.text,
      padding: "0 44px 0 12px",
      outline: "none",
      fontWeight: 800,
    },

    searchIcon: {
      position: "absolute",
      right: 12,
      top: 0,
      bottom: 0,
      display: "grid",
      placeItems: "center",
      opacity: 0.85,
      color: t.mutedText,
    },

    select: {
      height: 42,
      padding: "0 12px",
      borderRadius: 12,
      border: `1px solid ${t.border}`,
      background: t.soft2,
      color: t.text,
      fontWeight: 900,
      outline: "none",
      cursor: "pointer",
      minWidth: 160,
    },

    tableWrap: { width: "100%", overflowX: "auto" },

    table: {
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: 0,
      minWidth: 980,
    },

    th: {
      textAlign: "left",
      padding: "14px 14px",
      fontSize: 12,
      fontWeight: 950,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: t.mutedText,
      borderBottom: `1px solid ${t.border}`,
      background: t.soft2,
      position: "sticky",
      top: 0,
      zIndex: 1,
    },

    thClickable: {
      textAlign: "left",
      padding: "14px 14px",
      fontSize: 12,
      fontWeight: 950,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: t.mutedText,
      borderBottom: `1px solid ${t.border}`,
      background: t.soft2,
      position: "sticky",
      top: 0,
      zIndex: 1,
      cursor: "pointer",
      userSelect: "none",
      transition: "background 140ms ease, color 140ms ease",
    },

    tr: { background: t.soft2, transition: "background 160ms ease, box-shadow 160ms ease" },

    // orangey hover + left bar
    trHover: {
      background: isDark ? "rgba(210,63,11,0.10)" : "rgba(210,63,11,0.06)",
      boxShadow: "inset 4px 0 0 rgba(210,63,11,0.95)",
    },

    td: {
      padding: "14px 14px",
      borderBottom: `1px solid ${t.border}`,
      verticalAlign: "middle",
      color: t.text,
      fontWeight: 800,
      fontSize: 14,
      whiteSpace: "nowrap",
    },

    mutedCell: { color: t.mutedText, fontWeight: 900, fontSize: 13, whiteSpace: "nowrap" },

    imgBox: {
      width: 46,
      height: 46,
      borderRadius: 12,
      overflow: "hidden",
      background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
      display: "grid",
      placeItems: "center",
      border: `1px solid ${t.border}`,
      flex: "0 0 auto",
    },

    img: { width: "100%", height: "100%", objectFit: "cover", display: "block" },

    errorBox: { padding: 14, color: t.text, fontWeight: 900 },

    pagerRow: {
      padding: 14,
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
      background: t.soft,
      borderTop: `1px solid ${t.border}`,
    },

    primaryAction: {
      height: 42,
      padding: "0 16px",
      borderRadius: 12,
      border: `1px solid ${t.border}`,
      background: `linear-gradient(135deg, ${MAIN}, #ff7a45)`,
      color: "#fff",
      fontWeight: 900,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    },

    secondaryAction: {
      height: 42,
      padding: "0 14px",
      borderRadius: 12,
      border: `1px solid ${t.border}`,
      background: t.soft2,
      color: t.text,
      fontWeight: 900,
      cursor: "pointer",
    },

    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      border: `1px solid ${t.border}`,
      background: t.soft,
      color: t.text,
      fontWeight: 950,
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
    },

    iconBtnDanger: {
      width: 40,
      height: 40,
      borderRadius: 12,
      border: `1px solid ${isDark ? "rgba(255,80,80,0.35)" : "rgba(220,0,0,0.25)"}`,
      background: t.soft,
      color: t.text,
      fontWeight: 950,
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
    },

    // MODAL
    modalBackdrop: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.65)",
      display: "grid",
      placeItems: "center",
      zIndex: 9999,
      padding: 16,
    },

    modalContent: {
      position: "relative",
      maxWidth: "92vw",
      maxHeight: "92vh",
      background: t.soft,
      borderRadius: 16,
      padding: 16,
      boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
      border: `1px solid ${t.border}`,
    },

    modalImg: {
      maxWidth: "86vw",
      maxHeight: "70vh",
      objectFit: "contain",
      display: "block",
      borderRadius: 12,
      background: t.soft2,
      border: `1px solid ${t.border}`,
    },

    modalActions: {
      marginTop: 14,
      display: "flex",
      gap: 10,
      justifyContent: "flex-end",
      flexWrap: "wrap",
    },

    modalClose: {
      position: "absolute",
      top: 10,
      right: 10,
      width: 36,
      height: 36,
      borderRadius: 10,
      border: `1px solid ${t.border}`,
      background: t.soft2,
      color: t.text,
      fontWeight: 900,
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
    },
  };
}
