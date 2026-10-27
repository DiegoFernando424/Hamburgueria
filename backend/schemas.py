from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ProductBase(BaseModel):
    name: str
    description: str
    price: float
    category: str
    image: str

class ProductResponse(ProductBase):
    id: int
    class Config:
        from_attributes = True

class OrderItemSchema(BaseModel):
    product_name: str
    quantity: int
    price: float

class OrderCreateSchema(BaseModel):
    customer_name: str
    customer_phone: str
    address: str
    payment_method: str
    total_price: float
    items: List[OrderItemSchema]

class OrderResponseSchema(OrderCreateSchema):
    id: int
    status: str
    created_at: datetime
    class Config:
        from_attributes = True
