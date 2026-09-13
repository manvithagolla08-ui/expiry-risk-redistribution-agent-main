from fastapi import APIRouter, HTTPException
from typing import List
from uuid import UUID

from app.models.schemas import (
    Warehouse, WarehouseCreate,
    Product, ProductCreate,
    InventoryBatch, InventoryBatchCreate,
    DemandHistory, DemandHistoryCreate
)
from app.services import crud

router = APIRouter()

# Warehouses
@router.get("/warehouses", response_model=List[Warehouse])
def read_warehouses():
    return crud.get_warehouses()

@router.get("/warehouses/{warehouse_id}", response_model=Warehouse)
def read_warehouse(warehouse_id: UUID):
    db_obj = crud.get_warehouse(warehouse_id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return db_obj

@router.post("/warehouses", response_model=Warehouse)
def create_warehouse(warehouse: WarehouseCreate):
    return crud.create_warehouse(warehouse)

# Products
@router.get("/products", response_model=List[Product])
def read_products():
    return crud.get_products()

@router.get("/products/{product_id}", response_model=Product)
def read_product(product_id: UUID):
    db_obj = crud.get_product(product_id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_obj

@router.post("/products", response_model=Product)
def create_product(product: ProductCreate):
    return crud.create_product(product)

# Inventory Batches
@router.get("/inventory", response_model=List[InventoryBatch])
def read_inventory_batches():
    return crud.get_inventory_batches()

@router.get("/inventory/{batch_id}", response_model=InventoryBatch)
def read_inventory_batch(batch_id: UUID):
    db_obj = crud.get_inventory_batch(batch_id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Inventory Batch not found")
    return db_obj

@router.post("/inventory", response_model=InventoryBatch)
def create_inventory_batch(batch: InventoryBatchCreate):
    return crud.create_inventory_batch(batch)

# Demand History
@router.get("/demand-history", response_model=List[DemandHistory])
def read_demand_history():
    return crud.get_demand_history()

@router.get("/demand-history/{history_id}", response_model=DemandHistory)
def read_demand_history_by_id(history_id: UUID):
    db_obj = crud.get_demand_history_by_id(history_id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Demand History not found")
    return db_obj

@router.post("/demand-history", response_model=DemandHistory)
def create_demand_history(history: DemandHistoryCreate):
    return crud.create_demand_history(history)
