from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict

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
    gyms: List[GymRow]

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

@app.post("/weights", response_model=WeightResponse)
def get_weights(req: WeightRequest):
    return WeightResponse(weights=DEFAULT_WEIGHTS, source="default")
