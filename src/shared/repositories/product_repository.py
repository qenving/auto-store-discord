"""Product Repository - Data access layer for products"""

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from decimal import Decimal

from src.shared.models.sql_models import Product, StockItem
from src.shared.schemas.product_schemas import ProductCreate, ProductUpdate


class ProductRepository:
    """Repository for Product operations"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, product_id: int) -> Optional[Product]:
        """Get product by ID"""
        result = await self.session.execute(select(Product).where(Product.id == product_id))
        return result.scalar_one_or_none()

    async def get_by_code(self, code: str) -> Optional[Product]:
        """Get product by code"""
        result = await self.session.execute(select(Product).where(Product.code == code))
        return result.scalar_one_or_none()

    async def get_all(self, active_only: bool = True) -> List[Product]:
        """Get all products"""
        query = select(Product)
        if active_only:
            query = query.where(Product.is_active == True)

        result = await self.session.execute(query.order_by(Product.created_at.desc()))
        return list(result.scalars().all())

    async def get_by_category(self, category: str, active_only: bool = True) -> List[Product]:
        """Get products by category"""
        query = select(Product).where(Product.category == category)
        if active_only:
            query = query.where(Product.is_active == True)

        result = await self.session.execute(query.order_by(Product.created_at.desc()))
        return list(result.scalars().all())

    async def get_featured(self) -> List[Product]:
        """Get featured products"""
        result = await self.session.execute(
            select(Product)
            .where(and_(Product.is_featured == True, Product.is_active == True))
            .order_by(Product.created_at.desc())
        )
        return list(result.scalars().all())

    async def create(self, product_data: ProductCreate) -> Product:
        """Create new product"""
        product = Product(**product_data.model_dump())
        self.session.add(product)
        await self.session.commit()
        await self.session.refresh(product)
        return product

    async def update(self, product: Product, product_data: ProductUpdate) -> Product:
        """Update product"""
        update_data = product_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(product, field, value)

        await self.session.commit()
        await self.session.refresh(product)
        return product

    async def delete(self, product: Product) -> None:
        """Delete product (soft delete by setting is_active=False is recommended)"""
        await self.session.delete(product)
        await self.session.commit()

    async def deactivate(self, product: Product) -> Product:
        """Soft delete - deactivate product"""
        product.is_active = False
        await self.session.commit()
        await self.session.refresh(product)
        return product

    async def update_stock(self, product: Product, total_stock: int, available_stock: int) -> Product:
        """Update product stock counts"""
        product.total_stock = total_stock
        product.available_stock = available_stock
        await self.session.commit()
        await self.session.refresh(product)
        return product

    async def search(self, search_term: str, active_only: bool = True) -> List[Product]:
        """Search products by name or code"""
        query = select(Product).where(
            (Product.name.ilike(f"%{search_term}%")) | (Product.code.ilike(f"%{search_term}%"))
        )
        if active_only:
            query = query.where(Product.is_active == True)

        result = await self.session.execute(query.order_by(Product.created_at.desc()))
        return list(result.scalars().all())
