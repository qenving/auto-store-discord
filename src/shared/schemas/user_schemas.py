"""User Pydantic schemas"""

from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import datetime


class UserBase(BaseModel):
    discord_id: str = Field(..., min_length=1, max_length=20)
    username: str = Field(..., min_length=1, max_length=100)
    discriminator: str | None = None


class UserCreate(UserBase):
    """Schema for creating user"""
    pass


class UserUpdate(BaseModel):
    """Schema for updating user"""
    username: str | None = None
    balance: Decimal | None = None
    is_banned: bool | None = None
    is_admin: bool | None = None


class UserResponse(UserBase):
    """Schema for user response"""
    id: int
    balance: Decimal
    total_spent: Decimal
    total_orders: int
    is_banned: bool
    is_admin: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
