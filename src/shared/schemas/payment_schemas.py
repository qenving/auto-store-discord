"""Payment Pydantic schemas"""

from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime


class PaymentCreate(BaseModel):
    """Schema for creating payment"""
    amount: Decimal
    payment_method: str
    order_id: int | None = None


class PaymentResponse(BaseModel):
    """Payment response"""
    id: int
    transaction_id: str
    amount: Decimal
    payment_method: str
    payment_provider: str
    status: str
    payment_url: str | None
    qr_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
