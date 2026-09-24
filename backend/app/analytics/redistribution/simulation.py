from typing import Dict, Any
from datetime import datetime, date


def simulate_what_if_transfer(
    recommendation: Dict[str, Any],
    source_batch: Dict[str, Any],
    forecast_source: float,
    forecast_dest: float
) -> Dict[str, float]:
    """
    Simulates the waste before and after transferring a batch.

    Uses the incoming recommendation's recommended_quantity as the transfer
    amount, and always recomputes days_to_expiry from expiry_date so the
    value is never stale from a cached/merged dict.
    """
    transfer_qty = float(recommendation['recommended_quantity'])
    current_qty = float(source_batch.get('quantity', 0))

    # Always recompute days_to_expiry from the raw expiry_date field so we are
    # never affected by a stale or pre-merged value.
    expiry_date = source_batch.get('expiry_date')
    if expiry_date is not None:
        if isinstance(expiry_date, str):
            expiry_date = datetime.strptime(expiry_date, '%Y-%m-%d').date()
        days_to_expiry = (expiry_date - date.today()).days
    else:
        # Fall back to the pre-computed value if expiry_date is unavailable.
        days_to_expiry = int(source_batch.get('days_to_expiry', 0))

    # --- Before transfer ---
    # If already expired every unit is waste; transfer still reduces source qty.
    if days_to_expiry <= 0:
        waste_before = current_qty
        source_qty_after = max(0.0, current_qty - transfer_qty)
        waste_after = source_qty_after  # expired at destination too
        waste_avoided = max(0.0, waste_before - waste_after)
        return {
            "waste_before_transfer": float(waste_before),
            "waste_after_transfer": float(waste_after),
            "waste_avoided": float(waste_avoided),
        }

    expected_source_demand = forecast_source * days_to_expiry
    waste_before = max(0.0, current_qty - expected_source_demand)

    # --- After transfer ---
    source_qty_after_transfer = max(0.0, current_qty - transfer_qty)
    waste_remaining_at_source = max(0.0, source_qty_after_transfer - expected_source_demand)

    expected_dest_demand = forecast_dest * days_to_expiry
    excess_received_at_destination = max(0.0, transfer_qty - expected_dest_demand)

    waste_after = waste_remaining_at_source + excess_received_at_destination
    waste_avoided = max(0.0, waste_before - waste_after)

    return {
        "waste_before_transfer": float(waste_before),
        "waste_after_transfer": float(waste_after),
        "waste_avoided": float(waste_avoided),
    }
