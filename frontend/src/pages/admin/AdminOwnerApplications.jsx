// src/pages/admin/AdminOwnerApplications.jsx
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

import {
  approveOwnerApplication,
  rejectOwnerApplication,
} from "../../utils/ownerApplicationApi";

import "./AdminEquipments.css";

function formatDateTimeFallback(value) {
  if (!value) return "-";
  const d = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
}

const STATUS_OPTIONS = ["All", "pending", "approved", "rejected"];

export default function AdminOwnerApplications() {
  const { theme } = useOutletContext();
  const t = adminThemes[theme]?.app || adminThemes.light.app;
  const isDark = theme === "dark";

  const { isAdmin } = useAuthMe();

  // ✅ uses the admin list endpoint
  const {
    rows,
    loading: loadingRows,
    error,
    reload,
  } = useApiList("/api/v1/admin/owner-applications", { authed: true });

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("pending"); // default view: pending
  const [sort, setSort] = useState({ key: "created", dir: "desc" });

  const pageSize = 10;
  const [page, setPage] = useState(1);

  const [appOpen, setAppOpen] = useState(false);
  const [active, setActive] = useState(null);

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setAppOpen(false);
        setApproveOpen(false);
        setRejectOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const searched = useMemo(() => {
    return globalSearch(rows, q, [
      (r) => r.id,
      (r) => r.gym_name,
      (r) => r.address,
      (r) => r.status,
      // user fields if included by API
      (r) => r.user?.name,
      (r) => r.user?.email,
      (r) => r.user?.user_id,
    ]);
  }, [rows, q]);

  const filtered = useMemo(() => {
    return searched.filter((r) => (status === "All" ? true : r.status === status));
  }, [searched, status]);

  useEffect(() => {
    setPage(1);
  }, [q, status]);

  const getValue = (r, key) => {
    switch (key) {
      case "gym":
        return tableValue.str(r.gym_name);
      case "user":
        return tableValue.str(r.user?.name || r.user?.email || "");
      case "status":
        return tableValue.str(r.status);
      case "created":
        return tableValue.dateMs(r.created_at);
      case "updated":
        return tableValue.dateMs(r.updated_at);
      case "id":
        return tableValue.num(r.id);
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
    pills.push(loadingRows ? "Loading…" : `${sorted.length} applications`);
    if (status !== "All") pills.push(status);
    return pills;
  }, [loadingRows, sorted.length, status]);

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

  const openView = (r) => {
    setErr("");
    setActive(r);
    setAppOpen(true);
  };

  const askApprove = (r) => {
    setErr("");
    setActive(r);
    setApproveOpen(true);
  };

  const askReject = (r) => {
    setErr("");
    setRejectReason("");
    setActive(r);
    setRejectOpen(true);
  };

  const doApprove = async () => {
    if (!active) return;
    setBusy(true);
    setErr("");
    try {
      await approveOwnerApplication(active.id);
      setApproveOpen(false);
      setAppOpen(false);
      reload();
    } catch (e) {
      setErr(e.message || "Approve failed.");
    } finally {
      setBusy(false);
    }
  };

  const doReject = async () => {
    if (!active) return;
    setBusy(true);
    setErr("");
    try {
      await rejectOwnerApplication(active.id, rejectReason?.trim() || null);
      setRejectOpen(false);
      setAppOpen(false);
      reload();
    } catch (e) {
      setErr(e.message || "Reject failed.");
    } finally {
      setBusy(false);
    }
  };

  const statusPillClass = (s) => {
    if (s === "approved") return "ae-pill";
    if (s === "pending") return "ae-pillMuted";
    return "ae-pillMuted";
  };

  return (
    <div className="ae-page" data-theme={theme} style={cssVars}>
      <div className="ae-topRow">
        <div className="ae-titleWrap">
          <div className="ae-pageTitle">Owner Applications</div>

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
            <div className="ae-leftActions">
              <span className="ae-mutedSmall">
                Review applications → approve makes user <b className="ae-strongText">owner</b> and creates a{" "}
                <b className="ae-strongText">gym</b>.
              </span>
            </div>

            <div className="ae-rightActions">
              <div className="ae-searchBox">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search applications…"
                  className="ae-searchInput"
                />
                <span className="ae-searchIcon">⌕</span>
              </div>

              <select value={status} onChange={(e) => setStatus(e.target.value)} className="ae-select">
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s === "All" ? "All statuses" : s}
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
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "gym"))}>
                      Gym{sortIndicator(sort, "gym")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "user"))}>
                      User{sortIndicator(sort, "user")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "status"))}>
                      Status{sortIndicator(sort, "status")}
                    </th>
                    <th className="ae-th ae-thClickable" onClick={() => setSort((p) => toggleSort(p, "created"))}>
                      Created{sortIndicator(sort, "created")}
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
                          <div className="ae-equipMeta">
                            <div className="ae-equipName">{r.gym_name || "-"}</div>
                            <div className="ae-mutedTiny">ID: {r.id}</div>
                          </div>
                        </td>

                        <td className="ae-td">
                          <div className="ae-equipMeta">
                            <div className="ae-equipName">{r.user?.name || r.user?.email || "-"}</div>
                            <div className="ae-mutedTiny">User ID: {r.user_id}</div>
                          </div>
                        </td>

                        <td className="ae-td">
                          <span className={statusPillClass(r.status)}>{r.status}</span>
                        </td>

                        <td className="ae-td ae-mutedCell">{formatDateTimeFallback(r.created_at)}</td>
                        <td className="ae-td ae-mutedCell">{formatDateTimeFallback(r.updated_at)}</td>

                        <td className="ae-td ae-tdRight">
                          <div className="ae-actionsInline">
                            <IconBtn title="View" className="ae-iconBtn" onClick={() => openView(r)}>
                              👁
                            </IconBtn>

                            {isAdmin && r.status === "pending" ? (
                              <>
                                <IconBtn
                                  title="Approve"
                                  className="ae-iconBtn"
                                  onClick={() => askApprove(r)}
                                >
                                  ✅
                                </IconBtn>
                                <IconBtn
                                  title="Reject"
                                  className="ae-iconBtnDanger"
                                  onClick={() => askReject(r)}
                                >
                                  ✕
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

      {/* VIEW MODAL */}
      {appOpen && active && (
        <div className="ae-backdrop" onClick={() => setAppOpen(false)}>
          <div className="ae-formModal" onClick={(e) => e.stopPropagation()}>
            <div className="ae-modalTopRow">
              <div className="ae-modalTitle">Application</div>
            </div>

            {err ? <div className="ae-alert ae-alertError">{err}</div> : null}

            <div className="ae-formGrid">
              <ReadOnly label="Application ID" value={String(active.id)} />
              <ReadOnly label="Status" value={active.status || "-"} />

              <ReadOnly label="Gym name" value={active.gym_name || "-"} full />
              <ReadOnly label="Address" value={active.address || "-"} full />

              <ReadOnly label="Latitude" value={active.latitude ?? "-"} />
              <ReadOnly label="Longitude" value={active.longitude ?? "-"} />

              <ReadOnly label="User ID" value={String(active.user_id ?? "-")} />
              <ReadOnly label="User" value={active.user?.name || active.user?.email || "-"} />

              <ReadOnly label="Created" value={formatDateTimeFallback(active.created_at)} />
              <ReadOnly label="Updated" value={formatDateTimeFallback(active.updated_at)} />
            </div>

            <div className="ae-modalFooter">
              {isAdmin && active.status === "pending" ? (
                <>
                  <button className="ae-btn ae-btnSecondary" onClick={() => askReject(active)} disabled={busy}>
                    Reject
                  </button>
                  <button className="ae-btn ae-btnPrimary" onClick={() => askApprove(active)} disabled={busy}>
                    Approve
                  </button>
                </>
              ) : (
                <button className="ae-btn ae-btnSecondary" onClick={() => setAppOpen(false)}>
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* APPROVE CONFIRM */}
      {approveOpen && active && (
        <div className="ae-backdrop ae-backdropTop" onClick={() => setApproveOpen(false)}>
          <div className="ae-confirmModalFancy" onClick={(e) => e.stopPropagation()}>
            <div className="ae-confirmHeader">
              <div className="ae-confirmIconWrap" aria-hidden="true">
                ✅
              </div>
              <div className="ae-confirmHeaderText">
                <div className="ae-confirmTitle">Approve application?</div>
                <div className="ae-mutedTiny">
                  This will promote the user to <b className="ae-strongText">owner</b> and create a{" "}
                  <b className="ae-strongText">gym</b> record.
                </div>
              </div>
              <button className="ae-modalClose" onClick={() => setApproveOpen(false)}>
                ✕
              </button>
            </div>

            {err ? <div className="ae-alert ae-alertError">{err}</div> : null}

            <div className="ae-confirmActions">
              <button className="ae-btn ae-btnSecondary" onClick={() => setApproveOpen(false)} disabled={busy}>
                Cancel
              </button>

              <button className="ae-btn ae-btnPrimary" onClick={doApprove} disabled={busy}>
                {busy ? "Approving…" : "Yes, approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT CONFIRM */}
      {rejectOpen && active && (
        <div className="ae-backdrop ae-backdropTop" onClick={() => setRejectOpen(false)}>
          <div className="ae-confirmModalFancy" onClick={(e) => e.stopPropagation()}>
            <div className="ae-confirmHeader">
              <div className="ae-confirmIconWrap" aria-hidden="true">
                ⚠️
              </div>
              <div className="ae-confirmHeaderText">
                <div className="ae-confirmTitle">Reject application?</div>
                <div className="ae-mutedTiny">This will mark the request as rejected.</div>
              </div>
              <button className="ae-modalClose" onClick={() => setRejectOpen(false)}>
                ✕
              </button>
            </div>

            {err ? <div className="ae-alert ae-alertError">{err}</div> : null}

            <label className="ae-field ae-fieldFull" style={{ marginTop: 10 }}>
              <div className="ae-fieldLabel">Reason (optional)</div>
              <input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="ae-fieldInput"
                placeholder="Optional note for the applicant…"
              />
            </label>

            <div className="ae-confirmActions">
              <button className="ae-btn ae-btnSecondary" onClick={() => setRejectOpen(false)} disabled={busy}>
                Cancel
              </button>

              <button className="ae-btn ae-btnDanger" onClick={doReject} disabled={busy}>
                {busy ? "Rejecting…" : "Yes, reject"}
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

function ReadOnly({ label, value, full }) {
  return (
    <label className={`ae-field ${full ? "ae-fieldFull" : ""}`}>
      <div className="ae-fieldLabel">{label}</div>
      <input value={value} disabled className="ae-fieldInput ae-fieldInputDisabled" />
    </label>
  );
}
