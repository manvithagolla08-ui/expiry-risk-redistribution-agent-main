import pytest
from uuid import uuid4
from datetime import date, timedelta
from app.analytics.forecasting.forecaster import calculate_forecast
from app.analytics.risk.scorer import calculate_risk_score
from app.analytics.redistribution.engine import haversine, recommend_transfers
from app.analytics.redistribution.simulation import simulate_what_if_transfer

def test_haversine():
    # Chicago to NY approx 1145 km
    dist = haversine(41.8781, -87.6298, 40.7128, -74.0060)
    assert 1100 < dist < 1200

def test_forecast_moving_average():
    prod_id = uuid4()
    wh_id = uuid4()
    # 5 days of demand, 10 each
    history = [
        {"date": str(date.today() - timedelta(days=i)), "quantity_sold": 10}
        for i in range(5)
    ]
    forecast = calculate_forecast(prod_id, wh_id, history)
    assert forecast['forecast_daily_demand'] == 10.0
    assert forecast['historical_period_used_days'] == 5

def test_risk_score():
    batch = {
        "id": uuid4(),
        "product_id": uuid4(),
        "warehouse_id": uuid4(),
        "quantity": 100,
        "expiry_date": str(date.today() + timedelta(days=10))
    }
    # forecast is 2/day, so expected demand is 20 before expiry
    # excess is 80. Excess ratio = 80/100 = 0.8
    # historical is 1/day -> expected 10. historical excess = 90. ratio = 0.9.
    # time risk = min(40, max(0, 50-10)*0.8) = min(40, 32) = 32
    # forecast excess risk = 0.8 * 30 = 24
    # historical risk = 0.9 * 30 = 27
    # total risk = 32 + 24 + 27 = 83.0
    
    score1 = calculate_risk_score(batch, forecast_daily_demand=2.0, historical_daily_demand=1.0)
    assert score1['expected_demand_before_expiry'] == 20.0
    assert score1['potential_excess'] == 80.0
    assert score1['risk_score'] == 83.0
    assert score1['risk_level'] == "CRITICAL"
    
    # Verify changing historical demand changes the score
    # historical is 10/day -> expected 100. historical excess = 0. ratio = 0.
    # historical risk = 0
    # total risk = 32 + 24 + 0 = 56.0
    score2 = calculate_risk_score(batch, forecast_daily_demand=2.0, historical_daily_demand=10.0)
    assert score2['risk_score'] == 56.0
    assert score2['risk_level'] == "HIGH"

def test_redistribution_recommendations():
    prod_id = uuid4()
    wh1 = uuid4() # source
    wh2 = uuid4() # dest
    
    batches_with_risk = [{
        "id": uuid4(),
        "product_id": prod_id,
        "warehouse_id": wh1,
        "quantity": 100,
        "potential_excess": 50,
        "risk_score": 90.0,
        "risk_level": "CRITICAL"
    }]
    
    forecasts = {
        f"{prod_id}_{wh2}": 5.0 # demand of 5 at dest
    }
    
    warehouses = [
        {"id": wh1, "latitude": 41.0, "longitude": -87.0},
        {"id": wh2, "latitude": 42.0, "longitude": -88.0}
    ]
    
    recs = recommend_transfers(batches_with_risk, forecasts, warehouses)
    
    assert len(recs) == 1
    rec = recs[0]
    assert rec['destination_warehouse_id'] == str(wh2)
    # dest wants 14 * 5 = 70. Source has 50 excess. Transfer is 50.
    assert rec['recommended_quantity'] == 50

def test_what_if_simulation():
    rec = {
        "recommended_quantity": 40
    }
    source_batch = {
        "quantity": 100,
        "days_to_expiry": 10
    }
    # source demand = 2/day -> expected 20. Waste before = 80
    # after transfer: source has 60. expected 20. waste source = 40
    # dest demand = 5/day -> expected 50. waste dest = max(0, 40 - 50) = 0
    # waste after = 40
    # waste avoided = 80 - 40 = 40
    
    sim = simulate_what_if_transfer(rec, source_batch, 2.0, 5.0)
    assert sim['waste_before_transfer'] == 80.0
    assert sim['waste_after_transfer'] == 40.0
    assert sim['waste_avoided'] == 40.0
