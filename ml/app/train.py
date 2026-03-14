import os
import json
import numpy as np
import pandas as pd
from datetime import datetime, timezone

from sqlalchemy import create_engine
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

# -----------------------------
# RAILWAY POSTGRES CONFIG
# -----------------------------
DATABASE_URL = (
    "postgresql+psycopg2://postgres:"
    "zjEOXdMwBfskrpJtJQRKhEsxpnLAEmEv"
    "@shortline.proxy.rlwy.net:31146/railway?sslmode=require"
)

MIN_ROWS = 25
MIN_POS = 15

OUT_PATH = os.path.join("app", "storage", "weights_global.json")

POS_EVENTS = {"click", "save", "contact", "subscribe"}
ALL_EVENTS = {"view", "click", "save", "contact", "subscribe"}

FEATURE_COLS = [
    "equipment_match",
    "amenity_match",
    "travel_time_min",
    "price",
    "budget_penalty",
]

SMOOTHING_ALPHA = 0.35


# -----------------------------
# HELPERS
# -----------------------------
def normalize_weights(raw: dict) -> dict:
    out = {k: float(max(0.0, raw.get(k, 0.0))) for k in raw.keys()}
    s = sum(out.values())
    if s <= 0:
        return out
    return {k: v / s for k, v in out.items()}


def load_previous_weights(path: str) -> dict | None:
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        w = data.get("weights")
        if isinstance(w, dict) and len(w) > 0:
            keys = ["equipment", "amenity", "travel", "price", "penalty"]
            if all(k in w for k in keys):
                return {k: float(w[k]) for k in keys}
    except Exception:
        return None
    return None


def smooth_weights(old_w: dict, new_w: dict, alpha: float) -> dict:
    keys = ["equipment", "amenity", "travel", "price", "penalty"]
    mixed = {k: (1 - alpha) * float(old_w[k]) + alpha * float(new_w[k]) for k in keys}
    return normalize_weights(mixed)


def main():
    engine = create_engine(DATABASE_URL)

    query = """
    SELECT
        user_id,
        gym_id,
        event,
        created_at,
        (meta->>'equipment_match')::float  AS equipment_match,
        (meta->>'amenity_match')::float    AS amenity_match,
        (meta->>'travel_time_min')::float  AS travel_time_min,
        (meta->>'price')::float            AS price,
        (meta->>'budget_penalty')::float   AS budget_penalty
    FROM gym_interactions
    WHERE event IN ('view','click','save','contact','subscribe')
    ORDER BY created_at ASC
    """

    try:
        df = pd.read_sql(query, engine)
    except Exception as e:
        print("Database connection/query failed:")
        print(str(e))
        return

    if df.empty:
        print("No rows found. Exiting.")
        return

    df = df[df["event"].isin(ALL_EVENTS)].copy()
    df["y"] = df["event"].isin(POS_EVENTS).astype(int)

    total_raw = len(df)
    pos_raw = int(df["y"].sum())

    print(f"Total rows (raw): {total_raw}")
    print(f"Positive rows (raw): {pos_raw}")

    df2 = df.dropna(subset=FEATURE_COLS).copy()

    total = len(df2)
    pos = int(df2["y"].sum())

    print(f"Total rows (usable after dropna): {total}")
    print(f"Positive rows (usable after dropna): {pos}")

    if total < MIN_ROWS or pos < MIN_POS:
        print(
            "Not enough usable data to train yet.\n"
            f"Need >= {MIN_ROWS} usable rows and >= {MIN_POS} usable positives.\n"
            "Exiting without saving."
        )
        return

    X = df2[FEATURE_COLS].astype(float).to_numpy()
    y = df2["y"].to_numpy()

    model = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(max_iter=4000, class_weight="balanced"))
    ])
    model.fit(X, y)

    coefs = np.abs(model.named_steps["clf"].coef_[0])

    raw_weights = {
        "equipment": float(coefs[0]),
        "amenity": float(coefs[1]),
        "travel": float(coefs[2]),
        "price": float(coefs[3]),
        "penalty": float(coefs[4]),
    }
    new_weights = normalize_weights(raw_weights)

    prev = load_previous_weights(OUT_PATH)
    final_weights = (
        smooth_weights(prev, new_weights, SMOOTHING_ALPHA)
        if prev is not None else new_weights
    )

    payload = {
        "weights": final_weights,
        "weights_unsmoothed": new_weights,
        "trained_on_rows_raw": int(total_raw),
        "trained_on_rows_usable": int(total),
        "positive_rows_raw": int(pos_raw),
        "positive_rows_usable": int(pos),
        "feature_cols": FEATURE_COLS,
        "model": "logreg_standardscaled_abscoef_to_topsis_weights",
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
        "smoothing_alpha": SMOOTHING_ALPHA if prev is not None else 0.0,
    }

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    print("\n==============================")
    print("TRAINING SUMMARY")
    print("==============================")
    print(f"Raw rows: {total_raw}")
    print(f"Usable rows: {total}")
    print(f"Raw positives: {pos_raw}")
    print(f"Usable positives: {pos}")
    print("\nLearned weights:")
    for k, v in final_weights.items():
        print(f"{k:10}: {v:.4f}")
    print(f"\nSaved: {OUT_PATH}")
    print("==============================")


if __name__ == "__main__":
    main()