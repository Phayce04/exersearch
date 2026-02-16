// WorkoutWeek.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./workoutWeek.css";
import {
  generateUserWorkoutPlan,
  getUserWorkoutPlan,
} from "../../utils/workoutPlanApi";

const BRAND = "#ff8c00";

const WEEK = [
  { weekday: 1, name: "Monday" },
  { weekday: 2, name: "Tuesday" },
  { weekday: 3, name: "Wednesday" },
  { weekday: 4, name: "Thursday" },
  { weekday: 5, name: "Friday" },
  { weekday: 6, name: "Saturday" },
  { weekday: 7, name: "Sunday" },
];

function titleCase(s = "") {
  return String(s)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function countSets(day) {
  const ex = day?.exercises || [];
  return ex.reduce((sum, e) => sum + (Number(e.sets) || 0), 0);
}

export default function WorkoutWeek() {
  const [plan, setPlan] = useState(null);
  const [activePlanId, setActivePlanId] = useState(null);

  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [error, setError] = useState("");

  const weekDays = useMemo(() => {
    const apiDays = plan?.days || [];
    const byWeekday = new Map(apiDays.map((d) => [Number(d.weekday), d]));

    return WEEK.map((w, idx) => {
      const d = byWeekday.get(w.weekday);

      if (!d) {
        return {
          weekday: w.weekday,
          weekday_name: w.name,
          day_number: idx + 1,
          is_rest: true,
          focus: "rest",
          exercises: [],
        };
      }

      return {
        ...d,
        weekday_name: d.weekday_name || w.name,
        day_number: d.day_number ?? idx + 1,
        focus: d.focus || "workout",
        exercises: Array.isArray(d.exercises) ? d.exercises : [],
      };
    });
  }, [plan]);

  const topRow = weekDays.slice(0, 4);
  const bottomRow = weekDays.slice(4, 7);

  async function handleGenerate() {
    setError("");
    setLoadingGenerate(true);

    try {
      const res = await generateUserWorkoutPlan({});
      const newPlan = res?.data || null;

      if (!newPlan?.user_plan_id) {
        throw new Error("Generate succeeded but plan data is missing.");
      }

      setPlan(newPlan);
      setActivePlanId(newPlan.user_plan_id);
    } catch (e) {
      setError(e?.message || "Failed to generate plan.");
    } finally {
      setLoadingGenerate(false);
    }
  }

  async function handleLoadPlan(id) {
    if (!id) return;
    setError("");
    setLoadingPlan(true);

    try {
      const res = await getUserWorkoutPlan(id);
      setPlan(res?.data || null);
    } catch (e) {
      setError(e?.message || "Failed to load plan.");
    } finally {
      setLoadingPlan(false);
    }
  }

  useEffect(() => {
    if (activePlanId) handleLoadPlan(activePlanId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlanId]);

  const hasPlan = !!plan;

  return (
    <div className="ww" style={{ "--brand": BRAND }}>
      {!hasPlan ? (
        <section className="ww-landing">
          <div className="ww-landing-inner">
            <h1 className="ww-landing-title">
              FIND YOUR WORKOUT  <br />
              PLAN
            </h1>

            <button
              className="ww-landing-btn"
              onClick={handleGenerate}
              disabled={loadingGenerate}
              type="button"
            >
              {loadingGenerate ? "Generating..." : "Generate Plan"}
            </button>

            {error ? <div className="ww-landing-error">{error}</div> : null}
          </div>
        </section>
      ) : (
        <div className="ww-page">
          {/* ✅ FULL-WIDTH HEADER BAR */}
          <div className="ww-headerbar">
            <div className="ww-container">
              <header className="ww-header">
                <div className="ww-header-left">
                  <h1 className="ww-title">My Weekly Workout Plan</h1>

                  <div className="ww-meta">
                    {loadingPlan && <span className="ww-muted">Loading…</span>}

                    {plan?.template && (
                      <span className="ww-pill">
                        {titleCase(plan.template.goal)} •{" "}
                        {titleCase(plan.template.split_type)} •{" "}
                        {plan.template.days_per_week} days/week
                      </span>
                    )}

                    {plan?.start_date && (
                      <span className="ww-muted">
                        Start: <b>{new Date(plan.start_date).toDateString()}</b>
                      </span>
                    )}
                  </div>
                </div>

                <div className="ww-header-right">
                  <button
                    className="ww-btn ww-btn-ghost"
                    onClick={handleGenerate}
                    disabled={loadingGenerate}
                    type="button"
                    title="Generate a fresh plan"
                  >
                    {loadingGenerate ? "Generating..." : "Regenerate"}
                  </button>
                </div>
              </header>

              {error ? <div className="ww-header-error">{error}</div> : null}
            </div>
          </div>

          {/* ✅ CONTENT CONTAINER (centered) */}
          <div className="ww-container ww-body">
            <section className="ww-grid-wrap">
              <div className="ww-grid ww-grid-top">
                {topRow.map((day) => (
                  <DayCard key={day.weekday} day={day} />
                ))}
              </div>

              <div className="ww-grid ww-grid-bottom">
                {bottomRow.map((day) => (
                  <DayCard key={day.weekday} day={day} />
                ))}
              </div>
            </section>

            <footer className="ww-footer">
              <button
                className="ww-footer-btn"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                type="button"
              >
                Exersearch
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

function DayCard({ day }) {
  const isRest = !!day.is_rest || (day.exercises?.length ?? 0) === 0;
  const focusLabel = titleCase(isRest ? "rest" : day.focus);
  const setsTotal = countSets(day);

  // ✅ show 6, no "+ more"
  const list = (day.exercises || []).slice(0, 6);

  return (
    <article className={`ww-card ${isRest ? "is-rest" : ""}`}>
      <div className="ww-card-head">
        <div className="ww-card-headbg" />

        <div className="ww-card-top">
          <div className="ww-card-day">{day.weekday_name || "Day"}</div>

          <div className="ww-card-chip">
            <span className="ww-card-chip-num">
              {day.day_number || day.weekday}
            </span>
            <span className="ww-card-chip-label">{focusLabel}</span>
          </div>
        </div>
      </div>

      <div className="ww-card-body">
        {isRest ? (
          <ul className="ww-list">
            <li>
              <span>Recovery</span> / Mobility
            </li>
            <li>
              <span>Optional</span> Walk 20–30 min
            </li>
            <li>
              <span>Hydrate</span> + sleep
            </li>
          </ul>
        ) : (
          <ul className="ww-list">
            <li className="ww-list-strong">
              <span>{list.length}</span> Exercises shown
            </li>
            <li className="ww-list-strong">
              <span>{setsTotal}</span> Total Sets
            </li>

            <div className="ww-divider" />

            {list.map((ex) => (
              <li
                key={
                  ex.user_plan_exercise_id ||
                  ex.template_day_exercise_id ||
                  ex.exercise_id
                }
                className="ww-ex"
                title={ex.exercise?.name || ""}
              >
                <span className="ww-ex-sets">{ex.sets}×</span>
                <span className="ww-ex-name">
                  {ex.exercise?.name || `Exercise #${ex.exercise_id}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        className={`ww-btn ww-btn-card ${isRest ? "is-rest" : ""}`}
        type="button"
        onClick={() => {
          alert(
            isRest
              ? `${day.weekday_name}: Rest day`
              : `${day.weekday_name}: ${titleCase(day.focus)} day`
          );
        }}
      >
        {isRest ? "Rest Day" : "View Details"}
      </button>
    </article>
  );
}
