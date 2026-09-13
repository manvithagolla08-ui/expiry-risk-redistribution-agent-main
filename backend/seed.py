import os
import random
from datetime import datetime, timedelta
import logging

# Ensure env variables are loaded
from dotenv import load_dotenv
load_dotenv()

from app.core.supabase import supabase_client
from app.models.schemas import (
    WarehouseCreate, ProductCreate, InventoryBatchCreate, DemandHistoryCreate
)
from app.services import crud

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

WAREHOUSES = [
    {"name": "Central Hub", "location": "Chicago, IL", "capacity": 100000, "latitude": 41.8781, "longitude": -87.6298},
    {"name": "East Coast Distribution", "location": "Newark, NJ", "capacity": 75000, "latitude": 40.7357, "longitude": -74.1724},
    {"name": "West Coast Depot", "location": "Los Angeles, CA", "capacity": 85000, "latitude": 34.0522, "longitude": -118.2437},
    {"name": "Southern Facility", "location": "Atlanta, GA", "capacity": 60000, "latitude": 33.7490, "longitude": -84.3880},
    {"name": "Texas Regional", "location": "Dallas, TX", "capacity": 90000, "latitude": 32.7767, "longitude": -96.7970}
]

PRODUCTS = [
    {"name": "Organic Milk (1 Gallon)", "category": "Dairy", "unit": "Gallon"},
    {"name": "Fresh Strawberries (1 lb)", "category": "Produce", "unit": "Box"},
    {"name": "Whole Wheat Bread", "category": "Bakery", "unit": "Loaf"},
    {"name": "Greek Yogurt (32 oz)", "category": "Dairy", "unit": "Tub"},
    {"name": "Baby Spinach (10 oz)", "category": "Produce", "unit": "Bag"},
    {"name": "Ground Beef (80/20)", "category": "Meat", "unit": "lb"},
    {"name": "Chicken Breasts", "category": "Meat", "unit": "lb"},
    {"name": "Avocados (Bag of 4)", "category": "Produce", "unit": "Bag"},
    {"name": "Cheddar Cheese Block", "category": "Dairy", "unit": "Block"},
    {"name": "Fresh Salmon Fillet", "category": "Seafood", "unit": "lb"}
]

def seed_database():
    logger.info("Starting seed process...")
    
    # 1. Seed Warehouses
    logger.info("Seeding Warehouses...")
    created_warehouses = []
    for w in WAREHOUSES:
        res = supabase_client.table('warehouses').insert(w).execute()
        created_warehouses.append(res.data[0])
    logger.info(f"Created {len(created_warehouses)} warehouses.")

    # 2. Seed Products
    logger.info("Seeding Products...")
    created_products = []
    for p in PRODUCTS:
        res = supabase_client.table('products').insert(p).execute()
        created_products.append(res.data[0])
    logger.info(f"Created {len(created_products)} products.")

    # 3. Seed Inventory Batches
    # We want scenarios where items are expiring soon (e.g. 5 days from now)
    # and excess inventory vs deficit
    logger.info("Seeding Inventory Batches...")
    today = datetime.now().date()
    created_batches = 0
    for product in created_products:
        for warehouse in created_warehouses:
            # Randomize to create imbalances
            if random.random() > 0.3:
                # Batch expiring soon (high risk)
                batch = {
                    "product_id": product['id'],
                    "warehouse_id": warehouse['id'],
                    "quantity": random.randint(50, 500),
                    "received_date": (today - timedelta(days=10)).isoformat(),
                    "expiry_date": (today + timedelta(days=random.randint(2, 8))).isoformat()
                }
                supabase_client.table('inventory_batches').insert(batch).execute()
                created_batches += 1
                
                # Batch expiring later
                batch = {
                    "product_id": product['id'],
                    "warehouse_id": warehouse['id'],
                    "quantity": random.randint(100, 1000),
                    "received_date": (today - timedelta(days=2)).isoformat(),
                    "expiry_date": (today + timedelta(days=random.randint(15, 30))).isoformat()
                }
                supabase_client.table('inventory_batches').insert(batch).execute()
                created_batches += 1
    logger.info(f"Created {created_batches} inventory batches.")

    # 4. Seed Demand History (Past 30 days)
    logger.info("Seeding Demand History...")
    demand_records = 0
    for product in created_products:
        for warehouse in created_warehouses:
            base_demand = random.randint(5, 50)
            for day_offset in range(30):
                demand_date = today - timedelta(days=day_offset)
                demand = {
                    "product_id": product['id'],
                    "warehouse_id": warehouse['id'],
                    "date": demand_date.isoformat(),
                    # Add some random variance
                    "quantity_sold": max(0, int(base_demand * random.uniform(0.5, 1.5)))
                }
                supabase_client.table('demand_history').insert(demand).execute()
                demand_records += 1
                
    logger.info(f"Created {demand_records} demand history records.")
    logger.info("Seeding complete.")

if __name__ == "__main__":
    seed_database()
