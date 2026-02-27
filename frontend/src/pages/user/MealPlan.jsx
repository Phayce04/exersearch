import { useState, useEffect } from "react";
import "./MealPlan.css";
import { api } from "../../utils/api";

/* ── Constants ────────────────────────────────────────────────────────────── */
const DIETARY = [
  { id: "none",        label: "No Restrictions" },
  { id: "halal",       label: "Halal" },
  { id: "vegetarian",  label: "Vegetarian" },
  { id: "vegan",       label: "Vegan" },
  { id: "pescatarian", label: "Pescatarian" },
  { id: "low-carb",    label: "Low Carb" },
  { id: "gluten-free", label: "Gluten Free" },
];

const MEAL_ICONS   = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };
const MEAL_THEMES  = {
  breakfast: { bg: "#fff7ed", accent: "#d4660a", border: "#fed7aa" },
  lunch:     { bg: "#fefce8", accent: "#92400e", border: "#fde68a" },
  dinner:    { bg: "#f0fdf4", accent: "#166534", border: "#bbf7d0" },
  snack:     { bg: "#eff6ff", accent: "#1d4ed8", border: "#bfdbfe" },
};

/* ── Adherence badge ──────────────────────────────────────────────────────── */
function AdherenceBadge({ score }) {
  const color = score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626";
  const label = score >= 80 ? "On Target" : score >= 60 ? "Close" : "Off Target";
  return (
    <span className="mpai-adherence-badge" style={{ background: color + "18", color, border: `1px solid ${color}35` }}>
      {score}% {label}
    </span>
  );
}

/* ── MacroBar ─────────────────────────────────────────────────────────────── */
function MacroBar({ protein, carbs, fats }) {
  const total = (protein * 4) + (carbs * 4) + (fats * 9);
  if (!total) return null;
  const p = Math.round(protein * 4 / total * 100);
  const c = Math.round(carbs   * 4 / total * 100);
  const f = 100 - p - c;
  return (
    <div className="mpai-macro-bar">
      <div className="mpai-macro-bar__fill" style={{ width: p + "%", background: "#ef4444" }} title={`Protein ${p}%`} />
      <div className="mpai-macro-bar__fill" style={{ width: c + "%", background: "#f59e0b" }} title={`Carbs ${c}%`} />
      <div className="mpai-macro-bar__fill" style={{ width: f + "%", background: "#3b82f6" }} title={`Fats ${f}%`} />
    </div>
  );
}

/* ── MealCard ─────────────────────────────────────────────────────────────── */
function MealCard({ meal }) {
  const [open, setOpen]     = useState(false);
  const [ingOpen, setIngOpen] = useState(false);
  const theme = MEAL_THEMES[meal.meal_type] || MEAL_THEMES.breakfast;
  const icon  = MEAL_ICONS[meal.meal_type]  || "🍴";

  const calories = meal.total_calories ?? meal.calories ?? 0;
  const protein  = meal.total_protein  ?? meal.protein  ?? 0;
  const carbs    = meal.total_carbs    ?? meal.carbs    ?? 0;
  const fats     = meal.total_fats     ?? meal.fats     ?? 0;

  return (
    <div className="mpai-card mpai-meal-card">
      {/* Header row */}
      <button className="mpai-meal-card__btn" onClick={() => setOpen(o => !o)}>
        <div className="mpai-meal-card__icon" style={{ background: theme.bg }}>{icon}</div>
        <div className="mpai-meal-card__info">
          <span className="mpai-meal-card__type-badge"
            style={{ color: theme.accent, background: theme.bg, borderColor: theme.border }}>
            {meal.meal_type}
          </span>
          <p className="mpai-meal-card__name">{meal.name}</p>
        </div>
        <div className="mpai-meal-card__right">
          <p className="mpai-meal-card__cost">₱{Number(meal.estimated_cost).toFixed(0)}</p>
          <p className="mpai-meal-card__kcal">{Math.round(calories)} kcal</p>
          <span className="mpai-meal-card__chevron">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Macro pills */}
      <div className="mpai-meal-card__pills">
        {[["P", protein, "#ef4444"], ["C", carbs, "#f59e0b"], ["F", fats, "#3b82f6"]].map(([l, v, c]) => (
          <span key={l} className="mpai-pill" style={{ background: c + "18", color: c, border: `1px solid ${c}35` }}>
            {l}: {Number(v).toFixed(1)}g
          </span>
        ))}
      </div>

      <MacroBar protein={protein} carbs={carbs} fats={fats} />

      {/* Expanded detail */}
      {open && (
        <div className="mpai-meal-card__detail">

          {/* Diet tags */}
          {meal.diet_tags?.length > 0 && (
            <div className="mpai-meal-card__section">
              <p className="mpai-ingredients-label">Dietary Tags</p>
              <div className="mpai-dietary-chips" style={{ padding: "0 1.5rem 0.75rem" }}>
                {meal.diet_tags.map((tag, i) => (
                  <span key={i} className="mpai-dietary-chip" style={{ fontSize: "0.75rem" }}>{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Ingredients breakdown */}
          {meal.ingredients?.length > 0 && (
            <div className="mpai-meal-card__section">
              <button className="mpai-ing-toggle" onClick={() => setIngOpen(o => !o)}>
                <span>🥗 Ingredients ({meal.ingredients.length})</span>
                <span>{ingOpen ? "▲" : "▼"}</span>
              </button>

              {ingOpen && (
                <div className="mpai-ing-list">
                  {meal.ingredients.map((ing, i) => (
                    <div key={i} className="mpai-ing-row">
                      <div className="mpai-ing-row__left">
                        <span className="mpai-ing-row__name">{ing.name}</span>
                        <span className="mpai-ing-row__amount">
                          {ing.display_amount} {ing.display_unit} · {ing.amount_grams}g
                        </span>
                      </div>
                      <div className="mpai-ing-row__right">
                        <span className="mpai-ing-row__cal">{Math.round(ing.calories ?? 0)} kcal</span>
                        <div className="mpai-ing-row__macros">
                          <span style={{ color: "#ef4444" }}>P:{Number(ing.protein ?? 0).toFixed(1)}</span>
                          <span style={{ color: "#f59e0b" }}>C:{Number(ing.carbs   ?? 0).toFixed(1)}</span>
                          <span style={{ color: "#3b82f6" }}>F:{Number(ing.fats    ?? 0).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── ShoppingList ─────────────────────────────────────────────────────────── */
function ShoppingList({ data }) {
  const [open, setOpen] = useState(false);
  if (!data) return null;

  return (
    <div className="mpai-card mpai-shopping-card">
      <button className="mpai-shopping-toggle" onClick={() => setOpen(o => !o)}>
        <div>
          <p className="mpai-shopping-toggle__title">🛒 Shopping List</p>
          <p className="mpai-shopping-toggle__sub">
            {data.total_items} items · Est. ₱{data.total_cost}
          </p>
        </div>
        <span>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mpai-shopping-body">
          {Object.entries(data.by_category || {}).map(([cat, items]) => (
            <div key={cat} className="mpai-shopping-cat">
              <p className="mpai-shopping-cat__label">{cat}</p>
              {items.map((item, i) => (
                <div key={i} className="mpai-shopping-item">
                  <div className="mpai-shopping-item__left">
                    <span className="mpai-shopping-item__check">☐</span>
                    <span className="mpai-shopping-item__name">{item.name}</span>
                  </div>
                  <div className="mpai-shopping-item__right">
                    <span className="mpai-shopping-item__amt">{item.amount}</span>
                    <span className="mpai-shopping-item__cost">₱{item.estimated_cost}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── DayView ──────────────────────────────────────────────────────────────── */
function DayView({ dayData, targets }) {
  const totals    = dayData.totals    || {};
  const adherence = dayData.adherence || {};
  const breakdown = dayData.macro_breakdown || {};

  const budgetPct  = Math.min(100, Math.round((totals.cost     / targets.budget)   * 100));
  const calPct     = Math.min(100, Math.round((totals.calories / targets.calories) * 100));
  const proteinPct = Math.min(100, Math.round((totals.protein  / targets.protein)  * 100));
  const carbsPct   = Math.min(100, Math.round((totals.carbs    / targets.carbs)    * 100));

  const stats = [
    { label: "Cost",     value: `₱${totals.cost}`,     sub: `of ₱${targets.budget}`,   pct: budgetPct,  color: budgetPct > 110 ? "#ef4444" : "#d4660a" },
    { label: "Calories", value: `${totals.calories}`,  sub: `kcal of ${targets.calories}`, pct: calPct, color: "#8b5cf6" },
    { label: "Protein",  value: `${totals.protein}g`,  sub: `of ${targets.protein}g`,   pct: proteinPct, color: "#ef4444" },
    { label: "Carbs",    value: `${totals.carbs}g`,    sub: `of ${targets.carbs}g`,     pct: carbsPct,   color: "#f59e0b" },
  ];

  return (
    <div>
      {/* Day summary */}
      <div className="mpai-card mpai-day-summary">
        <div className="mpai-day-stats">
          {stats.map(({ label, value, sub, pct, color }) => (
            <div key={label} className="mpai-day-stat">
              <p className="mpai-day-stat__label">{label}</p>
              <p className="mpai-day-stat__value">{value}</p>
              <p className="mpai-day-stat__sub">{sub}</p>
              <div className="mpai-progress-track">
                <div className="mpai-progress-fill" style={{ width: pct + "%", background: color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Macro breakdown bar */}
        {(breakdown.protein || breakdown.carbs || breakdown.fats) && (
          <div className="mpai-day-breakdown">
            <p className="mpai-day-breakdown__label">Macro split</p>
            <div className="mpai-macro-bar mpai-macro-bar--lg">
              <div className="mpai-macro-bar__fill" style={{ width: breakdown.protein + "%", background: "#ef4444" }} />
              <div className="mpai-macro-bar__fill" style={{ width: breakdown.carbs   + "%", background: "#f59e0b" }} />
              <div className="mpai-macro-bar__fill" style={{ width: breakdown.fats    + "%", background: "#3b82f6" }} />
            </div>
            <div className="mpai-macro-legend">
              <span style={{ color: "#ef4444" }}>● Protein {breakdown.protein}%</span>
              <span style={{ color: "#f59e0b" }}>● Carbs {breakdown.carbs}%</span>
              <span style={{ color: "#3b82f6" }}>● Fats {breakdown.fats}%</span>
            </div>
          </div>
        )}

        {/* Adherence */}
        {adherence.overall !== undefined && (
          <div className="mpai-adherence-row">
            <span className="mpai-adherence-row__label">Plan adherence</span>
            <AdherenceBadge score={adherence.overall} />
            <div className="mpai-adherence-details">
              {[["Cal", adherence.calories], ["Prot", adherence.protein], ["Carbs", adherence.carbs], ["Fats", adherence.fats]].map(([l, v]) => (
                <span key={l} className="mpai-adherence-detail">
                  {l}: <strong>{v}%</strong>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Meals */}
      <div className="mpai-meals-list">
        {dayData.meals?.map((m, i) => <MealCard key={i} meal={m} />)}
      </div>
    </div>
  );
}

/* ── PresetCard ───────────────────────────────────────────────────────────── */
function PresetCard({ preset, selected, onSelect }) {
  const colors = {
    "Weight Loss":  "#16a34a",
    "Muscle Gain":  "#ef4444",
    "Maintenance":  "#8b5cf6",
    "Performance":  "#0ea5e9",
    "Keto":         "#f59e0b",
  };
  const color = colors[preset.fitness_goal] || "#d4660a";

  return (
    <button
      className={`mpai-preset-card ${selected ? "active" : ""}`}
      onClick={() => onSelect(preset.id)}
      style={selected ? { borderColor: color, background: color + "0f" } : {}}
    >
      <p className="mpai-preset-card__name" style={selected ? { color } : {}}>{preset.name}</p>
      <div className="mpai-preset-card__bars">
        {[["P", preset.protein_percent, "#ef4444"], ["C", preset.carbs_percent, "#f59e0b"], ["F", preset.fats_percent, "#3b82f6"]].map(([l, v, c]) => (
          <div key={l} className="mpai-preset-card__bar-row">
            <span style={{ color: c }}>{l}</span>
            <div className="mpai-preset-card__track">
              <div className="mpai-preset-card__fill" style={{ width: v + "%", background: c }} />
            </div>
            <span>{v}%</span>
          </div>
        ))}
      </div>
      <p className="mpai-preset-card__goal">{preset.fitness_goal}</p>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
export default function MealPlanGenerator() {
  const [step,         setStep]         = useState("form");
  const [plan,         setPlan]         = useState(null);
  const [activeDay,    setActiveDay]    = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [mealStats,    setMealStats]    = useState(null);
  const [loadingMeals, setLoadingMeals] = useState(true);
  const [presets,      setPresets]      = useState([]);
  const [loadingPresets, setLoadingPresets] = useState(true);

  const [form, setForm] = useState({
    budget:    300,
    calories:  2000,
    dietary:   "none",
    days:      1,
    preset_id: null,   // null = custom macros
  });

  // Derived macro targets (from selected preset or defaults)
  const [macroTargets, setMacroTargets] = useState({ protein: 150, carbs: 200, fats: 65 });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  /* ── Fetch stats + presets on mount ────────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, presetsRes] = await Promise.all([
          api.get("/meals/stats"),
          api.get("/macro-presets"),
        ]);

        if (statsRes.data.success)   setMealStats(statsRes.data.data);
        if (presetsRes.data.success) setPresets(presetsRes.data.data);
      } catch (err) {
        console.error("Failed to load initial data:", err);
        setError("Could not load meals. Check backend connection.");
      } finally {
        setLoadingMeals(false);
        setLoadingPresets(false);
      }
    };
    load();
  }, []);

  /* ── Recalculate macro targets when preset or calories change ───────────── */
  useEffect(() => {
    if (form.preset_id && presets.length > 0) {
      const preset = presets.find(p => p.id === form.preset_id);
      if (preset) {
        const cal = form.calories;
        setMacroTargets({
          protein: Math.round((cal * preset.protein_percent / 100) / 4),
          carbs:   Math.round((cal * preset.carbs_percent   / 100) / 4),
          fats:    Math.round((cal * preset.fats_percent    / 100) / 9),
        });
      }
    }
  }, [form.preset_id, form.calories, presets]);

  /* ── Generate ─────────────────────────────────────────────────────────── */
  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const body = {
        days:           form.days,
        total_calories: form.calories,
        budget:         form.budget,
        meal_types:     ["breakfast", "lunch", "dinner", "snack"],
        diet_tags:      form.dietary === "none" ? [] : [form.dietary],
      };

      // Use preset if selected, otherwise send nothing (backend defaults to 30/40/30)
      if (form.preset_id) {
        body.preset_id = form.preset_id;
      }

      const res = await api.post("/meal-plan/generate", body);

      if (!res.data.success) {
        throw new Error(res.data.message || "Generation failed");
      }

      setPlan(res.data.data);
      setActiveDay(0);
      setStep("result");
    } catch (err) {
      console.error("Generate error:", err);
      setError(err.response?.data?.message || err.message || "Failed to generate meal plan.");
    } finally {
      setLoading(false);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     FORM VIEW
  ════════════════════════════════════════════════════════════════════════ */
  if (step === "form") {
    return (
      <div className="mpai-app">
        <div className="mpai-header">
          <div className="mpai-header__inner">
            <div className="mpai-header__eyebrow"><span>🤖</span><span>AI Meal Planner</span></div>
            <h1 className="mpai-header__title">Build Your Meal Plan</h1>
            <p className="mpai-header__sub">
              {loadingMeals
                ? "Loading meals from database..."
                : `${mealStats?.total_meals || 0} Filipino meals available`}
            </p>
          </div>
        </div>

        <div className="mpai-form-body">

          {/* DB stats bar */}
          {!loadingMeals && mealStats && (
            <div className="mpai-tips mpai-fade-up">
              <span className="mpai-tips__icon">📊</span>
              <div>
                <p className="mpai-tips__label">Database Status</p>
                <p style={{ color: "#78350f", fontSize: "0.9rem", lineHeight: 1.6 }}>
                  {mealStats.total_meals} meals · {mealStats.by_type.breakfast} breakfast · {mealStats.by_type.lunch} lunch · {mealStats.by_type.dinner} dinner · {mealStats.by_type.snack} snacks
                </p>
              </div>
            </div>
          )}

          {/* ── Macro Preset Selector ─────────────────────────────────────── */}
          <div className="mpai-card mpai-fade-up mpai-fade-up-1">
            <p className="mpai-section-label">Macro Preset</p>
            <p className="mpai-section-sub">Pick a goal — macros are calculated automatically</p>

            {loadingPresets ? (
              <div style={{ padding: "1rem", textAlign: "center", color: "#94a3b8" }}>Loading presets...</div>
            ) : (
              <>
                {/* "Custom" option */}
                <div className="mpai-presets-grid">
                  <button
                    className={`mpai-preset-card ${!form.preset_id ? "active" : ""}`}
                    onClick={() => set("preset_id", null)}
                    style={!form.preset_id ? { borderColor: "#d4660a", background: "#d4660a0f" } : {}}
                  >
                    <p className="mpai-preset-card__name" style={!form.preset_id ? { color: "#d4660a" } : {}}>Custom</p>
                    <p className="mpai-preset-card__goal">Set your own macros below</p>
                  </button>

                  {presets.map(p => (
                    <PresetCard
                      key={p.id}
                      preset={p}
                      selected={form.preset_id === p.id}
                      onSelect={id => set("preset_id", id)}
                    />
                  ))}
                </div>

                {/* Show calculated macros if preset selected */}
                {form.preset_id && (
                  <div className="mpai-preset-preview">
                    <p className="mpai-preset-preview__label">For {form.calories} kcal, your targets will be:</p>
                    <div className="mpai-preset-preview__pills">
                      <span style={{ color: "#ef4444" }}>Protein: <strong>{macroTargets.protein}g</strong></span>
                      <span style={{ color: "#f59e0b" }}>Carbs: <strong>{macroTargets.carbs}g</strong></span>
                      <span style={{ color: "#3b82f6" }}>Fats: <strong>{macroTargets.fats}g</strong></span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Budget ────────────────────────────────────────────────────── */}
          <div className="mpai-card mpai-budget-card mpai-fade-up mpai-fade-up-2">
            <div className="mpai-budget-card__top">
              <div>
                <p className="mpai-section-label" style={{ marginBottom: 6 }}>Daily Food Budget</p>
                <p className="mpai-budget-card__amount">₱{form.budget}</p>
              </div>
              <div className="mpai-budget-card__quick">
                <p className="mpai-budget-card__quick-label">Quick select</p>
                <div className="mpai-budget-card__quick-btns">
                  {[150, 250, 350, 500].map(v => (
                    <button key={v}
                      className={`mpai-quick-btn mpai-quick-btn--orange ${form.budget === v ? "active" : ""}`}
                      onClick={() => set("budget", v)}>
                      ₱{v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <input type="range" min={50} max={1000} step={25} value={form.budget}
              onChange={e => set("budget", +e.target.value)} />
            <div className="mpai-range-hints">
              <span className="mpai-range-hint">₱50 — tight</span>
              <span className="mpai-range-hint">₱1,000 — generous</span>
            </div>
          </div>

          {/* ── Calories ──────────────────────────────────────────────────── */}
          <div className="mpai-card mpai-cal-card mpai-fade-up mpai-fade-up-2">
            <p className="mpai-section-label">Daily Calories</p>
            <div className="mpai-cal-range-wrap">
              <div className="mpai-cal-row">
                <span className="mpai-cal-row__label">Target</span>
                <div className="mpai-cal-row__controls">
                  {[1500, 2000, 2500, 3000].map(v => (
                    <button key={v}
                      className={`mpai-quick-btn ${form.calories === v ? "active" : ""}`}
                      onClick={() => set("calories", v)}>
                      {v}
                    </button>
                  ))}
                  <div className="mpai-cal-input-box">
                    <input type="number" value={form.calories}
                      onChange={e => set("calories", +e.target.value)} />
                    <span>kcal</span>
                  </div>
                </div>
              </div>
              <input type="range" min={800} max={5000} step={50} value={form.calories}
                onChange={e => set("calories", +e.target.value)}
                style={{ accentColor: "#8b5cf6" }} />
            </div>

            {/* Custom macro sliders — only show when no preset selected */}
            {!form.preset_id && (
              <div className="mpai-macros-grid" style={{ marginTop: "1rem" }}>
                {[
                  { label: "Protein", key: "protein", color: "#ef4444", max: 400 },
                  { label: "Carbs",   key: "carbs",   color: "#f59e0b", max: 600 },
                  { label: "Fats",    key: "fats",    color: "#3b82f6", max: 200 },
                ].map(({ label, key, color, max }) => (
                  <div key={key} className="mpai-macro-box">
                    <p className="mpai-macro-box__label">{label}</p>
                    <div className="mpai-macro-box__value-row">
                      <input type="number" value={macroTargets[key]}
                        onChange={e => setMacroTargets(t => ({ ...t, [key]: +e.target.value }))}
                        style={{ color }} />
                      <span className="mpai-macro-box__unit">g</span>
                    </div>
                    <input type="range" min={0} max={max} step={5} value={macroTargets[key]}
                      onChange={e => setMacroTargets(t => ({ ...t, [key]: +e.target.value }))}
                      style={{ accentColor: color }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Dietary ───────────────────────────────────────────────────── */}
          <div className="mpai-card mpai-dietary-card mpai-fade-up mpai-fade-up-3">
            <p className="mpai-section-label">Dietary Restrictions</p>
            <div className="mpai-dietary-chips">
              {DIETARY.map(d => (
                <button key={d.id}
                  className={`mpai-dietary-chip ${form.dietary === d.id ? "active" : ""}`}
                  onClick={() => set("dietary", d.id)}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Days ──────────────────────────────────────────────────────── */}
          <div className="mpai-card mpai-days-card mpai-fade-up mpai-fade-up-4">
            <p className="mpai-section-label">Plan Duration</p>
            <div className="mpai-days-row">
              {[1, 3, 5, 7].map(d => (
                <button key={d}
                  className={`mpai-day-btn ${form.days === d ? "active" : ""}`}
                  onClick={() => set("days", d)}>
                  {d} {d === 1 ? "Day" : "Days"}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mpai-error-box">
              <p className="mpai-error-title">⚠️ Error</p>
              <p className="mpai-error-text">{error}</p>
            </div>
          )}

          {/* CTA */}
          <div className="mpai-cta-block mpai-fade-up mpai-fade-up-5">
            <button className="mpai-btn-orange mpai-btn-orange--full"
              onClick={handleGenerate}
              disabled={loading || loadingMeals}>
              {loading
                ? <><span className="mpai-spinner" /> Generating Meal Plan...</>
                : <>✨ Generate My {form.days === 1 ? "1-Day" : `${form.days}-Day`} Meal Plan</>}
            </button>
            <p className="mpai-cta-block__note">
              {form.preset_id
                ? `Using ${presets.find(p => p.id === form.preset_id)?.name} preset`
                : "Using custom macros"} · {mealStats?.total_meals || 0} meals available
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════════════
     RESULT VIEW
  ════════════════════════════════════════════════════════════════════════ */
  if (step === "result" && plan) {
    const days         = plan.days || [];
    const summary      = plan.summary || {};
    const shoppingList = plan.shopping_list;

    // Targets to show in DayView progress bars
    const targets = {
      budget:   form.budget,
      calories: form.calories,
      protein:  macroTargets.protein,
      carbs:    macroTargets.carbs,
      fats:     macroTargets.fats,
    };

    return (
      <div className="mpai-app">
        {/* Sticky header */}
        <div className="mpai-header mpai-header--sticky">
          <div className="mpai-header__inner">
            <div>
              <div className="mpai-header__eyebrow"><span>🤖</span><span>Your Meal Plan</span></div>
              <h1 className="mpai-header__title" style={{ fontSize: 20 }}>
                {days.length}-Day · ₱{form.budget}/day · {form.calories} kcal
                {summary.macro_targets && (
                  <span className="mpai-header__preset">
                    {" · "}{form.preset_id ? presets.find(p => p.id === form.preset_id)?.name : "Custom"}
                  </span>
                )}
              </h1>
            </div>
            <div className="mpai-header__actions">
              <button className="mpai-btn-ghost" onClick={() => setStep("form")}>← Edit</button>
              <button className="mpai-btn-orange mpai-btn-orange--sm"
                onClick={handleGenerate} disabled={loading}>
                {loading ? "..." : "🔄 Regenerate"}
              </button>
            </div>
          </div>
        </div>

        <div className="mpai-result-body">
          {/* Tips */}
          <div className="mpai-tips mpai-fade-up">
            <span className="mpai-tips__icon">💡</span>
            <div>
              <p className="mpai-tips__label">Tips for your plan</p>
              <ul className="mpai-tips__list">
                <li>Prep ingredients the night before to save time</li>
                <li>Buy ingredients in bulk at the wet market for better prices</li>
                <li>Store leftovers properly to reduce food waste</li>
              </ul>
            </div>
          </div>

          {/* Shopping list — show once across all days */}
          <ShoppingList data={shoppingList} />

          {/* Day tabs */}
          {days.length > 1 && (
            <div className="mpai-day-tabs">
              {days.map((d, i) => (
                <button key={i}
                  className={`mpai-day-tab ${activeDay === i ? "active" : ""}`}
                  onClick={() => setActiveDay(i)}>
                  Day {d.day}
                </button>
              ))}
            </div>
          )}

          {/* Active day */}
          {days[activeDay] && (
            <DayView key={activeDay} dayData={days[activeDay]} targets={targets} />
          )}
        </div>
      </div>
    );
  }

  return null;
}