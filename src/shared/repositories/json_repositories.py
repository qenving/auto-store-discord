"""
JSON Repository Implementations
Compatible interface with SQL repositories, but using JSON storage
"""

from decimal import Decimal
from typing import Optional, List
from datetime import datetime

from src.core.database.json_storage import JSONStorage
from src.shared.schemas.user_schemas import UserCreate, UserUpdate, UserResponse
from src.shared.schemas.product_schemas import ProductCreate, ProductUpdate, ProductResponse
from src.shared.schemas.order_schemas import OrderCreate, OrderItemCreate
from src.shared.schemas.payment_schemas import PaymentCreate


class JSONUserRepository:
    """User repository for JSON storage"""

    COLLECTION = "users"

    def __init__(self, storage: JSONStorage):
        self.storage = storage

    async def get_by_id(self, user_id: int) -> Optional[dict]:
        """Get user by ID"""
        return await self.storage.find_by_id(self.COLLECTION, user_id)

    async def get_by_discord_id(self, discord_id: str) -> Optional[dict]:
        """Get user by Discord ID"""
        return await self.storage.find_one(
            self.COLLECTION, lambda x: x.get("discord_id") == discord_id
        )

    async def create(self, user_data: UserCreate) -> dict:
        """Create new user"""
        user_dict = {
            "discord_id": user_data.discord_id,
            "username": user_data.username,
            "balance": float(Decimal("0.00")),
            "total_spent": float(Decimal("0.00")),
            "total_orders": 0,
            "is_banned": False,
            "is_admin": False,
        }

        return await self.storage.insert(self.COLLECTION, user_dict)

    async def update(self, user: dict, user_data: UserUpdate) -> dict:
        """Update user"""
        update_dict = user_data.model_dump(exclude_unset=True)

        # Convert Decimal to float
        if "balance" in update_dict:
            update_dict["balance"] = float(update_dict["balance"])
        if "total_spent" in update_dict:
            update_dict["total_spent"] = float(update_dict["total_spent"])

        updated = await self.storage.update_one(
            self.COLLECTION, lambda x: x.get("id") == user["id"], update_dict
        )

        return updated if updated else user

    async def delete(self, user: dict) -> None:
        """Delete user"""
        await self.storage.delete_by_id(self.COLLECTION, user["id"])


class JSONProductRepository:
    """Product repository for JSON storage"""

    COLLECTION = "products"

    def __init__(self, storage: JSONStorage):
        self.storage = storage

    async def get_by_id(self, product_id: int) -> Optional[dict]:
        """Get product by ID"""
        return await self.storage.find_by_id(self.COLLECTION, product_id)

    async def get_by_code(self, code: str) -> Optional[dict]:
        """Get product by code"""
        return await self.storage.find_one(
            self.COLLECTION, lambda x: x.get("code") == code.upper()
        )

    async def get_all(self, active_only: bool = True) -> List[dict]:
        """Get all products"""
        if active_only:
            return await self.storage.find_all(
                self.COLLECTION, lambda x: x.get("is_active", True)
            )
        return await self.storage.find_all(self.COLLECTION)

    async def get_by_category(self, category: str, active_only: bool = True) -> List[dict]:
        """Get products by category"""
        products = await self.storage.find_all(
            self.COLLECTION,
            lambda x: x.get("category") == category
            and (x.get("is_active", True) if active_only else True),
        )
        return products

    async def get_featured(self) -> List[dict]:
        """Get featured products"""
        return await self.storage.find_all(
            self.COLLECTION, lambda x: x.get("is_featured", False) and x.get("is_active", True)
        )

    async def create(self, product_data: ProductCreate) -> dict:
        """Create new product"""
        product_dict = product_data.model_dump()

        # Convert Decimals
        product_dict["price"] = float(product_dict["price"])
        if product_dict.get("discount_price"):
            product_dict["discount_price"] = float(product_dict["discount_price"])

        # Add defaults
        product_dict["code"] = product_dict["code"].upper()
        product_dict.setdefault("total_stock", 0)
        product_dict.setdefault("available_stock", 0)
        product_dict.setdefault("is_active", True)
        product_dict.setdefault("is_featured", False)

        return await self.storage.insert(self.COLLECTION, product_dict)

    async def update(self, product: dict, product_data: ProductUpdate) -> dict:
        """Update product"""
        update_dict = product_data.model_dump(exclude_unset=True)

        # Convert Decimals
        if "price" in update_dict:
            update_dict["price"] = float(update_dict["price"])
        if "discount_price" in update_dict and update_dict["discount_price"]:
            update_dict["discount_price"] = float(update_dict["discount_price"])

        updated = await self.storage.update_one(
            self.COLLECTION, lambda x: x.get("id") == product["id"], update_dict
        )

        return updated if updated else product

    async def delete(self, product: dict) -> None:
        """Delete product"""
        await self.storage.delete_by_id(self.COLLECTION, product["id"])

    async def deactivate(self, product: dict) -> dict:
        """Deactivate product"""
        return await self.update(product, ProductUpdate(is_active=False))

    async def update_stock(self, product: dict, total_stock: int, available_stock: int) -> dict:
        """Update stock counts"""
        updated = await self.storage.update_one(
            self.COLLECTION,
            lambda x: x.get("id") == product["id"],
            {"total_stock": total_stock, "available_stock": available_stock},
        )
        return updated if updated else product

    async def search(self, search_term: str, active_only: bool = True) -> List[dict]:
        """Search products"""
        search_lower = search_term.lower()
        return await self.storage.find_all(
            self.COLLECTION,
            lambda x: (search_lower in x.get("name", "").lower() or search_lower in x.get("code", "").lower())
            and (x.get("is_active", True) if active_only else True),
        )


class JSONStockRepository:
    """Stock repository for JSON storage"""

    COLLECTION = "stock_items"

    def __init__(self, storage: JSONStorage):
        self.storage = storage

    async def get_by_id(self, stock_id: int) -> Optional[dict]:
        """Get stock item by ID"""
        return await self.storage.find_by_id(self.COLLECTION, stock_id)

    async def get_available_for_product(self, product_id: int, limit: int = 1) -> List[dict]:
        """Get available stock for product"""
        all_stock = await self.storage.find_all(
            self.COLLECTION,
            lambda x: x.get("product_id") == product_id and not x.get("is_used", False),
        )
        # Sort by created_at (oldest first) and limit
        all_stock.sort(key=lambda x: x.get("created_at", ""))
        return all_stock[:limit]

    async def count_available(self, product_id: int) -> int:
        """Count available stock"""
        return await self.storage.count(
            self.COLLECTION,
            lambda x: x.get("product_id") == product_id and not x.get("is_used", False),
        )

    async def count_total(self, product_id: int) -> int:
        """Count total stock"""
        return await self.storage.count(
            self.COLLECTION, lambda x: x.get("product_id") == product_id
        )

    async def create(self, product_id: int, content: str) -> dict:
        """Create stock item"""
        stock_dict = {"product_id": product_id, "content": content, "is_used": False}
        return await self.storage.insert(self.COLLECTION, stock_dict)

    async def create_bulk(self, product_id: int, contents: List[str]) -> List[dict]:
        """Create multiple stock items"""
        items = []
        for content in contents:
            item = await self.create(product_id, content)
            items.append(item)
        return items

    async def mark_as_used(self, stock_item: dict, used_by: int) -> dict:
        """Mark stock as used"""
        updated = await self.storage.update_one(
            self.COLLECTION,
            lambda x: x.get("id") == stock_item["id"],
            {
                "is_used": True,
                "used_at": datetime.utcnow().isoformat(),
                "used_by": used_by,
            },
        )
        return updated if updated else stock_item

    async def delete(self, stock_item: dict) -> None:
        """Delete stock item"""
        await self.storage.delete_by_id(self.COLLECTION, stock_item["id"])

    async def delete_unused_for_product(self, product_id: int) -> int:
        """Delete unused stock for product"""
        return await self.storage.delete(
            self.COLLECTION,
            lambda x: x.get("product_id") == product_id and not x.get("is_used", False),
        )


# Note: Order and Payment repositories would be similar but are simplified for brevity
# They follow the same pattern as above

__all__ = [
    "JSONUserRepository",
    "JSONProductRepository",
    "JSONStockRepository",
]
