"""Stock Repository - Data access layer for stock items"""

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from datetime import datetime

from src.shared.models.sql_models import StockItem


class StockRepository:
    """Repository for StockItem operations"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, stock_id: int) -> Optional[StockItem]:
        """Get stock item by ID"""
        result = await self.session.execute(select(StockItem).where(StockItem.id == stock_id))
        return result.scalar_one_or_none()

    async def get_available_for_product(self, product_id: int, limit: int = 1) -> List[StockItem]:
        """Get available stock items for a product"""
        result = await self.session.execute(
            select(StockItem)
            .where(and_(StockItem.product_id == product_id, StockItem.is_used == False))
            .order_by(StockItem.created_at.asc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_all_for_product(self, product_id: int, available_only: bool = False) -> List[StockItem]:
        """Get all stock items for a product"""
        query = select(StockItem).where(StockItem.product_id == product_id)
        if available_only:
            query = query.where(StockItem.is_used == False)

        result = await self.session.execute(query.order_by(StockItem.created_at.desc()))
        return list(result.scalars().all())

    async def count_available(self, product_id: int) -> int:
        """Count available stock items for a product"""
        from sqlalchemy import func

        result = await self.session.execute(
            select(func.count(StockItem.id))
            .where(and_(StockItem.product_id == product_id, StockItem.is_used == False))
        )
        return result.scalar() or 0

    async def count_total(self, product_id: int) -> int:
        """Count total stock items for a product"""
        from sqlalchemy import func

        result = await self.session.execute(
            select(func.count(StockItem.id)).where(StockItem.product_id == product_id)
        )
        return result.scalar() or 0

    async def create(self, product_id: int, content: str) -> StockItem:
        """Create new stock item"""
        stock_item = StockItem(product_id=product_id, content=content)
        self.session.add(stock_item)
        await self.session.commit()
        await self.session.refresh(stock_item)
        return stock_item

    async def create_bulk(self, product_id: int, contents: List[str]) -> List[StockItem]:
        """Create multiple stock items at once"""
        stock_items = [StockItem(product_id=product_id, content=content) for content in contents]
        self.session.add_all(stock_items)
        await self.session.commit()

        # Refresh all items
        for item in stock_items:
            await self.session.refresh(item)

        return stock_items

    async def mark_as_used(self, stock_item: StockItem, used_by: int) -> StockItem:
        """Mark stock item as used"""
        stock_item.is_used = True
        stock_item.used_at = datetime.utcnow()
        stock_item.used_by = used_by

        await self.session.commit()
        await self.session.refresh(stock_item)
        return stock_item

    async def delete(self, stock_item: StockItem) -> None:
        """Delete stock item"""
        await self.session.delete(stock_item)
        await self.session.commit()

    async def delete_unused_for_product(self, product_id: int) -> int:
        """Delete all unused stock items for a product, returns count deleted"""
        from sqlalchemy import delete as sql_delete

        result = await self.session.execute(
            sql_delete(StockItem).where(
                and_(StockItem.product_id == product_id, StockItem.is_used == False)
            )
        )
        await self.session.commit()
        return result.rowcount
