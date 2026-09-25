from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from uuid import UUID

from app.models.analytics import (
    ForecastResponse, RiskScoreResponse,
    RedistributionResponse, WhatIfSimulationRequest, WhatIfSimulationResponse,
    ExplainRequest, ExplainResponse,
)
from app.services import crud
from app.services.gemini import generate_inventory_explanation
from app.analytics.forecasting.forecaster import calculate_forecast
from app.analytics.risk.scorer import calculate_risk_score
from app.analytics.redistribution.engine import recommend_transfers
from app.analytics.redistribution.simulation import simulate_what_if_transfer

router = APIRouter()

@router.get("/forecast/{product_id}/{warehouse_id}", response_model=ForecastResponse)
def get_forecast(product_id: UUID, warehouse_id: UUID):
    # Fetch historical demand
    all_demand = crud.get_demand_history()
    # Filter for product and warehouse
    hist_demand = [
        d for d in all_demand 
        if str(d.get('product_id')) == str(product_id) and str(d.get('warehouse_id')) == str(warehouse_id)
    ]
    
    return calculate_forecast(product_id, warehouse_id, hist_demand)

@router.get("/risk-scores", response_model=List[RiskScoreResponse])
def get_risk_scores():
    batches = crud.get_inventory_batches()
    all_demand = crud.get_demand_history()
    
    scores = []
    # simple cache for forecasts
    forecast_cache = {}
    
    for batch in batches:
        prod_id = batch.get('product_id')
        wh_id = batch.get('warehouse_id')
        cache_key = f"{prod_id}_{wh_id}"
        
        if cache_key not in forecast_cache:
            hist_demand = [
                d for d in all_demand 
                if str(d.get('product_id')) == str(prod_id) and str(d.get('warehouse_id')) == str(wh_id)
            ]
            forecast = calculate_forecast(prod_id, wh_id, hist_demand)
            forecast_cache[cache_key] = forecast['forecast_daily_demand']
            
        fcst_demand = forecast_cache[cache_key]
        score = calculate_risk_score(batch, fcst_demand, fcst_demand)
        scores.append(score)
        
    return scores

@router.post("/recommend-redistribution", response_model=RedistributionResponse)
def get_redistribution_recommendations():
    batches = crud.get_inventory_batches()
    all_demand = crud.get_demand_history()
    warehouses = crud.get_warehouses()
    
    forecast_cache = {}
    batches_with_risk = []
    
    # Calculate risks first
    for batch in batches:
        prod_id = batch.get('product_id')
        wh_id = batch.get('warehouse_id')
        cache_key = f"{prod_id}_{wh_id}"
        
        if cache_key not in forecast_cache:
            hist_demand = [
                d for d in all_demand 
                if str(d.get('product_id')) == str(prod_id) and str(d.get('warehouse_id')) == str(wh_id)
            ]
            forecast = calculate_forecast(prod_id, wh_id, hist_demand)
            forecast_cache[cache_key] = forecast['forecast_daily_demand']
            
        fcst_demand = forecast_cache[cache_key]
        score = calculate_risk_score(batch, fcst_demand, fcst_demand)
        # merge batch with score
        merged = {**batch, **score}
        batches_with_risk.append(merged)
        
    recommendations = recommend_transfers(batches_with_risk, forecast_cache, warehouses)
    
    return {"recommendations": recommendations}

@router.post("/simulate-transfer", response_model=WhatIfSimulationResponse)
def simulate_transfer(request: WhatIfSimulationRequest):
    batches = crud.get_inventory_batches()
    rec = request.recommendation
    
    # find source batch (just finding one for simplicity that matches product and warehouse)
    source_batches = [
        b for b in batches 
        if str(b.get('product_id')) == str(rec.product_id) and str(b.get('warehouse_id')) == str(rec.source_warehouse_id)
    ]
    if not source_batches:
        raise HTTPException(status_code=404, detail="Source batch not found")
        
    # find forecast for source
    all_demand = crud.get_demand_history()
    
    source_hist = [
        d for d in all_demand 
        if str(d.get('product_id')) == str(rec.product_id) and str(d.get('warehouse_id')) == str(rec.source_warehouse_id)
    ]
    source_fcst = calculate_forecast(rec.product_id, rec.source_warehouse_id, source_hist)['forecast_daily_demand']
    
    dest_hist = [
        d for d in all_demand 
        if str(d.get('product_id')) == str(rec.product_id) and str(d.get('warehouse_id')) == str(rec.destination_warehouse_id)
    ]
    dest_fcst = calculate_forecast(rec.product_id, rec.destination_warehouse_id, dest_hist)['forecast_daily_demand']
    
    # just use the first source batch for simulation
    source_batch = source_batches[0]
    score = calculate_risk_score(source_batch, source_fcst, source_fcst)
    merged_batch = {**source_batch, **score}
    
    sim_result = simulate_what_if_transfer(
        rec.model_dump(), 
        merged_batch, 
        source_fcst, 
        dest_fcst
    )
    
    return sim_result


@router.post("/explain", response_model=ExplainResponse)
def explain_inventory(request: ExplainRequest):
    """
    Pass already-calculated inventory facts to Gemini for a human-readable
    explanation. Gemini does NOT recalculate or modify any values.
    """
    inventory_data = request.model_dump(exclude_none=True)
    explanation = generate_inventory_explanation(inventory_data)
    return ExplainResponse(explanation=explanation)
