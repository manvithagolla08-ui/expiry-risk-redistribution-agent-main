from typing import List, Dict
from uuid import UUID
from datetime import datetime, date

def calculate_forecast(product_id: UUID, warehouse_id: UUID, historical_demand: List[dict]) -> dict:
    """
    Calculates the forecast daily demand using a simple moving average.
    historical_demand is a list of dictionaries, where each dictionary
    has at least 'date' and 'quantity_sold'.
    """
    if not historical_demand:
        return {
            "product_id": product_id,
            "warehouse_id": warehouse_id,
            "forecast_daily_demand": 0.0,
            "method": "moving_average",
            "historical_period_used_days": 0
        }
    
    # Sort by date descending
    sorted_demand = sorted(
        historical_demand, 
        key=lambda x: datetime.strptime(x['date'], '%Y-%m-%d').date() if isinstance(x['date'], str) else x['date'], 
        reverse=True
    )
    
    # Use up to the last 30 days of data for the moving average
    period_to_use = min(30, len(sorted_demand))
    recent_demand = sorted_demand[:period_to_use]
    
    total_quantity = sum(record.get('quantity_sold', 0) for record in recent_demand)
    
    forecast_daily_demand = total_quantity / period_to_use if period_to_use > 0 else 0.0
    
    return {
        "product_id": product_id,
        "warehouse_id": warehouse_id,
        "forecast_daily_demand": float(forecast_daily_demand),
        "method": "moving_average",
        "historical_period_used_days": period_to_use
    }
