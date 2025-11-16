#!/usr/bin/env python3
"""
Test Database Connection Tool
Tests database connectivity and displays info
"""

import sys
import asyncio
from loguru import logger

from src.core.config import get_settings
from src.core.database import AsyncSessionLocal, engine
from src.core.exceptions import DatabaseError


async def test_mysql():
    """Test MySQL connection"""
    try:
        async with AsyncSessionLocal() as session:
            # Try a simple query
            from sqlalchemy import text

            result = await session.execute(text("SELECT 1"))
            result.scalar()

            # Get table count
            result = await session.execute(
                text("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()")
            )
            table_count = result.scalar()

            logger.success("✅ MySQL connection successful!")
            logger.info(f"   • Tables: {table_count}")

            # Try to query models
            from sqlalchemy import select, func
            from src.shared.models.sql_models import User, Product, Order

            user_count = await session.scalar(select(func.count(User.id)))
            product_count = await session.scalar(select(func.count(Product.id)))
            order_count = await session.scalar(select(func.count(Order.id)))

            logger.info(f"   • Users: {user_count}")
            logger.info(f"   • Products: {product_count}")
            logger.info(f"   • Orders: {order_count}")

            return True

    except Exception as e:
        logger.error("❌ MySQL connection failed!")
        logger.error(f"   Error: {str(e)}")
        return False


async def test_mongodb():
    """Test MongoDB connection"""
    try:
        from src.core.database import mongo_db

        if mongo_db is None:
            logger.warning("⚠️  MongoDB not configured")
            return True

        # Try to list collections
        collections = await mongo_db.list_collection_names()

        logger.success("✅ MongoDB connection successful!")
        logger.info(f"   • Collections: {len(collections)}")

        if collections:
            logger.info(f"   • Collection names: {', '.join(collections[:5])}")

        return True

    except Exception as e:
        logger.error("❌ MongoDB connection failed!")
        logger.error(f"   Error: {str(e)}")
        return False


async def main_async():
    """Main async function"""
    logger.info("=" * 60)
    logger.info("TESTING DATABASE CONNECTION")
    logger.info("=" * 60)

    settings = get_settings()
    logger.info(f"Database Type: {settings.database.type.value}")
    logger.info("")

    success = True

    # Test based on configuration
    if settings.database.type.value == "mysql":
        success = await test_mysql()
    elif settings.database.type.value == "mongodb":
        success = await test_mongodb()
    else:
        logger.error(f"Unknown database type: {settings.database.type.value}")
        success = False

    logger.info("")
    logger.info("=" * 60)

    if success:
        logger.success("✅ All database checks passed!")
    else:
        logger.error("❌ Database checks failed!")

    logger.info("=" * 60)

    return 0 if success else 1


def main():
    """Main entry point"""
    try:
        return asyncio.run(main_async())
    except Exception as e:
        logger.error("=" * 60)
        logger.error("❌ UNEXPECTED ERROR")
        logger.error("=" * 60)
        logger.exception(e)
        logger.error("=" * 60)
        return 1


if __name__ == "__main__":
    sys.exit(main())
