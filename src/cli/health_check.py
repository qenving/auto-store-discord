#!/usr/bin/env python3
"""
System Health Check Tool
Checks overall system health and displays status
"""

import sys
import asyncio
from loguru import logger

from src.core.config import get_settings


async def check_config():
    """Check configuration"""
    try:
        settings = get_settings()
        logger.success("✅ Configuration: OK")
        return True
    except Exception as e:
        logger.error(f"❌ Configuration: FAILED - {str(e)}")
        return False


async def check_database():
    """Check database connection"""
    try:
        from src.core.database import AsyncSessionLocal
        from sqlalchemy import text

        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))

        logger.success("✅ Database Connection: OK")
        return True
    except Exception as e:
        logger.error(f"❌ Database Connection: FAILED - {str(e)}")
        return False


async def check_models():
    """Check if models can be imported"""
    try:
        from src.shared.models.sql_models import User, Product, Order, Payment

        logger.success("✅ Database Models: OK")
        return True
    except Exception as e:
        logger.error(f"❌ Database Models: FAILED - {str(e)}")
        return False


async def check_services():
    """Check if services can be imported"""
    try:
        from src.shared.services import UserService, ProductService, OrderService, PaymentService

        logger.success("✅ Services: OK")
        return True
    except Exception as e:
        logger.error(f"❌ Services: FAILED - {str(e)}")
        return False


async def check_bot():
    """Check if bot can be initialized"""
    try:
        settings = get_settings()

        if not settings.is_bot_enabled():
            logger.warning("⚠️  Discord Bot: DISABLED")
            return True

        # Just check if we can import the bot class
        from src.bot.main import AutoStoreBot

        logger.success("✅ Discord Bot: OK (not started)")
        return True
    except Exception as e:
        logger.error(f"❌ Discord Bot: FAILED - {str(e)}")
        return False


async def check_api():
    """Check if API can be imported"""
    try:
        from src.api.main import app

        logger.success("✅ FastAPI: OK (not started)")
        return True
    except Exception as e:
        logger.error(f"❌ FastAPI: FAILED - {str(e)}")
        return False


async def main_async():
    """Main async function"""
    logger.info("=" * 60)
    logger.info("SYSTEM HEALTH CHECK")
    logger.info("=" * 60)
    logger.info("")

    checks = [
        ("Configuration", check_config()),
        ("Database Connection", check_database()),
        ("Database Models", check_models()),
        ("Services", check_services()),
        ("Discord Bot", check_bot()),
        ("FastAPI", check_api()),
    ]

    results = []
    for name, check in checks:
        result = await check
        results.append(result)

    logger.info("")
    logger.info("=" * 60)

    passed = sum(results)
    total = len(results)

    if passed == total:
        logger.success(f"✅ HEALTH CHECK PASSED: {passed}/{total} checks OK")
    else:
        logger.error(f"❌ HEALTH CHECK FAILED: {passed}/{total} checks OK")

    logger.info("=" * 60)

    return 0 if passed == total else 1


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
