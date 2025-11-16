"""Order Pydantic schemas"""

from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import datetime


class OrderItemCreate(BaseModel):
    """Schema for order item"""
    product_id: int
    quantity: int = Field(default=1, ge=1)


class OrderCreate(BaseModel):
    """Schema for creating order"""
    items: list[OrderItemCreate]


class OrderItemResponse(BaseModel):
    """Order item response"""
    id: int
    product_code: str
    product_name: str
    quantity: int
    unit_price: Decimal
    total_price: Decimal

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    """Order response"""
    id: int
    order_number: str
    user_id: int
    total_amount: Decimal
    final_amount: Decimal
    status: str
    created_at: datetime
    items: list[OrderItemResponse]

    model_config = {"from_attributes": True}
