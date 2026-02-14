# app/train_global_weights.py

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
# CONFIG (edit these)
# -----------------------------
DB_HOST = "127.0.0.1"
DB_PORT = "5433"          # change if your postgres is 5432
DB_NAME = "exersearch"
DB_USER = "postgres"
DB_PASS = "YOUR_PASSWORD"

MIN_ROWS = 100            # minimum total usable events (after dropna)
MIN_POS  = 15             # minimum positive events

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

# Smoothing to prevent weights from jumping around
SMOOTHING_ALPHA = 0.35    # 0.0=no update, 1.0=overwrite fully


# -----------------------------
# HELPERS
# -----------------------------
def normalize_weights(raw: dict) -> dict:
    """Clamp negatives to 0, normalize sum to 1."""
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
            # ensure expected keys exist
            keys = ["equipment", "amenity", "travel", "price", "penalty"]
            if all(k in w for k in keys):
                return {k: float(w[k]) for k in keys}
    except Exception:
        return None
    return None


def smooth_weights(old_w: dict, new_w: dict, alpha: float) -> dict:
    """Exponential smoothing: final = (1-alpha)*old + alpha*new."""
    keys = ["equipment", "amenity", "travel", "price", "penalty"]
    mixed = {k: (1 - alpha) * float(old_w[k]) + alpha * float(new_w[k]) for k in keys}
    return normalize_weights(mixed)


def main():
    db_url = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    engine = create_engine(db_url)

    # NOTE: You MUST log these meta fields for BOTH view and click events
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

    df = pd.read_sql(query, engine)
    if df.empty:
        print("No rows found. Exiting.")
        return

    # Keep only known events
    df = df[df["event"].isin(ALL_EVENTS)].copy()

    # Label: 1 if positive event, else 0
    df["y"] = df["event"].isin(POS_EVENTS).astype(int)

    total_raw = len(df)
    pos_raw = int(df["y"].sum())

    print(f"Total rows (raw): {total_raw}")
    print(f"Positive rows (raw): {pos_raw}")

    # Drop rows missing any required features
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

    # Prepare X, y
    X = df2[FEATURE_COLS].astype(float).to_numpy()
    y = df2["y"].to_numpy()

    # Train model (scaled)
    model = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(max_iter=4000, class_weight="balanced"))
    ])
    model.fit(X, y)

    coefs = np.abs(model.named_steps["clf"].coef_[0])

    # Map coefficients -> TOPSIS weights
    raw_weights = {
        "equipment": float(coefs[0]),
        "amenity": float(coefs[1]),
        "travel": float(coefs[2]),
        "price": float(coefs[3]),
        "penalty": float(coefs[4]),
    }
    new_weights = normalize_weights(raw_weights)

    # Optional smoothing using previous saved weights
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

    print("Saved:", OUT_PATH)
    print("Final weights:", final_weights)


if __name__ == "__main__":
    main()
