# app/main.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Optional
import os, json

app = FastAPI()

class GymRow(BaseModel):
    gym_id: int
    equipment_match: float
    amenity_match: float
    travel_time_min: float
    price: float
    budget_penalty: float

class WeightRequest(BaseModel):
    user_id: int
    gyms: List[GymRow] = []  # optional, can be unused for now

class WeightResponse(BaseModel):
    weights: Dict[str, float]
    source: str

DEFAULT_WEIGHTS = {
    "equipment": 0.33,
    "amenity": 0.22,
    "travel": 0.20,
    "price": 0.20,
    "penalty": 0.05,
}

WEIGHTS_PATH = os.path.join("app", "storage", "weights_global.json")

def normalize(w: Dict[str, float]) -> Dict[str, float]:
    w = {k: float(max(0.0, v)) for k, v in w.items()}
    s = sum(w.values())
    return {k: (v / s if s > 0 else 0.0) for k, v in w.items()}

@app.post("/weights", response_model=WeightResponse)
def get_weights(req: WeightRequest):
    if os.path.exists(WEIGHTS_PATH):
        try:
            with open(WEIGHTS_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            w = data.get("weights", None)
            if isinstance(w, dict) and len(w) > 0:
                return WeightResponse(weights=normalize(w), source="trained_global")
        except Exception:
            pass

    return WeightResponse(weights=DEFAULT_WEIGHTS, source="default")
