"""Product Service - Business logic for product operations"""

from decimal import Decimal
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from src.shared.repositories.product_repository import ProductRepository
from src.shared.repositories.stock_repository import StockRepository
from src.shared.models.sql_models import Product
from src.shared.schemas.product_schemas import ProductCreate, ProductUpdate, ProductResponse
from src.core.exceptions import ValidationError
from loguru import logger


class ProductService:
    """Service for product business logic"""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.product_repo = ProductRepository(session)
        self.stock_repo = StockRepository(session)

    async def get_product_by_id(self, product_id: int) -> Optional[ProductResponse]:
        """Get product by ID"""
        product = await self.product_repo.get_by_id(product_id)
        if product:
            return ProductResponse.model_validate(product)
        return None

    async def get_product_by_code(self, code: str) -> Optional[ProductResponse]:
        """Get product by code"""
        product = await self.product_repo.get_by_code(code)
        if product:
            return ProductResponse.model_validate(product)
        return None

    async def get_all_products(self, active_only: bool = True) -> List[ProductResponse]:
        """Get all products"""
        products = await self.product_repo.get_all(active_only=active_only)
        return [ProductResponse.model_validate(p) for p in products]

    async def get_products_by_category(
        self, category: str, active_only: bool = True
    ) -> List[ProductResponse]:
        """Get products by category"""
        products = await self.product_repo.get_by_category(category, active_only=active_only)
        return [ProductResponse.model_validate(p) for p in products]

    async def get_featured_products(self) -> List[ProductResponse]:
        """Get featured products"""
        products = await self.product_repo.get_featured()
        return [ProductResponse.model_validate(p) for p in products]

    async def search_products(self, search_term: str, active_only: bool = True) -> List[ProductResponse]:
        """Search products"""
        products = await self.product_repo.search(search_term, active_only=active_only)
        return [ProductResponse.model_validate(p) for p in products]

    async def create_product(self, product_data: ProductCreate) -> ProductResponse:
        """Create new product"""
        # Check if code already exists
        existing = await self.product_repo.get_by_code(product_data.code)
        if existing:
            raise ValidationError(f"Product dengan kode '{product_data.code}' sudah ada")

        # Validate price
        if product_data.discount_price and product_data.discount_price >= product_data.price:
            raise ValidationError("Harga diskon harus lebih kecil dari harga normal")

        product = await self.product_repo.create(product_data)
        logger.info(f"Product created: {product.code} - {product.name}")
        return ProductResponse.model_validate(product)

    async def update_product(self, product_id: int, product_data: ProductUpdate) -> ProductResponse:
        """Update product"""
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise ValidationError("Product tidak ditemukan")

        # Validate discount price if being updated
        if product_data.discount_price is not None:
            price = product_data.price if product_data.price is not None else product.price
            if product_data.discount_price >= price:
                raise ValidationError("Harga diskon harus lebih kecil dari harga normal")

        product = await self.product_repo.update(product, product_data)
        logger.info(f"Product updated: {product.code}")
        return ProductResponse.model_validate(product)

    async def delete_product(self, product_id: int, soft_delete: bool = True) -> None:
        """Delete product"""
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise ValidationError("Product tidak ditemukan")

        if soft_delete:
            await self.product_repo.deactivate(product)
            logger.info(f"Product deactivated: {product.code}")
        else:
            await self.product_repo.delete(product)
            logger.warning(f"Product deleted: {product.code}")

    async def add_stock(self, product_id: int, contents: List[str]) -> ProductResponse:
        """Add stock items to product"""
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise ValidationError("Product tidak ditemukan")

        # Create stock items
        await self.stock_repo.create_bulk(product_id, contents)

        # Update product stock counts
        total_stock = await self.stock_repo.count_total(product_id)
        available_stock = await self.stock_repo.count_available(product_id)
        product = await self.product_repo.update_stock(product, total_stock, available_stock)

        logger.info(f"Stock added to {product.code}: {len(contents)} items (Total: {total_stock})")
        return ProductResponse.model_validate(product)

    async def remove_unused_stock(self, product_id: int) -> int:
        """Remove all unused stock items from product"""
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise ValidationError("Product tidak ditemukan")

        # Delete unused stock
        deleted_count = await self.stock_repo.delete_unused_for_product(product_id)

        # Update product stock counts
        total_stock = await self.stock_repo.count_total(product_id)
        available_stock = await self.stock_repo.count_available(product_id)
        await self.product_repo.update_stock(product, total_stock, available_stock)

        logger.info(f"Removed {deleted_count} unused stock items from {product.code}")
        return deleted_count

    async def get_available_stock_count(self, product_id: int) -> int:
        """Get count of available stock for product"""
        return await self.stock_repo.count_available(product_id)

    async def get_effective_price(self, product_id: int) -> Decimal:
        """Get effective price (discount price if available, otherwise regular price)"""
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise ValidationError("Product tidak ditemukan")

        return product.discount_price if product.discount_price else product.price

    async def check_availability(self, product_id: int, quantity: int = 1) -> bool:
        """Check if product has enough stock"""
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            return False

        if not product.is_active:
            return False

        available = await self.stock_repo.count_available(product_id)
        return available >= quantity
