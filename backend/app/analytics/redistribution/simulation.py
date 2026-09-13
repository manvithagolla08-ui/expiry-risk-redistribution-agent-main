from typing import Dict, Any

def simulate_what_if_transfer(
    recommendation: Dict[str, Any],
    source_batch: Dict[str, Any],
    forecast_source: float,
    forecast_dest: float
) -> Dict[str, float]:
    """
    Simulates the waste before and after transferring a batch.
    """
    transfer_qty = recommendation['recommended_quantity']
    days_to_expiry = source_batch.get('days_to_expiry', 0)
    current_qty = source_batch.get('quantity', 0)
    
    if days_to_expiry <= 0:
        return {
            "waste_before_transfer": float(current_qty),
            "waste_after_transfer": float(current_qty),
            "waste_avoided": 0.0
        }
        
    # Before transfer
    expected_source_demand = forecast_source * days_to_expiry
    waste_before = max(0.0, current_qty - expected_source_demand)
    
    # After transfer
    remaining_source_qty = max(0, current_qty - transfer_qty)
    waste_after_source = max(0.0, remaining_source_qty - expected_source_demand)
    
    # Destination waste
    # Assuming destination currently has enough demand for it
    expected_dest_demand = forecast_dest * days_to_expiry
    waste_after_dest = max(0.0, transfer_qty - expected_dest_demand)
    
    waste_after = waste_after_source + waste_after_dest
    waste_avoided = max(0.0, waste_before - waste_after)
    
    return {
        "waste_before_transfer": float(waste_before),
        "waste_after_transfer": float(waste_after),
        "waste_avoided": float(waste_avoided)
    }
