from typing import List, Dict, Any
from uuid import UUID
import math

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    # Convert decimal degrees to radians 
    lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])
    
    # Haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a)) 
    r = 6371 # Radius of earth in kilometers
    return c * r

def recommend_transfers(
    batches_with_risk: List[Dict[str, Any]], 
    forecasts: Dict[str, float], 
    warehouses: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    batches_with_risk: List of batches augmented with risk scores and potential excess.
    forecasts: Dict mapping 'product_id_warehouse_id' to forecast_daily_demand.
    warehouses: List of warehouse dictionaries.
    """
    recommendations = []
    
    # Create warehouse lookup
    wh_lookup = {str(w['id']): w for w in warehouses}
    
    # Find excesses
    excess_batches = [b for b in batches_with_risk if b.get('potential_excess', 0) > 0 and b.get('risk_score', 0) >= 25.0]
    
    for batch in excess_batches:
        prod_id = str(batch['product_id'])
        source_wh_id = str(batch['warehouse_id'])
        source_wh = wh_lookup.get(source_wh_id)
        
        if not source_wh or source_wh.get('latitude') is None or source_wh.get('longitude') is None:
            continue
            
        excess_qty = batch['potential_excess']
        
        # Find potential destinations (warehouses with demand for this product but low stock)
        # We need total stock per warehouse for this product
        destinations = []
        for wh in warehouses:
            dest_wh_id = str(wh['id'])
            if dest_wh_id == source_wh_id:
                continue
                
            if wh.get('latitude') is None or wh.get('longitude') is None:
                continue
                
            # Forecast demand at dest
            forecast_key = f"{prod_id}_{dest_wh_id}"
            dest_demand = forecasts.get(forecast_key, 0.0)
            
            if dest_demand > 0:
                # Find current stock of this product at destination
                dest_stock = sum(
                    b.get('quantity', 0) for b in batches_with_risk 
                    if str(b.get('product_id')) == prod_id and str(b.get('warehouse_id')) == dest_wh_id
                )
                
                # if destination has less than 14 days of stock, it's a good candidate
                if dest_stock < (dest_demand * 14):
                    distance = haversine(
                        source_wh['latitude'], source_wh['longitude'],
                        wh['latitude'], wh['longitude']
                    )
                    
                    # only recommend if distance < 1000km to be realistic
                    if distance < 1000:
                        destinations.append({
                            'warehouse_id': dest_wh_id,
                            'demand': dest_demand,
                            'current_stock': dest_stock,
                            'distance': distance
                        })
                        
        # Sort destinations by distance (closest first), then demand (highest first)
        destinations.sort(key=lambda x: (x['distance'], -x['demand']))
        
        # Allocate excess
        remaining_excess = excess_qty
        for dest in destinations:
            if remaining_excess <= 0:
                break
                
            # recommend up to 14 days of demand or remaining excess
            needed_qty = max(0, int((dest['demand'] * 14) - dest['current_stock']))
            transfer_qty = min(remaining_excess, needed_qty)
            
            if transfer_qty > 0:
                recommendations.append({
                    "product_id": batch['product_id'],
                    "source_warehouse_id": batch['warehouse_id'],
                    "destination_warehouse_id": dest['warehouse_id'],
                    "recommended_quantity": int(transfer_qty),
                    "source_risk_level": batch['risk_level'],
                    "destination_demand": dest['demand'],
                    "distance_km": round(dest['distance'], 2),
                    "reason": f"High risk at source ({batch['risk_level']}), high demand at destination ({dest['demand']:.1f}/day). Distance: {dest['distance']:.0f}km."
                })
                remaining_excess -= transfer_qty
                
    return recommendations
