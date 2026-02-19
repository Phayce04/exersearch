// ✅ src/pages/user/WorkoutDayDetails.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import "./workoutDayDetails.css";
import {
  getUserWorkoutPlanDay,
  absoluteUrl,
  getUserSavedGyms,
  searchGyms,
  recalibrateWorkoutDayGym,
  recalibrateWorkoutPlanGym, // ✅ week / whole plan
  getGym,
} from "../../utils/workoutPlanApi";

const FALLBACK_EQUIPMENT_IMG = "https://i.imghippo.com/files/XIsw8670efM.jpg";

function prettyLabel(s = "") {
  return String(s)
    .trim()
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtReps(item) {
  const min = item?.reps_min;
  const max = item?.reps_max;
  if (!min && !max) return "—";
  if (min && max && Number(min) !== Number(max)) return `${min}–${max}`;
  return `${min || max}`;
}

function imgUrl(u) {
  const s = String(u || "").trim();
  if (!s) return "";
  return absoluteUrl(s);
}

function uniqById(list, idKey) {
  const map = new Map();
  for (const x of list || []) {
    const id = Number(x?.[idKey]);
    if (!id) continue;
    if (!map.has(id)) map.set(id, x);
  }
  return Array.from(map.values());
}

function normalizeEqName(s = "") {
  return String(s)
    .toLowerCase()
    .replace(/[/]/g, " ")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function eqAlias(norm = "") {
  if (!norm) return norm;
  const n = norm;

  if (n.includes("dumbell")) return "dumbbell";
  if (n.includes("free weights") && n.includes("dumb")) return "dumbbell";
  if (n === "free weights") return "dumbbell";
  if (n === "free weights dumbell") return "dumbbell";
  if (n === "free weights dumbbell") return "dumbbell";

  if (n.includes("adjustable bench")) return "bench";
  if (n === "bench") return "bench";

  if (n.includes("assisted pullups") || n.includes("assisted pull-up"))
    return "assisted pullup machine";

  return n;
}

// ✅ bodyweight ignore (matches your backend intent)
function isBodyweightEqName(name = "") {
  const n = normalizeEqName(name);
  return n.includes("bodyweight") || n.includes("no equipment");
}

function toEqSet(equipments = []) {
  const set = new Set();
  for (const e of equipments || []) {
    // ✅ ignore bodyweight from gym list too
    if (isBodyweightEqName(e?.name || "")) continue;
    const nm = eqAlias(normalizeEqName(e?.name || ""));
    if (nm) set.add(nm);
  }
  return set;
}

/* -------------------- CHANGE SUMMARY (for SweetAlert) -------------------- */

// ✅ Prefer backend notices if present (more reliable than original_exercise)
function buildChangeSummary(updatedDay) {
  const notices = Array.isArray(updatedDay?.recalibration_notices)
    ? updatedDay.recalibration_notices
    : [];

  // If backend provided notices, use them.
  if (notices.length) {
    const changes = [];

    for (const n of notices) {
      if (n?.type === "exercise_replaced") {
        changes.push({
          kind: "replaced",
          slot: prettyLabel(n?.slot_type || "slot"),
          from: n?.from_exercise_name || `Exercise #${n?.from_exercise_id || ""}`,
          to: n?.to_exercise_name || `Exercise #${n?.to_exercise_id || ""}`,
          reason: n?.reason || "",
        });
      }

      if (n?.type === "exercise_dropped") {
        changes.push({
          kind: "dropped",
          slot: prettyLabel(n?.slot_type || "slot"),
          from: n?.exercise_name || `Exercise #${n?.exercise_id || ""}`,
          to: "Removed",
          reason:
            n?.reason ||
            "No compatible replacement found. Volume redistributed to remaining exercises.",
          setsLost: Number(n?.sets_lost || 0),
        });
      }
    }

    return changes;
  }

  // Fallback: infer from is_modified + original_exercise (old behavior)
  const changes = [];
  for (const it of updatedDay?.exercises || []) {
    const from = it?.original_exercise?.name;
    const to = it?.exercise?.name;

    if (it?.is_modified && from && to && from !== to) {
      changes.push({
        kind: "replaced",
        slot: prettyLabel(it?.slot_type || "slot"),
        from,
        to,
        reason: "",
      });
    }
  }
  return changes;
}

function htmlChangeList(changes, summaryText = "") {
  const safeSummary = summaryText
    ? `
      <div style="text-align:left;padding:10px 12px;border:1px solid #fde68a;border-radius:12px;background:#fffbeb;margin-bottom:12px;">
        <div style="font-weight:900;color:#92400e;margin-bottom:4px;">Note</div>
        <div style="color:#92400e;font-weight:800;line-height:1.5;">
          ${summaryText}
        </div>
      </div>
    `
    : "";

  if (!changes.length) {
    return `
      ${safeSummary}
      <div style="text-align:left;">
        <div style="font-weight:900;color:#111827;margin-bottom:6px;">No swaps were needed</div>
        <div style="font-weight:700;color:#6b7280;line-height:1.5;">
          Everything already matches this gym’s equipment.
        </div>
      </div>
    `;
  }

  const rows = changes
    .map((c) => {
      const badge =
        c.kind === "dropped"
          ? `<span style="display:inline-block;padding:2px 8px;border-radius:999px;background:#fee2e2;color:#991b1b;font-weight:900;font-size:12px;margin-left:8px;">REMOVED</span>`
          : `<span style="display:inline-block;padding:2px 8px;border-radius:999px;background:#dcfce7;color:#166534;font-weight:900;font-size:12px;margin-left:8px;">SWAPPED</span>`;

      const setsLine =
        c.kind === "dropped" && c.setsLost
          ? `<div style="color:#6b7280;font-weight:800;margin-top:6px;">Sets redistributed: <span style="color:#111827;font-weight:900;">${c.setsLost}</span></div>`
          : "";

      const reasonLine = c.reason
        ? `<div style="color:#6b7280;font-weight:800;margin-top:6px;line-height:1.45;">${c.reason}</div>`
        : "";

      return `
        <div style="padding:10px 12px;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:10px;background:#fff;text-align:left;">
          <div style="font-weight:900;color:#111827;margin-bottom:6px;">
            ${c.slot} ${badge}
          </div>

          <div style="color:#6b7280;font-weight:800;">Was:
            <span style="color:#111827;font-weight:900;"> ${c.from}</span>
          </div>

          <div style="color:#6b7280;font-weight:800;">Now:
            <span style="color:#111827;font-weight:900;"> ${c.to}</span>
          </div>

          ${setsLine}
          ${reasonLine}
        </div>
      `;
    })
    .join("");

  return `<div style="text-align:left;">${safeSummary}${rows}</div>`;
}

function countKinds(changes = []) {
  let swapped = 0;
  let removed = 0;
  for (const c of changes) {
    if (c.kind === "replaced") swapped++;
    if (c.kind === "dropped") removed++;
  }
  return { swapped, removed };
}

export default function WorkoutDayDetails() {
  const { id } = useParams(); // user_plan_day_id
  const navigate = useNavigate();

  const [day, setDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ✅ equipment image modal (lightbox)
  const [imgModal, setImgModal] = useState({
    open: false,
    src: "",
    title: "",
    category: "",
    description: "",
  });

  // ✅ gym picker states (BOTTOM)
  const [savedGyms, setSavedGyms] = useState([]);
  const [gymQuery, setGymQuery] = useState("");
  const [gymResults, setGymResults] = useState([]);
  const [gymLoading, setGymLoading] = useState(false);
  const [gymErr, setGymErr] = useState("");
  const [recalibratingGymId, setRecalibratingGymId] = useState(null);

  // ✅ DAY preview/confirm modal (only for this day)
  const [gymConfirm, setGymConfirm] = useState({
    open: false,
    gym: null,
    hasEquip: [],
    missingEquip: [],
    affected: [],
  });

  // ✅ WEEK confirm modal (whole plan)
  const [gymWeekConfirm, setGymWeekConfirm] = useState({
    open: false,
    gym: null,
  });

  const closeImgModal = () =>
    setImgModal({
      open: false,
      src: "",
      title: "",
      category: "",
      description: "",
    });

  const closeGymConfirm = () =>
    setGymConfirm({
      open: false,
      gym: null,
      hasEquip: [],
      missingEquip: [],
      affected: [],
    });

  const closeGymWeekConfirm = () =>
    setGymWeekConfirm({
      open: false,
      gym: null,
    });

  async function refreshDay() {
    if (!id) return null;
    const res = await getUserWorkoutPlanDay(id);
    const d = res?.data || null;
    setDay(d);
    return d;
  }

  async function refreshSavedGyms() {
    try {
      const res = await getUserSavedGyms();
      setSavedGyms(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setSavedGyms([]);
    }
  }

  // ----------------------------
  // LOAD DAY DETAILS
  // ----------------------------
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr("");
      try {
        const res = await getUserWorkoutPlanDay(id);
        if (!alive) return;
        setDay(res?.data || null);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Failed to load workout day.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    if (id) load();

    return () => {
      alive = false;
    };
  }, [id]);

  // load saved gyms
  useEffect(() => {
    refreshSavedGyms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // gym search (debounced)
  useEffect(() => {
    let alive = true;

    const t = setTimeout(async () => {
      const q = gymQuery.trim();
      if (!q) {
        setGymResults([]);
        return;
      }

      setGymLoading(true);
      setGymErr("");
      try {
        const res = await searchGyms({ search: q });
        if (!alive) return;
        setGymResults(Array.isArray(res?.data) ? res.data : []);
      } catch (e) {
        if (!alive) return;
        setGymErr(e?.message || "Failed to search gyms.");
        setGymResults([]);
      } finally {
        if (!alive) return;
        setGymLoading(false);
      }
    }, 350);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [gymQuery]);

  // close modals on ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (imgModal.open) closeImgModal();
        if (gymConfirm.open) closeGymConfirm();
        if (gymWeekConfirm.open) closeGymWeekConfirm();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgModal.open, gymConfirm.open, gymWeekConfirm.open]);

  const isRest = !!day?.is_rest || (day?.exercises?.length ?? 0) === 0;

  // ----------------------------
  // DAY PREVIEW (FETCH FULL GYM FIRST)
  // ----------------------------
  function buildDayPreviewAndOpen(fullGym) {
    const gymEquipments = Array.isArray(fullGym?.equipments)
      ? fullGym.equipments
      : [];
    const gymEqSet = toEqSet(gymEquipments);

    const affected = [];
    const neededAll = new Map(); // norm -> pretty

    for (const it of day?.exercises || []) {
      const ex = it?.exercise || {};
      const req = Array.isArray(ex?.equipments) ? ex.equipments : [];
      if (!req.length) continue;

      const neededNorm = [];
      for (const e of req) {
        if (isBodyweightEqName(e?.name || "")) continue;
        const norm = eqAlias(normalizeEqName(e?.name || ""));
        if (!norm) continue;

        neededNorm.push(norm);
        const pretty = prettyLabel(e?.name || norm);
        if (!neededAll.has(norm)) neededAll.set(norm, pretty);
      }

      if (!neededNorm.length) continue;

      const missingForThis = neededNorm.filter((n) => !gymEqSet.has(n));
      if (missingForThis.length) {
        affected.push({
          exerciseName: ex?.name || `Exercise #${it?.exercise_id}`,
          missingEquipNames: missingForThis.map((n) => neededAll.get(n) || n),
          slot: it?.slot_type || "",
        });
      }
    }

    const hasEquip = [];
    const missingEquip = [];
    for (const [norm, pretty] of neededAll.entries()) {
      if (gymEqSet.has(norm)) hasEquip.push(pretty);
      else missingEquip.push(pretty);
    }
    hasEquip.sort();
    missingEquip.sort();

    setGymConfirm({
      open: true,
      gym: fullGym,
      hasEquip,
      missingEquip,
      affected,
    });
  }

  async function openGymDayModal(gym) {
    if (!gym?.gym_id) return;
    setGymErr("");
    try {
      const res = await getGym(gym.gym_id);
      const fullGym = res?.data || gym;
      buildDayPreviewAndOpen(fullGym);
    } catch (e) {
      setGymErr(e?.message || "Failed to load gym for preview.");
    }
  }

  // ----------------------------
  // WEEK CONFIRM (FETCH FULL GYM FIRST)
  // ----------------------------
  async function openGymWeekModal(gym) {
    if (!gym?.gym_id) return;
    setGymErr("");
    try {
      const res = await getGym(gym.gym_id);
      const fullGym = res?.data || gym;
      setGymWeekConfirm({ open: true, gym: fullGym });
    } catch (e) {
      setGymErr(e?.message || "Failed to load gym.");
    }
  }

  // ----------------------------
  // CONFIRM RECALIBRATE (DAY)
  // ----------------------------
  async function confirmRecalibrateDay() {
    const gym = gymConfirm.gym;
    if (!gym?.gym_id || !id) return;

    setRecalibratingGymId(gym.gym_id);
    setGymErr("");

    try {
      // backend returns day payload (should include recalibration_notices + recalibration_summary)
      await recalibrateWorkoutDayGym(id, gym.gym_id);

      closeGymConfirm();

      const updatedDay = await refreshDay();
      await refreshSavedGyms();

      const changes = buildChangeSummary(updatedDay);
      const { swapped, removed } = countKinds(changes);
      const summaryText =
        (updatedDay?.recalibration_summary && String(updatedDay.recalibration_summary)) ||
        (removed
          ? `${removed} exercise(s) were removed because no compatible replacement was found. Volume was redistributed.`
          : "");

      await Swal.fire({
        title: "Day recalibration complete",
        html: `
          <div style="text-align:left;font-weight:800;color:#374151;margin-bottom:10px;">
            Gym: <span style="font-weight:900;color:#111827;">${gym?.name || "Selected gym"}</span>
          </div>

          <div style="text-align:left;color:#6b7280;font-weight:800;line-height:1.6;margin-bottom:12px;">
            Results: <span style="color:#111827;font-weight:900;">${swapped}</span> swapped •
            <span style="color:#111827;font-weight:900;"> ${removed}</span> removed
          </div>

          ${htmlChangeList(changes, summaryText)}
        `,
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#d23f0b",
      });
    } catch (e) {
      setGymErr(e?.message || "Failed to recalibrate day for selected gym.");

      await Swal.fire({
        title: "Day recalibration failed",
        text: e?.message || "Failed to recalibrate day for selected gym.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#d23f0b",
      });
    } finally {
      setRecalibratingGymId(null);
    }
  }

  // ----------------------------
  // CONFIRM RECALIBRATE (WEEK / WHOLE PLAN)
  // ----------------------------
  async function confirmRecalibrateWeek() {
    const gym = gymWeekConfirm.gym;
    const planId = day?.plan?.user_plan_id;

    if (!gym?.gym_id || !planId) return;

    setRecalibratingGymId(gym.gym_id);
    setGymErr("");

    try {
      // ✅ use API response for summary + notices
      const res = await recalibrateWorkoutPlanGym(planId, gym.gym_id);
      const planPayload = res?.data || null;

      closeGymWeekConfirm();

      // refresh just this page's day (plan-wide changes may affect it)
      const updatedDay = await refreshDay();
      await refreshSavedGyms();

      const notices = Array.isArray(planPayload?.recalibration_notices)
        ? planPayload.recalibration_notices
        : [];

      const swapped = notices.filter((n) => n?.type === "exercise_replaced").length;
      const removed = notices.filter((n) => n?.type === "exercise_dropped").length;

      const summaryText =
        (planPayload?.recalibration_summary && String(planPayload.recalibration_summary)) ||
        (removed
          ? `${removed} exercise(s) were removed because no compatible replacement was found. Volume was redistributed.`
          : "");

      // show top few items (plan-wide) as a quick digest
      const topItems = notices.slice(0, 8).map((n) => {
        if (n?.type === "exercise_replaced") {
          const from = n?.from_exercise_name || `Exercise #${n?.from_exercise_id || ""}`;
          const to = n?.to_exercise_name || `Exercise #${n?.to_exercise_id || ""}`;
          const dayName = n?.user_plan_day_id ? `Day #${n.user_plan_day_id}` : "";
          return `
            <div style="padding:10px 12px;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:10px;background:#fff;text-align:left;">
              <div style="font-weight:900;color:#111827;margin-bottom:4px;">Swapped ${dayName ? `• ${dayName}` : ""}</div>
              <div style="color:#6b7280;font-weight:800;">Was: <span style="color:#111827;font-weight:900;">${from}</span></div>
              <div style="color:#6b7280;font-weight:800;">Now: <span style="color:#111827;font-weight:900;">${to}</span></div>
            </div>
          `;
        }

        if (n?.type === "exercise_dropped") {
          const ex = n?.exercise_name || `Exercise #${n?.exercise_id || ""}`;
          const sets = Number(n?.sets_lost || 0);
          const dayName = n?.user_plan_day_id ? `Day #${n.user_plan_day_id}` : "";
          return `
            <div style="padding:10px 12px;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:10px;background:#fff;text-align:left;">
              <div style="font-weight:900;color:#111827;margin-bottom:4px;">
                Removed ${dayName ? `• ${dayName}` : ""} 
                <span style="display:inline-block;padding:2px 8px;border-radius:999px;background:#fee2e2;color:#991b1b;font-weight:900;font-size:12px;margin-left:8px;">REMOVED</span>
              </div>
              <div style="color:#6b7280;font-weight:800;">${ex}</div>
              ${
                sets
                  ? `<div style="color:#6b7280;font-weight:800;margin-top:6px;">Sets redistributed: <span style="color:#111827;font-weight:900;">${sets}</span></div>`
                  : ""
              }
              ${
                n?.reason
                  ? `<div style="color:#6b7280;font-weight:800;margin-top:6px;line-height:1.45;">${String(
                      n.reason
                    )}</div>`
                  : ""
              }
            </div>
          `;
        }

        return "";
      });

      const digestHtml =
        topItems.length && topItems.join("").trim()
          ? `<div style="text-align:left;margin-top:12px;">
               <div style="font-weight:900;color:#111827;margin-bottom:8px;">Top changes</div>
               ${topItems.join("")}
               ${
                 notices.length > topItems.length
                   ? `<div style="color:#6b7280;font-weight:800;margin-top:6px;">
                        And ${notices.length - topItems.length} more change(s)…
                      </div>`
                   : ""
               }
             </div>`
          : "";

      await Swal.fire({
        title: "Week recalibration complete",
        html: `
          <div style="text-align:left;font-weight:800;color:#374151;margin-bottom:10px;">
            Gym applied to your full 7-day plan:
            <span style="font-weight:900;color:#111827;"> ${gym?.name || "Selected gym"}</span>
          </div>

          <div style="text-align:left;color:#6b7280;font-weight:800;line-height:1.6;margin-bottom:12px;">
            Results: <span style="color:#111827;font-weight:900;">${swapped}</span> swapped •
            <span style="color:#111827;font-weight:900;"> ${removed}</span> removed
          </div>

          ${
            summaryText
              ? `
              <div style="text-align:left;padding:10px 12px;border:1px solid #fde68a;border-radius:12px;background:#fffbeb;margin-bottom:12px;">
                <div style="font-weight:900;color:#92400e;margin-bottom:4px;">Note</div>
                <div style="color:#92400e;font-weight:800;line-height:1.5;">
                  ${summaryText}
                </div>
              </div>
            `
              : ""
          }

          ${
            digestHtml ||
            `<div style="text-align:left;color:#6b7280;font-weight:800;line-height:1.6;">
              We checked every day in your plan against this gym’s equipment and swapped unsupported exercises where needed.
            </div>`
          }
        `,
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#d23f0b",
      });

      // optional: if the plan-wide recalibration changed THIS day, you can pop a smaller followup
      // based on updatedDay?.recalibration_notices if you want.
      void updatedDay;
    } catch (e) {
      setGymErr(e?.message || "Failed to recalibrate whole week.");

      await Swal.fire({
        title: "Week recalibration failed",
        text: e?.message || "Failed to recalibrate whole week.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#d23f0b",
      });
    } finally {
      setRecalibratingGymId(null);
    }
  }

  return (
    <div className="wdp">
      <div className="wdp-headerbar">
        <div className="wdp-container">
          <div className="wdp-header">
            <div className="wdp-header-left">
              <h1 className="wdp-header-title">
                {day?.weekday_name || "Workout Day"}
              </h1>

              <div className="wdp-header-meta">
                {isRest ? (
                  <span className="wdp-header-pill is-rest">Rest</span>
                ) : (
                  <span className="wdp-header-pill">
                    {prettyLabel(day?.focus || "workout")}
                  </span>
                )}

                {day?.plan?.start_date ? (
                  <span className="wdp-header-muted">
                    Plan start:{" "}
                    <b>{new Date(day.plan.start_date).toDateString()}</b>
                  </span>
                ) : null}
              </div>
            </div>

            <div className="wdp-header-right">
              <button
                className="wdp-header-btn"
                type="button"
                onClick={() => navigate("/home/workout")}
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="wdp-container wdp-body">
        {loading ? (
          <div className="wdp-card">
            <div className="wdp-loading">Loading…</div>
          </div>
        ) : err ? (
          <div className="wdp-card">
            <div className="wdp-error">{err}</div>
          </div>
        ) : !day ? (
          <div className="wdp-card">
            <div className="wdp-error">No data found.</div>
          </div>
        ) : isRest ? (
          <div className="wdp-card">
            <h2 className="wdp-section-title">Rest day</h2>
            <ul className="wdp-rest">
              <li>Recovery / Mobility</li>
              <li>Optional walk 20–30 min</li>
              <li>Hydrate + sleep</li>
            </ul>
          </div>
        ) : (
          <>
            {/* EXERCISES */}
            <section className="wdp-card">
              <div className="wdp-card-head">
                <div className="wdp-card-head-title">Exercises</div>
                <div className="wdp-card-head-tag">
                  {(day.exercises || []).length} items
                </div>
              </div>

              <div className="wdp-card-body">
                <div className="wdp-exlist">
                  {(day.exercises || []).map((it) => {
                    const ex = it?.exercise || {};
                    const eqsRaw = Array.isArray(ex?.equipments)
                      ? ex.equipments
                      : [];
                    const eqs = uniqById(eqsRaw, "equipment_id");

                    return (
                      <article
                        key={it.user_plan_exercise_id}
                        className="wdp-exitem"
                      >
                        <div className="wdp-exleft">
                          <div className="wdp-exname">
                            {ex?.name || `Exercise #${it.exercise_id}`}
                          </div>

                          <div className="wdp-exmeta">
                            <span className="wdp-tag">
                              {prettyLabel(it?.slot_type || "slot")}
                            </span>
                            <span className="wdp-tag">
                              {prettyLabel(ex?.difficulty || "—")}
                            </span>
                            <span className="wdp-tag">
                              {prettyLabel(ex?.primary_muscle || "—")}
                            </span>
                          </div>

                          <div className="wdp-prescription">
                            <div className="wdp-presc">
                              <span className="wdp-presc-label">Sets</span>
                              <span className="wdp-presc-val">
                                {it?.sets ?? "—"}
                              </span>
                            </div>
                            <div className="wdp-presc">
                              <span className="wdp-presc-label">Reps</span>
                              <span className="wdp-presc-val">
                                {fmtReps(it)}
                              </span>
                            </div>
                            <div className="wdp-presc">
                              <span className="wdp-presc-label">Rest</span>
                              <span className="wdp-presc-val">
                                {it?.rest_seconds ? `${it.rest_seconds}s` : "—"}
                              </span>
                            </div>
                          </div>

                          {Array.isArray(ex?.instructions) &&
                          ex.instructions.length ? (
                            <div className="wdp-instructions">
                              <div className="wdp-mini-title">How to do it</div>
                              <ol>
                                {ex.instructions.slice(0, 8).map((step, idx) => (
                                  <li key={idx}>{String(step)}</li>
                                ))}
                              </ol>
                            </div>
                          ) : null}
                        </div>

                        <aside className="wdp-exright">
                          <div className="wdp-mini-title">Machines / Equipment</div>

                          {eqs.length ? (
                            <div className="wdp-eqstack">
                              {eqs.map((eq) => {
                                const title = prettyLabel(
                                  eq?.name || `Equipment #${eq?.equipment_id}`
                                );
                                const img = imgUrl(eq?.image_url);

                                return (
                                  <div
                                    key={eq.equipment_id}
                                    className="wdp-eqcard"
                                  >
                                    <button
                                      type="button"
                                      className="wdp-eqimgbtn"
                                      onClick={() =>
                                        setImgModal({
                                          open: true,
                                          src: img || FALLBACK_EQUIPMENT_IMG,
                                          title,
                                          category: eq?.category
                                            ? prettyLabel(eq.category)
                                            : "",
                                          description: eq?.description
                                            ? String(eq.description)
                                            : "",
                                        })
                                      }
                                      aria-label={`Open image: ${title}`}
                                    >
                                      <div className="wdp-eqimgwrap">
                                        <img
                                          src={img || FALLBACK_EQUIPMENT_IMG}
                                          alt={title}
                                          className="wdp-eqimg"
                                          loading="lazy"
                                          onError={(e) => {
                                            e.currentTarget.src =
                                              FALLBACK_EQUIPMENT_IMG;
                                          }}
                                        />
                                        <span className="wdp-eqzoom">Zoom</span>
                                      </div>
                                    </button>

                                    <div className="wdp-eqcontent">
                                      <div className="wdp-eqtitle">{title}</div>

                                      {eq?.category ? (
                                        <div className="wdp-eqmeta">
                                          {prettyLabel(eq.category)}
                                        </div>
                                      ) : null}

                                      {eq?.description ? (
                                        <div className="wdp-eqdesc">
                                          {eq.description}
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="wdp-muted">None / bodyweight</div>
                          )}
                        </aside>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>

            <div className="wdp-gap" />

            {/* ✅ GYM PICKER AT BOTTOM */}
            <section className="wdp-card wdp-gymcard">
              <div className="wdp-card-head">
                <div className="wdp-card-head-title">
                  Customize for your gyms. Choose: this day or the whole week.
                </div>
                <div className="wdp-card-head-tag">
                  {day?.plan?.gym_id ? "Selected" : "Not set"}
                </div>
              </div>

              <div className="wdp-card-body">
                {gymErr ? (
                  <div className="wdp-error" style={{ marginBottom: 12 }}>
                    {gymErr}
                  </div>
                ) : null}

                {/* Saved gyms */}
                {savedGyms?.length ? (
                  <div className="wdp-saved-list">
                    {savedGyms.map((g) => (
                      <div key={g.gym_id} className="wdp-saved-card">
                        <div className="wdp-saved-image">
                          <img
                            src={
                              g?.main_image_url
                                ? imgUrl(g.main_image_url)
                                : FALLBACK_EQUIPMENT_IMG
                            }
                            alt={g?.name || "Gym"}
                            onError={(e) => {
                              e.currentTarget.src = FALLBACK_EQUIPMENT_IMG;
                            }}
                          />
                        </div>

                        <div className="wdp-saved-details">
                          <div className="wdp-saved-toprow">
                            <div>
                              <h3 className="wdp-saved-title">{g?.name}</h3>
                              <p className="wdp-saved-location">
                                {g?.address || ""}
                              </p>
                            </div>

                            {g?.daily_price ? (
                              <div className="wdp-saved-price">
                                <span className="wdp-price-pill">
                                  ₱{g.daily_price} / day
                                </span>
                              </div>
                            ) : null}
                          </div>

                          <div className="wdp-saved-meta">
                            {g?.gym_type ? (
                              <span className="wdp-meta-pill">
                                {prettyLabel(g.gym_type)}
                              </span>
                            ) : null}
                            {g?.is_airconditioned ? (
                              <span className="wdp-meta-pill">
                                Airconditioned
                              </span>
                            ) : null}
                            {g?.is_24_hours ? (
                              <span className="wdp-meta-pill">24 hours</span>
                            ) : null}
                          </div>

                          <div className="wdp-saved-actions">
                            <button
                              className="wdp-btn-solid"
                              type="button"
                              onClick={() => openGymDayModal(g)}
                              disabled={!!recalibratingGymId}
                            >
                              Recalibrate this day
                            </button>

                            <button
                              className="wdp-btn-outline"
                              type="button"
                              onClick={() => openGymWeekModal(g)}
                              disabled={!!recalibratingGymId}
                            >
                              Recalibrate whole week
                            </button>

                            <button
                              className="wdp-btn-outline"
                              type="button"
                              onClick={() => navigate(`/home/gym/${g.gym_id}`)}
                            >
                              View gym
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="wdp-muted" style={{ marginBottom: 12 }}>
                    No saved gyms yet.
                  </div>
                )}

                {/* Search gyms */}
                <div className="wdp-gymsearch-wrap">
                  <div className="wdp-gymsearch-title">Find a gym</div>

                  <div className="wdp-gymsearch">
                    <div className="wdp-searchfield">
                      <span className="wdp-searchicon" aria-hidden="true">
                        🔎
                      </span>
                      <input
                        className="wdp-input wdp-input--search"
                        value={gymQuery}
                        onChange={(e) => setGymQuery(e.target.value)}
                        placeholder="Search gyms by name…"
                      />
                    </div>

                    <button
                      className="wdp-btn-outline wdp-btn-outline--finder"
                      type="button"
                      onClick={() => navigate("/home/find-gyms")}
                    >
                      Open gym finder
                    </button>
                  </div>

                  {gymLoading ? <div className="wdp-muted">Searching…</div> : null}

                  {!gymLoading && gymResults.length ? (
                    <div className="wdp-gymresults">
                      {gymResults.slice(0, 8).map((g) => (
                        <button
                          key={g.gym_id}
                          type="button"
                          className="wdp-gymresult"
                          onClick={() => openGymDayModal(g)}
                          disabled={!!recalibratingGymId}
                        >
                          <div className="wdp-gymresult-left">
                            <div className="wdp-gymname">{g.name}</div>
                            <div className="wdp-gymaddr">
                              {g.address ? g.address : ""}
                            </div>
                          </div>
                          <div className="wdp-gymcta">Day</div>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {!gymLoading && gymQuery.trim() && !gymResults.length ? (
                    <div className="wdp-muted" style={{ marginTop: 10 }}>
                      No gyms found.
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {/* ✅ Equipment Image Modal */}
      {imgModal.open ? (
        <div
          className="wdp-modal-overlay"
          onClick={closeImgModal}
          role="presentation"
        >
          <div
            className="wdp-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Equipment image"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="wdp-modal-head">
              <div className="wdp-modal-title">{imgModal.title}</div>
              <button
                className="wdp-modal-close"
                type="button"
                onClick={closeImgModal}
              >
                ✕
              </button>
            </div>

            {imgModal.category ? (
              <div className="wdp-modal-meta">{imgModal.category}</div>
            ) : null}

            <div className="wdp-modal-imgwrap">
              <img
                className="wdp-modal-img"
                src={imgModal.src || FALLBACK_EQUIPMENT_IMG}
                alt={imgModal.title}
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_EQUIPMENT_IMG;
                }}
              />
            </div>

            {imgModal.description ? (
              <div className="wdp-modal-desc">{imgModal.description}</div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ✅ DAY Gym Preview / Confirm Modal */}
      {gymConfirm.open ? (
        <div
          className="wdp-modal-overlay"
          onClick={closeGymConfirm}
          role="presentation"
        >
          <div
            className="wdp-modal wdp-modal--wide"
            role="dialog"
            aria-modal="true"
            aria-label="Recalibrate gym confirmation"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="wdp-modal-head wdp-modal-head--orange">
              <div className="wdp-modal-head-left">
                <div className="wdp-modal-title wdp-modal-title--light">
                  Recalibrate this day for
                </div>
                <div className="wdp-modal-sub">{gymConfirm.gym?.name}</div>
              </div>

              <button
                className="wdp-modal-close wdp-modal-close--light"
                type="button"
                onClick={closeGymConfirm}
              >
                ✕
              </button>
            </div>

            <div className="wdp-modal-scroll">
              <div className="wdp-modal-note">
                We’ll customize today’s exercises based on this gym’s available
                equipment.
              </div>

              <div className="wdp-eqcheck">
                <div className="wdp-eqcheck-col">
                  <div className="wdp-mini-title">Has (needed today)</div>
                  {gymConfirm.hasEquip.length ? (
                    <div className="wdp-pillwrap">
                      {gymConfirm.hasEquip.slice(0, 60).map((x, i) => (
                        <span key={i} className="wdp-pill wdp-pill--ok">
                          {x}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="wdp-muted">None matched.</div>
                  )}
                </div>

                <div className="wdp-eqcheck-col">
                  <div className="wdp-mini-title">Missing (needed today)</div>
                  {gymConfirm.missingEquip.length ? (
                    <div className="wdp-pillwrap">
                      {gymConfirm.missingEquip.slice(0, 60).map((x, i) => (
                        <span key={i} className="wdp-pill wdp-pill--bad">
                          {x}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="wdp-muted">None 🎉</div>
                  )}
                </div>
              </div>

              <div className="wdp-mini-title" style={{ marginTop: 14 }}>
                Exercises likely to change today
              </div>

              {gymConfirm.affected.length ? (
                <div className="wdp-affected">
                  {gymConfirm.affected.slice(0, 40).map((a, i) => (
                    <div key={i} className="wdp-affected-row">
                      <div className="wdp-affected-ex">{a.exerciseName}</div>
                      <div className="wdp-muted" style={{ marginTop: 4 }}>
                        Missing: {a.missingEquipNames.join(", ")}
                        {a.slot ? ` • Slot: ${prettyLabel(a.slot)}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="wdp-muted">
                  No equipment conflicts detected. Recalibration may still
                  fine-tune options.
                </div>
              )}

              <div className="wdp-modal-actions">
                <button
                  className="wdp-btn-outline"
                  type="button"
                  onClick={closeGymConfirm}
                >
                  Cancel
                </button>

                <button
                  className="wdp-btn-solid"
                  type="button"
                  onClick={confirmRecalibrateDay}
                  disabled={!!recalibratingGymId}
                >
                  {recalibratingGymId ? "Recalibrating…" : "Recalibrate this day"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ✅ WEEK / WHOLE PLAN Confirm Modal */}
      {gymWeekConfirm.open ? (
        <div
          className="wdp-modal-overlay"
          onClick={closeGymWeekConfirm}
          role="presentation"
        >
          <div
            className="wdp-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Recalibrate whole week confirmation"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="wdp-modal-head wdp-modal-head--orange">
              <div className="wdp-modal-head-left">
                <div className="wdp-modal-title wdp-modal-title--light">
                  Recalibrate whole week for
                </div>
                <div className="wdp-modal-sub">{gymWeekConfirm.gym?.name}</div>
              </div>

              <button
                className="wdp-modal-close wdp-modal-close--light"
                type="button"
                onClick={closeGymWeekConfirm}
              >
                ✕
              </button>
            </div>

            <div className="wdp-modal-scroll">
              <div className="wdp-modal-note">
                This will update your <b>entire 7-day plan</b> to match this gym’s
                available equipment. More exercises may change compared to a
                single day.
              </div>

              <div className="wdp-affected" style={{ marginTop: 10 }}>
                <div className="wdp-affected-row">
                  <div className="wdp-affected-ex">What will happen</div>
                  <div className="wdp-muted" style={{ marginTop: 4 }}>
                    • Each day will be checked for unsupported equipment
                    <br />
                    • Unsupported exercises will be swapped to valid alternatives
                    <br />
                    • If no alternatives exist, an exercise may be removed and
                    volume redistributed
                  </div>
                </div>
              </div>

              <div className="wdp-modal-actions">
                <button
                  className="wdp-btn-outline"
                  type="button"
                  onClick={closeGymWeekConfirm}
                >
                  Cancel
                </button>

                <button
                  className="wdp-btn-solid"
                  type="button"
                  onClick={confirmRecalibrateWeek}
                  disabled={!!recalibratingGymId}
                >
                  {recalibratingGymId ? "Recalibrating…" : "Recalibrate whole week"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
