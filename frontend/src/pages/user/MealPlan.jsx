    import { useState, useEffect } from "react";
    import "./MealPlan.css";
    import { generateSingleMeal } from "../../utils/mealGenerator";
    import { api } from "../../utils/api";

    const DIETARY = [
    { id: "none", label: "No Restrictions" },
    { id: "halal", label: "Halal" },
    { id: "vegetarian", label: "Vegetarian" },
    { id: "vegan", label: "Vegan" },
    { id: "pescatarian", label: "Pescatarian" },
    { id: "low-carb", label: "Low Carb" },
    { id: "gluten-free", label: "Gluten Free" },
    ];

    const GOALS = [
    { id: "lose", label: "Lose Weight", hint: "Caloric deficit" },
    { id: "maintain", label: "Maintain", hint: "Balanced intake" },
    { id: "gain", label: "Build Muscle", hint: "High protein" },
    { id: "performance", label: "Performance", hint: "Energy optimized" },
    ];

    const MEAL_ICONS = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };
    const MEAL_THEMES = {
    breakfast: { bg: "#fff7ed", accent: "#d4660a", border: "#fed7aa" },
    lunch: { bg: "#fefce8", accent: "#92400e", border: "#fde68a" },
    dinner: { bg: "#f0fdf4", accent: "#166534", border: "#bbf7d0" },
    snack: { bg: "#eff6ff", accent: "#1d4ed8", border: "#bfdbfe" },
    };

    function MealCard({ meal }) {
    const [open, setOpen] = useState(false);
    const theme = MEAL_THEMES[meal.meal_type] || MEAL_THEMES.breakfast;
    const icon = MEAL_ICONS[meal.meal_type] || "🍴";

    return (
        <div className="mpai-card mpai-meal-card">
        <button className="mpai-meal-card__btn" onClick={() => setOpen((o) => !o)}>
            <div className="mpai-meal-card__icon" style={{ background: theme.bg }}>
            {icon}
            </div>

            <div className="mpai-meal-card__info">
            <div className="mpai-meal-card__type-row">
                <span
                className="mpai-meal-card__type-badge"
                style={{ color: theme.accent, background: theme.bg, borderColor: theme.border }}
                >
                {meal.meal_type}
                </span>
            </div>
            <p className="mpai-meal-card__name">{meal.name}</p>
            <p className="mpai-meal-card__desc">{meal.description || "Filipino meal"}</p>
            </div>

            <div className="mpai-meal-card__right">
            <p className="mpai-meal-card__cost">₱{meal.estimated_cost}</p>
            <p className="mpai-meal-card__kcal">{meal.calories} kcal</p>
            <p className="mpai-meal-card__chevron">{open ? "▲" : "▼"}</p>
            </div>
        </button>

        <div className="mpai-meal-card__pills">
            {[
            ["P", meal.protein, "#ef4444"],
            ["C", meal.carbs, "#f59e0b"],
            ["F", meal.fats, "#3b82f6"],
            ].map(([l, v, c]) => (
            <span
                key={l}
                className="mpai-pill"
                style={{ background: c + "18", color: c, border: `1px solid ${c}35` }}
            >
                {l}: {v}g
            </span>
            ))}
        </div>

        {open && meal.diet_tags && meal.diet_tags.length > 0 && (
            <div className="mpai-meal-card__detail">
            <p className="mpai-ingredients-label">Dietary Tags</p>
            <div className="mpai-dietary-chips" style={{ padding: '0 1.5rem 1rem' }}>
                {meal.diet_tags.map((tag, i) => (
                <span key={i} className="mpai-dietary-chip" style={{ fontSize: '0.75rem' }}>
                    {tag}
                </span>
                ))}
            </div>
            </div>
        )}
        </div>
    );
    }

    function DayView({ dayData, targets }) {
    const budgetPct = Math.min(100, Math.round((dayData.totalCost / targets.budget) * 100));
    const calPct = Math.min(100, Math.round((dayData.totalCalories / targets.calories) * 100));
    const proteinPct = Math.min(100, Math.round((dayData.totalProtein / targets.protein) * 100));
    const carbsPct = Math.min(100, Math.round((dayData.totalCarbs / targets.carbs) * 100));

    const stats = [
        {
        label: "Cost",
        value: `₱${dayData.totalCost}`,
        sub: `of ₱${targets.budget}`,
        pct: budgetPct,
        color: budgetPct > 110 ? "#ef4444" : "#d4660a",
        },
        {
        label: "Calories",
        value: `${dayData.totalCalories}`,
        sub: `kcal of ${targets.calories}`,
        pct: calPct,
        color: "#8b5cf6",
        },
        {
        label: "Protein",
        value: `${dayData.totalProtein}g`,
        sub: `of ${targets.protein}g`,
        pct: proteinPct,
        color: "#ef4444",
        },
        {
        label: "Carbs",
        value: `${dayData.totalCarbs}g`,
        sub: `of ${targets.carbs}g`,
        pct: carbsPct,
        color: "#f59e0b",
        },
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
        </div>

        {/* Meals */}
        <div className="mpai-meals-list">
            {dayData.meals?.map((m, i) => <MealCard key={i} meal={m} />)}
        </div>
        </div>
    );
    }

    export default function MealPlanGenerator() {
    const [step, setStep] = useState("form");
    const [plan, setPlan] = useState(null);
    const [activeDay, setActiveDay] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [meals, setMeals] = useState([]);
    const [mealStats, setMealStats] = useState(null);
    const [loadingMeals, setLoadingMeals] = useState(true);

    const [form, setForm] = useState({
        budget: 300,
        calories: 2000,
        protein: 150,
        carbs: 200,
        fats: 65,
        dietary: "none",
        goal: "maintain",
        days: 1,
    });

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    useEffect(() => {
    const fetchMeals = async () => {
        try {
        setLoadingMeals(true);

        // Fetch meals and stats from backend
        const [mealsRes, statsRes] = await Promise.all([
            api.get("/meals"),
            api.get("/meals/stats")
        ]);

        // Handle meals
        if (mealsRes.data.success) {
                console.log(`✅ Loaded ${mealsRes.data.count} meals from database`);
                
                // Parse string numbers from DB to actual numbers
                const parsed = mealsRes.data.data.map(meal => ({
                    ...meal,
                    protein:        parseFloat(meal.protein)        || 0,
                    carbs:          parseFloat(meal.carbs)          || 0,
                    fats:           parseFloat(meal.fats)           || 0,
                    estimated_cost: parseFloat(meal.estimated_cost) || 0,
                }));

                setMeals(parsed);
    }

        // Handle stats
        if (statsRes.data.success) {
            setMealStats(statsRes.data.data);
            console.log("📊 Meal stats:", statsRes.data.data);
        }
        } catch (err) {
        console.error("Failed to fetch meals:", err);
        setError("Could not load meals. Check backend connection.");
        } finally {
        setLoadingMeals(false);
        }
    };

    fetchMeals();
    }, []);

    // Get dietary tags for filtering
    const getDietTags = () => {
        if (form.dietary === "none") return [];
        return [form.dietary];
    };

    // Generate meal plan using database meals
    async function handleGenerate() {
        setLoading(true);
        setError(null);

        try {
        if (meals.length === 0) {
            throw new Error("No meals available. Please check database connection.");
        }

        const days = [];
        const dietTags = getDietTags();

        // Generate meals for each day
        for (let dayNum = 1; dayNum <= form.days; dayNum++) {
            const dayMeals = [];
            let totalCost = 0;
            let totalCalories = 0;
            let totalProtein = 0;
            let totalCarbs = 0;
            let totalFats = 0;

            // Meal type configurations
        const mealConfigs = [
                { type: "breakfast", calPct: 0.35, budgetPct: 0.25 },
                { type: "lunch", calPct: 0.35, budgetPct: 0.35 },
                { type: "dinner", calPct: 0.25, budgetPct: 0.30 },
                { type: "snack", calPct: 0.05, budgetPct: 0.10 }
                ];

            // Generate each meal type
            for (const config of mealConfigs) {
            const meal = generateSingleMeal(meals, {
                mealType: config.type,
                calories: form.calories * config.calPct,
                budget: form.budget * config.budgetPct,
                dietTags,
                goal: form.goal === "gain" ? "high_protein" : null
            });

            if (meal) {
                dayMeals.push(meal);
                totalCost += meal.estimated_cost;
                totalCalories += meal.calories;
                totalProtein += meal.protein;
                totalCarbs += meal.carbs;
                totalFats += meal.fats;
            } else {
                console.warn(`No ${config.type} found for day ${dayNum}`);
            }
            }

            if (dayMeals.length === 0) {
            throw new Error("Could not generate any meals. Try adjusting your constraints.");
            }

            days.push({
            day: dayNum,
            totalCost: Math.round(totalCost),
            totalCalories: Math.round(totalCalories),
            totalProtein: Math.round(totalProtein),
            totalCarbs: Math.round(totalCarbs),
            totalFats: Math.round(totalFats),
            meals: dayMeals
            });
        }

        const planData = {
            summary: {
            totalDays: form.days,
            tips: [
                "Prep ingredients the night before to save time",
                "Buy ingredients in bulk at the wet market for better prices",
                "Store leftovers properly to reduce food waste"
            ]
            },
            days
        };

        setPlan(planData);
        setActiveDay(0);
        setStep("result");
        
        console.log("✅ Meal plan generated successfully:", planData);
        } catch (err) {
        console.error("Error generating meal plan:", err);
        setError(err.message || "Failed to generate meal plan. Please try again.");
        } finally {
        setLoading(false);
        }
    }

    /* ── FORM VIEW ── */
    if (step === "form") {
        return (
        <div className="mpai-app">
            <div className="mpai-header">
            <div className="mpai-header__inner">
                <div className="mpai-header__eyebrow">
                <span>🤖</span>
                <span>Database-Powered Meal Planner</span>
                </div>
                <h1 className="mpai-header__title">Build Your Meal Plan</h1>
                <p className="mpai-header__sub">
                {loadingMeals ? (
                    "Loading meals from database..."
                ) : (
                    `${meals.length} Filipino meals available from database`
                )}
                </p>
            </div>
            </div>

            <div className="mpai-form-body">
            {/* Loading state */}
            {loadingMeals && (
                <div className="mpai-card" style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="mpai-spinner" style={{ margin: '0 auto 1rem' }}></div>
                <p style={{ color: '#64748b' }}>Loading meals from database...</p>
                </div>
            )}

            {/* Database stats */}
            {!loadingMeals && mealStats && (
                <div className="mpai-tips mpai-fade-up">
                <span className="mpai-tips__icon">📊</span>
                <div>
                    <p className="mpai-tips__label">Database Status</p>
                    <p style={{ color: '#78350f', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    {mealStats.total_meals} meals loaded • {mealStats.by_type.breakfast} breakfast • {mealStats.by_type.lunch} lunch • {mealStats.by_type.dinner} dinner • {mealStats.by_type.snack} snacks
                    </p>
                </div>
                </div>
            )}

            {/* Budget Card */}
            <div className="mpai-card mpai-budget-card mpai-fade-up mpai-fade-up-1">
                <div className="mpai-budget-card__top">
                <div>
                    <p className="mpai-section-label" style={{ marginBottom: 6 }}>
                    Daily Food Budget
                    </p>
                    <p className="mpai-budget-card__amount">₱{form.budget}</p>
                </div>
                <div className="mpai-budget-card__quick">
                    <p className="mpai-budget-card__quick-label">Quick select</p>
                    <div className="mpai-budget-card__quick-btns">
                    {[150, 250, 350, 500].map((v) => (
                        <button
                        key={v}
                        className={`mpai-quick-btn mpai-quick-btn--orange ${
                            form.budget === v ? "active" : ""
                        }`}
                        onClick={() => set("budget", v)}
                        >
                        ₱{v}
                        </button>
                    ))}
                    </div>
                </div>
                </div>
                <input
                type="range"
                min={50}
                max={1000}
                step={25}
                value={form.budget}
                onChange={(e) => set("budget", +e.target.value)}
                />
                <div className="mpai-range-hints">
                <span className="mpai-range-hint">₱50 — tight</span>
                <span className="mpai-range-hint">₱1,000 — generous</span>
                </div>
            </div>

            {/* Calories + Macros */}
            <div className="mpai-card mpai-cal-card mpai-fade-up mpai-fade-up-2">
                <p className="mpai-section-label">Calorie &amp; Macro Targets</p>

                <div className="mpai-cal-range-wrap">
                <div className="mpai-cal-row">
                    <span className="mpai-cal-row__label">Daily Calories</span>
                    <div className="mpai-cal-row__controls">
                    {[1500, 2000, 2500, 3000].map((v) => (
                        <button
                        key={v}
                        className={`mpai-quick-btn ${form.calories === v ? "active" : ""}`}
                        onClick={() => set("calories", v)}
                        >
                        {v}
                        </button>
                    ))}
                    <div className="mpai-cal-input-box">
                        <input
                        type="number"
                        value={form.calories}
                        onChange={(e) => set("calories", +e.target.value)}
                        />
                        <span>kcal</span>
                    </div>
                    </div>
                </div>
                <input
                    type="range"
                    min={800}
                    max={5000}
                    step={50}
                    value={form.calories}
                    onChange={(e) => set("calories", +e.target.value)}
                    style={{ accentColor: "#8b5cf6" }}
                />
                </div>

                <div className="mpai-macros-grid">
                {[
                    { label: "Protein", key: "protein", color: "#ef4444", max: 400 },
                    { label: "Carbs", key: "carbs", color: "#f59e0b", max: 600 },
                    { label: "Fats", key: "fats", color: "#3b82f6", max: 200 },
                ].map(({ label, key, color, max }) => (
                    <div key={key} className="mpai-macro-box">
                    <p className="mpai-macro-box__label">{label}</p>
                    <div className="mpai-macro-box__value-row">
                        <input
                        type="number"
                        value={form[key]}
                        onChange={(e) => set(key, +e.target.value)}
                        style={{ color }}
                        />
                        <span className="mpai-macro-box__unit">g</span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={max}
                        step={5}
                        value={form[key]}
                        onChange={(e) => set(key, +e.target.value)}
                        style={{ accentColor: color }}
                    />
                    </div>
                ))}
                </div>
            </div>

            {/* Goal */}
            <div className="mpai-card mpai-goal-card mpai-fade-up mpai-fade-up-3">
                <p className="mpai-section-label">Fitness Goal</p>
                <div className="mpai-goals-grid">
                {GOALS.map((g) => (
                    <button
                    key={g.id}
                    className={`mpai-goal-btn ${form.goal === g.id ? "active" : ""}`}
                    onClick={() => set("goal", g.id)}
                    >
                    <p className="mpai-goal-btn__label">{g.label}</p>
                    <p className="mpai-goal-btn__hint">{g.hint}</p>
                    </button>
                ))}
                </div>
            </div>

            {/* Dietary */}
            <div className="mpai-card mpai-dietary-card mpai-fade-up mpai-fade-up-4">
                <p className="mpai-section-label">Dietary Restrictions</p>
                <div className="mpai-dietary-chips">
                {DIETARY.map((d) => (
                    <button
                    key={d.id}
                    className={`mpai-dietary-chip ${form.dietary === d.id ? "active" : ""}`}
                    onClick={() => set("dietary", d.id)}
                    >
                    {d.label}
                    </button>
                ))}
                </div>
            </div>

            {/* Days */}
            <div className="mpai-card mpai-days-card mpai-fade-up mpai-fade-up-5">
                <p className="mpai-section-label">Plan Duration</p>
                <div className="mpai-days-row">
                {[1, 3, 5, 7].map((d) => (
                    <button
                    key={d}
                    className={`mpai-day-btn ${form.days === d ? "active" : ""}`}
                    onClick={() => set("days", d)}
                    >
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
            <div className="mpai-cta-block mpai-fade-up mpai-fade-up-6">
                <button
                className="mpai-btn-orange mpai-btn-orange--full"
                onClick={handleGenerate}
                disabled={loading || loadingMeals || meals.length === 0}
                >
                {loading ? (
                    <>
                    <span className="mpai-spinner"></span> Generating Meal Plan...
                    </>
                ) : (
                    <>✨ Generate My {form.days === 1 ? "1-Day" : `${form.days}-Day`} Meal Plan</>
                )}
                </button>

                <p className="mpai-cta-block__note">
                📊 Using {meals.length} Filipino meals from database
                </p>
            </div>
            </div>
        </div>
        );
    }

    /* ── RESULT VIEW ── */
    if (step === "result" && plan) {
        const dayCount = plan.days?.length || 0;
        return (
        <div className="mpai-app">
            <div className="mpai-header mpai-header--sticky">
            <div className="mpai-header__inner">
                <div>
                <div className="mpai-header__eyebrow">
                    <span>🤖</span>
                    <span>Your Meal Plan</span>
                </div>
                <h1 className="mpai-header__title" style={{ fontSize: 20 }}>
                    {dayCount}-Day • ₱{form.budget}/day • {form.calories} kcal
                </h1>
                </div>
                <div className="mpai-header__actions">
                <button className="mpai-btn-ghost" onClick={() => setStep("form")}>
                    ← Edit
                </button>
                <button
                    className="mpai-btn-orange mpai-btn-orange--sm"
                    onClick={handleGenerate}
                    disabled={loading}
                >
                    {loading ? "..." : "🔄 Regenerate"}
                </button>
                </div>
            </div>
            </div>

            <div className="mpai-result-body">
            {/* Tips */}
            {plan.summary?.tips && (
                <div className="mpai-tips mpai-fade-up">
                <span className="mpai-tips__icon">💡</span>
                <div>
                    <p className="mpai-tips__label">Tips for your plan</p>
                    <ul className="mpai-tips__list">
                    {plan.summary.tips.map((t, i) => (
                        <li key={i}>{t}</li>
                    ))}
                    </ul>
                </div>
                </div>
            )}

            {/* Day tabs */}
            {dayCount > 1 && (
                <div className="mpai-day-tabs">
                {plan.days.map((d, i) => (
                    <button
                    key={i}
                    className={`mpai-day-tab ${activeDay === i ? "active" : ""}`}
                    onClick={() => setActiveDay(i)}
                    >
                    Day {d.day}
                    </button>
                ))}
                </div>
            )}

            {/* Active day */}
            {plan.days[activeDay] && (
                <DayView
                key={activeDay}
                dayData={plan.days[activeDay]}
                targets={{
                    budget: form.budget,
                    calories: form.calories,
                    protein: form.protein,
                    carbs: form.carbs,
                    fats: form.fats,
                }}
                />
            )}
            </div>
        </div>
        );
    }

    return null;
    }