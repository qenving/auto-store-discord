#!/usr/bin/env python3
"""
Test Configuration Tool
Validates config.json and displays settings
"""

import sys
from loguru import logger

from src.core.config import get_settings
from src.core.exceptions import ConfigurationError


def main():
    """Test configuration"""
    logger.info("=" * 60)
    logger.info("TESTING CONFIGURATION")
    logger.info("=" * 60)

    try:
        # Load settings
        settings = get_settings()

        # Display configuration
        logger.success("✅ Configuration loaded successfully!")
        logger.info("")

        # Mode
        logger.info(f"📋 Mode: {settings.mode.value}")
        logger.info(f"   • Bot Enabled: {settings.is_bot_enabled()}")
        logger.info(f"   • Web Enabled: {settings.is_web_enabled()}")
        logger.info("")

        # Discord
        if settings.discord:
            logger.info("🤖 Discord Configuration:")
            logger.info(f"   • Token: {'*' * 20} (hidden)")
            logger.info(f"   • Guild ID: {settings.discord.guild_id}")
            logger.info("")

        # Database
        logger.info(f"💾 Database: {settings.database.type.value}")

        if settings.database.type.value == "mysql" and settings.database.mysql:
            logger.info("   • MySQL Configuration:")
            logger.info(f"     - Host: {settings.database.mysql.host}")
            logger.info(f"     - Port: {settings.database.mysql.port}")
            logger.info(f"     - Database: {settings.database.mysql.database}")
            logger.info(f"     - User: {settings.database.mysql.user}")

        if settings.database.type.value == "mongodb" and settings.database.mongodb:
            logger.info("   • MongoDB Configuration:")
            logger.info(f"     - URI: {settings.database.mongodb.uri[:50]}...")

        logger.info("")

        # Payment
        if settings.payment:
            logger.info("💳 Payment Configuration:")
            logger.info(f"   • Midtrans: {'✅' if settings.payment.midtrans else '❌'}")
            logger.info(f"   • Duitku: {'✅' if settings.payment.duitku else '❌'}")
            logger.info(f"   • Tripay: {'✅' if settings.payment.tripay else '❌'}")
            logger.info("")

        # Website
        if settings.website:
            logger.info("🌐 Website Configuration:")
            logger.info(f"   • URL: {settings.website.url}")
            logger.info(f"   • Port: {settings.website.port}")
            logger.info("")

        logger.info("=" * 60)
        logger.success("✅ All configuration checks passed!")
        logger.info("=" * 60)

        return 0

    except ConfigurationError as e:
        logger.error("=" * 60)
        logger.error("❌ CONFIGURATION ERROR")
        logger.error("=" * 60)
        logger.error(str(e))
        logger.error("")
        logger.error("Please check your config.json file.")
        logger.error("=" * 60)
        return 1

    except Exception as e:
        logger.error("=" * 60)
        logger.error("❌ UNEXPECTED ERROR")
        logger.error("=" * 60)
        logger.exception(e)
        logger.error("=" * 60)
        return 1


if __name__ == "__main__":
    sys.exit(main())
