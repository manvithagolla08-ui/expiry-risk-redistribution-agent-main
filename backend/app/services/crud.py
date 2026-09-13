from typing import List, Optional
from uuid import UUID
from app.core.supabase import supabase_client
from app.models.schemas import (
    Warehouse, WarehouseCreate,
    Product, ProductCreate,
    InventoryBatch, InventoryBatchCreate,
    DemandHistory, DemandHistoryCreate
)

# Warehouses
def get_warehouses() -> List[dict]:
    response = supabase_client.table('warehouses').select('*').execute()
    return response.data

def get_warehouse(warehouse_id: UUID) -> Optional[dict]:
    response = supabase_client.table('warehouses').select('*').eq('id', str(warehouse_id)).execute()
    return response.data[0] if response.data else None

def create_warehouse(warehouse: WarehouseCreate) -> dict:
    response = supabase_client.table('warehouses').insert(warehouse.model_dump()).execute()
    return response.data[0]

# Products
def get_products() -> List[dict]:
    response = supabase_client.table('products').select('*').execute()
    return response.data

def get_product(product_id: UUID) -> Optional[dict]:
    response = supabase_client.table('products').select('*').eq('id', str(product_id)).execute()
    return response.data[0] if response.data else None

def create_product(product: ProductCreate) -> dict:
    response = supabase_client.table('products').insert(product.model_dump()).execute()
    return response.data[0]

# Inventory Batches
def get_inventory_batches() -> List[dict]:
    response = supabase_client.table('inventory_batches').select('*').execute()
    return response.data

def get_inventory_batch(batch_id: UUID) -> Optional[dict]:
    response = supabase_client.table('inventory_batches').select('*').eq('id', str(batch_id)).execute()
    return response.data[0] if response.data else None

def create_inventory_batch(batch: InventoryBatchCreate) -> dict:
    # convert dates to strings for JSON serialization in Supabase
    data = batch.model_dump()
    data['received_date'] = data['received_date'].isoformat()
    data['expiry_date'] = data['expiry_date'].isoformat()
    data['product_id'] = str(data['product_id'])
    data['warehouse_id'] = str(data['warehouse_id'])
    response = supabase_client.table('inventory_batches').insert(data).execute()
    return response.data[0]

# Demand History
def get_demand_history() -> List[dict]:
    response = supabase_client.table('demand_history').select('*').execute()
    return response.data

def get_demand_history_by_id(history_id: UUID) -> Optional[dict]:
    response = supabase_client.table('demand_history').select('*').eq('id', str(history_id)).execute()
    return response.data[0] if response.data else None

def create_demand_history(history: DemandHistoryCreate) -> dict:
    data = history.model_dump()
    data['date'] = data['date'].isoformat()
    data['product_id'] = str(data['product_id'])
    data['warehouse_id'] = str(data['warehouse_id'])
    response = supabase_client.table('demand_history').insert(data).execute()
    return response.data[0]
