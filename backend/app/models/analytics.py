from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import date

# Forecast Models
class ForecastRequest(BaseModel):
    product_id: UUID
    warehouse_id: UUID

class ForecastResponse(BaseModel):
    product_id: UUID
    warehouse_id: UUID
    forecast_daily_demand: float
    method: str
    historical_period_used_days: int

# Risk Models
class RiskScoreResponse(BaseModel):
    batch_id: UUID
    product_id: UUID
    warehouse_id: UUID
    risk_score: float
    risk_level: str
    days_to_expiry: int
    expected_demand_before_expiry: float
    potential_excess: float

# Redistribution Models
class RedistributionRecommendation(BaseModel):
    product_id: UUID
    source_warehouse_id: UUID
    destination_warehouse_id: UUID
    recommended_quantity: int
    source_risk_level: str
    destination_demand: float
    distance_km: float
    reason: str

class RedistributionResponse(BaseModel):
    recommendations: List[RedistributionRecommendation]

# Simulation Models
class WhatIfSimulationRequest(BaseModel):
    recommendation: RedistributionRecommendation

class WhatIfSimulationResponse(BaseModel):
    waste_before_transfer: float
    waste_after_transfer: float
    waste_avoided: float
