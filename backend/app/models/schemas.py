from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID

# Warehouses
class WarehouseBase(BaseModel):
    name: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    capacity: int

class WarehouseCreate(WarehouseBase):
    pass

class Warehouse(WarehouseBase):
    id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# Products
class ProductBase(BaseModel):
    name: str
    category: str
    unit: str

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# Inventory Batches
class InventoryBatchBase(BaseModel):
    product_id: UUID
    warehouse_id: UUID
    quantity: int
    received_date: date
    expiry_date: date

class InventoryBatchCreate(InventoryBatchBase):
    pass

class InventoryBatch(InventoryBatchBase):
    id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# Demand History
class DemandHistoryBase(BaseModel):
    product_id: UUID
    warehouse_id: UUID
    date: date
    quantity_sold: int

class DemandHistoryCreate(DemandHistoryBase):
    pass

class DemandHistory(DemandHistoryBase):
    id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# Transfer Recommendations
class TransferRecommendationBase(BaseModel):
    product_id: UUID
    source_warehouse_id: UUID
    destination_warehouse_id: UUID
    quantity: int
    status: str = 'pending'

class TransferRecommendationCreate(TransferRecommendationBase):
    pass

class TransferRecommendation(TransferRecommendationBase):
    id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
