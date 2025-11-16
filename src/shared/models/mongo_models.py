"""
MongoDB Models (Document structures)
Using Motor (async MongoDB driver)
"""

from datetime import datetime
from typing import Optional
from decimal import Decimal


# ═══════════════════════════════════════════════════════════
# MongoDB Collections Structure (Document format)
# ═══════════════════════════════════════════════════════════


class MongoCollections:
    """MongoDB collection names"""

    USERS = "users"
    PRODUCTS = "products"
    STOCK_ITEMS = "stock_items"
    ORDERS = "orders"
    PAYMENTS = "payments"


# Helper functions for creating documents

def create_user_document(discord_id: str, username: str, discriminator: Optional[str] = None) -> dict:
    """Create user document"""
    return {
        "discord_id": discord_id,
        "username": username,
        "discriminator": discriminator,
        "balance": Decimal("0.00"),
        "total_spent": Decimal("0.00"),
        "total_orders": 0,
        "is_banned": False,
        "is_admin": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }


def create_product_document(
    code: str,
    name: str,
    price: Decimal,
    product_type: str = "digital",
    description: Optional[str] = None,
) -> dict:
    """Create product document"""
    return {
        "code": code,
        "name": name,
        "description": description,
        "type": product_type,
        "category": None,
        "price": float(price),
        "discount_price": None,
        "total_stock": 0,
        "available_stock": 0,
        "is_active": True,
        "is_featured": False,
        "image_url": None,
        "sort_order": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }


def create_order_document(
    order_number: str,
    user_id: str,
    items: list[dict],
    total_amount: Decimal,
    final_amount: Decimal,
) -> dict:
    """Create order document"""
    return {
        "order_number": order_number,
        "user_id": user_id,
        "items": items,
        "total_amount": float(total_amount),
        "discount_amount": 0.0,
        "final_amount": float(final_amount),
        "status": "pending",
        "completed_at": None,
        "cancelled_at": None,
        "notes": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }


__all__ = [
    "MongoCollections",
    "create_user_document",
    "create_product_document",
    "create_order_document",
]
