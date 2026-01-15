import os
import json
import pandas as pd
from sqlalchemy import create_engine
from sklearn.linear_model import LogisticRegression
import numpy as np

# -----------------------------
# CONFIG
# -----------------------------
# Change these for your setup:
DB_HOST = "127.0.0.1"
DB_PORT = "5433"          # change if your postgres is 5432
DB_NAME = "exersearch"    # change if different
DB_USER = "postgres"      # change if different
DB_PASS = "YOUR_PASSWORD" # change

MIN_ROWS = 100            # minimum total events
MIN_POS  = 15             # minimum positive events (click/save/contact/subscribe)

OUT_PATH = os.path.join("app", "storage", "weights_global.json")

POS_EVENTS = {"click", "save", "contact", "subscribe"}  # positives
NEG_EVENTS = {"view"}                                  # negatives

# -----------------------------
# HELPERS
# -----------------------------
def normalize_weights(raw: dict) -> dict:
    # remove negatives, normalize to sum=1
    for k in raw:
        raw[k] = float(max(0.0, raw[k]))
    s = sum(raw.values())
    if s <= 0:
        return raw
    return {k: v / s for k, v in raw.items()}

def main():
    db_url = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    engine = create_engine(db_url)

    # We rely on meta containing features at time of view/click.
    # If your meta currently only logs topsis_score, add more meta fields in React later.
    query = """
    SELECT
        user_id,
        gym_id,
        event,
        created_at,
        (meta->>'equipment_match')::float      AS equipment_match,
        (meta->>'amenity_match')::float        AS amenity_match,
        (meta->>'travel_time_min')::float      AS travel_time_min,
        (meta->>'price')::float                AS price,
        (meta->>'budget_penalty')::float       AS budget_penalty
    FROM gym_interactions
    WHERE event IN ('view','click','save','contact','subscribe')
    ORDER BY created_at ASC
    """

    df = pd.read_sql(query, engine)

    # Basic checks
    total = len(df)
    pos = int(df["event"].isin(POS_EVENTS).sum())

    print(f"Total rows: {total}")
    print(f"Positive rows: {pos}")

    if total < MIN_ROWS or pos < MIN_POS:
        print("Not enough data to train yet. Exiting without saving.")
        return

    # Drop rows missing features
    feature_cols = ["equipment_match", "amenity_match", "travel_time_min", "price", "budget_penalty"]
    df = df.dropna(subset=feature_cols)

    if len(df) < MIN_ROWS:
        print("Too many rows missing meta features. Log more meta fields first.")
        return

    # Build training set
    X = df[feature_cols].astype(float).to_numpy()

    # Make lower travel/price "better" by negating them (so higher = better)
    X[:, 2] = -X[:, 2]  # travel_time_min
    X[:, 3] = -X[:, 3]  # price

    y = df["event"].isin(POS_EVENTS).astype(int).to_numpy()

    # Train a simple model
    model = LogisticRegression(max_iter=2000, class_weight="balanced")
    model.fit(X, y)

    # Convert coefficients -> TOPSIS weights (absolute importance)
    coefs = np.abs(model.coef_[0])

    raw_weights = {
        "equipment": float(coefs[0]),
        "amenity": float(coefs[1]),
        "travel": float(coefs[2]),
        "price": float(coefs[3]),
        "penalty": float(coefs[4]),
    }

    weights = normalize_weights(raw_weights)

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(
            {
                "weights": weights,
                "trained_on_rows": int(total),
                "positive_rows": int(pos),
            },
            f,
            indent=2
        )

    print("Saved:", OUT_PATH)
    print("Weights:", weights)

if __name__ == "__main__":
    main()
