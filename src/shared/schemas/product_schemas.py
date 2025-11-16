"""Product Pydantic schemas"""

from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import datetime


class ProductBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    type: str = "digital"
    category: str | None = None


class ProductCreate(ProductBase):
    """Schema for creating product"""
    price: Decimal = Field(..., ge=0)
    discount_price: Decimal | None = Field(None, ge=0)


class ProductUpdate(BaseModel):
    """Schema for updating product"""
    name: str | None = None
    description: str | None = None
    price: Decimal | None = Field(None, ge=0)
    discount_price: Decimal | None = Field(None, ge=0)
    is_active: bool | None = None


class ProductResponse(ProductBase):
    """Schema for product response"""
    id: int
    price: Decimal
    discount_price: Decimal | None
    total_stock: int
    available_stock: int
    is_active: bool
    is_featured: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
