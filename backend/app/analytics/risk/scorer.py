from datetime import datetime, date
from typing import Dict, Any

def calculate_risk_score(
    batch: Dict[str, Any], 
    forecast_daily_demand: float,
    historical_daily_demand: float = 0.0
) -> Dict[str, Any]:
    """
    Calculates the expiry risk score for an inventory batch.
    
    Formula for risk_score (0-100):
    1. Base risk from days to expiry (max 40 pts):
       time_risk = min(40.0, max(0.0, 50.0 - days_to_expiry) * 0.8)
    2. Forecast excess risk (max 30 pts):
       excess_ratio = min(1.0, potential_excess / max(1, batch['quantity']))
       forecast_excess_risk = excess_ratio * 30.0
    3. Historical sell-through risk (max 30 pts):
       historical_expected = historical_daily_demand * max(0, days_to_expiry)
       historical_excess = max(0.0, batch['quantity'] - historical_expected)
       historical_ratio = min(1.0, historical_excess / max(1, batch['quantity']))
       historical_risk = historical_ratio * 30.0
    4. Final score = min(100.0, time_risk + forecast_excess_risk + historical_risk)
    """
    expiry_date = batch.get('expiry_date')
    if isinstance(expiry_date, str):
        expiry_date = datetime.strptime(expiry_date, '%Y-%m-%d').date()
    
    today = date.today()
    days_to_expiry = (expiry_date - today).days
    
    # expected demand
    expected_demand_before_expiry = max(0.0, forecast_daily_demand * max(0, days_to_expiry))
    
    # potential excess
    current_qty = batch.get('quantity', 0)
    potential_excess = max(0.0, current_qty - expected_demand_before_expiry)
    
    # calculate score
    if days_to_expiry <= 0:
        risk_score = 100.0
    else:
        # Base risk from time (max 40)
        time_risk = min(40.0, max(0.0, 50.0 - days_to_expiry) * 0.8)
        
        # Risk from forecast excess (max 30)
        excess_ratio = min(1.0, potential_excess / max(1, current_qty))
        forecast_excess_risk = excess_ratio * 30.0
        
        # Risk from historical sell-through (max 30)
        historical_expected = historical_daily_demand * days_to_expiry
        historical_excess = max(0.0, current_qty - historical_expected)
        historical_ratio = min(1.0, historical_excess / max(1, current_qty))
        historical_risk = historical_ratio * 30.0
        
        risk_score = min(100.0, time_risk + forecast_excess_risk + historical_risk)
        
    # Classification
    if risk_score >= 80:
        risk_level = "CRITICAL"
    elif risk_score >= 50:
        risk_level = "HIGH"
    elif risk_score >= 25:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"
        
    return {
        "batch_id": batch.get("id"),
        "product_id": batch.get("product_id"),
        "warehouse_id": batch.get("warehouse_id"),
        "risk_score": float(risk_score),
        "risk_level": risk_level,
        "days_to_expiry": days_to_expiry,
        "expected_demand_before_expiry": float(expected_demand_before_expiry),
        "potential_excess": float(potential_excess)
    }
