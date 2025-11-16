"""
Desktop GUI - Main Entry Point
Uses Eel (Python + HTML/CSS/JS) for cross-platform GUI
"""

import eel
import asyncio
from pathlib import Path
from loguru import logger

from src.core.config import get_settings
from src.core.database import AsyncSessionLocal, get_db
from src.shared.services import UserService, ProductService, OrderService

# Get settings
settings = get_settings()

# Set web files folder
web_folder = Path(__file__).parent / "web"
eel.init(str(web_folder))


@eel.expose
def get_config():
    """Get configuration summary"""
    return {
        "mode": settings.mode.value,
        "database": settings.database.type.value,
        "bot_enabled": settings.is_bot_enabled(),
        "web_enabled": settings.is_web_enabled(),
    }


@eel.expose
def get_stats():
    """Get store statistics"""
    try:
        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        stats = loop.run_until_complete(_get_stats_async())
        loop.close()
        return stats
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        return {"error": str(e)}


async def _get_stats_async():
    """Async function to get stats"""
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select, func
        from src.shared.models.sql_models import User, Product, Order

        # Get counts
        user_count = await session.scalar(select(func.count(User.id)))
        product_count = await session.scalar(select(func.count(Product.id)))
        order_count = await session.scalar(select(func.count(Order.id)))

        # Get total sales
        total_sales = await session.scalar(select(func.sum(Order.final_amount)))

        return {
            "users": user_count or 0,
            "products": product_count or 0,
            "orders": order_count or 0,
            "total_sales": float(total_sales) if total_sales else 0.0,
        }


@eel.expose
def get_recent_orders(limit=10):
    """Get recent orders"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        orders = loop.run_until_complete(_get_recent_orders_async(limit))
        loop.close()
        return orders
    except Exception as e:
        logger.error(f"Error getting recent orders: {e}")
        return []


async def _get_recent_orders_async(limit):
    """Async function to get recent orders"""
    async with AsyncSessionLocal() as session:
        order_service = OrderService(session)
        orders = await order_service.get_recent_orders(limit=limit)

        return [
            {
                "order_number": order.order_number,
                "status": order.status.value,
                "total": float(order.final_amount),
                "created_at": order.created_at.isoformat(),
            }
            for order in orders
        ]


@eel.expose
def get_products(active_only=True):
    """Get products"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        products = loop.run_until_complete(_get_products_async(active_only))
        loop.close()
        return products
    except Exception as e:
        logger.error(f"Error getting products: {e}")
        return []


async def _get_products_async(active_only):
    """Async function to get products"""
    async with AsyncSessionLocal() as session:
        product_service = ProductService(session)
        products = await product_service.get_all_products(active_only=active_only)

        return [
            {
                "id": product.id,
                "code": product.code,
                "name": product.name,
                "price": float(product.price),
                "discount_price": float(product.discount_price) if product.discount_price else None,
                "total_stock": product.total_stock,
                "available_stock": product.available_stock,
                "is_active": product.is_active,
            }
            for product in products
        ]


def main():
    """Main entry point for GUI"""
    logger.info("=" * 60)
    logger.info("AUTO-STORE DESKTOP GUI - STARTING")
    logger.info("=" * 60)
    logger.info(f"Mode: {settings.mode.value}")
    logger.info(f"Database: {settings.database.type.value}")
    logger.success("Desktop GUI ready!")
    logger.info("=" * 60)

    try:
        # Start Eel app
        eel.start(
            "index.html",
            size=(1200, 800),
            mode="chrome",  # Can be 'chrome', 'edge', 'firefox', etc.
            port=8888,
            block=True,
        )
    except Exception as e:
        logger.error(f"Failed to start GUI: {e}")
        logger.info("Trying default browser...")
        try:
            eel.start("index.html", size=(1200, 800), port=8888, block=True)
        except Exception as e2:
            logger.error(f"Failed to start GUI with default browser: {e2}")
            raise SystemExit(1)


if __name__ == "__main__":
    main()
