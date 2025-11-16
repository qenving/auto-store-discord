"""Database infrastructure - Async engines and sessions"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from motor.motor_asyncio import AsyncIOMotorClient
from typing import AsyncGenerator
from loguru import logger

from src.core.config import get_settings


# ═══════════════════════════════════════════════════════════
# MySQL / SQLAlchemy Setup (Async)
# ═══════════════════════════════════════════════════════════

settings = get_settings()
db_config = settings.database

# Create async engine
if db_config.type.value == "mysql" and db_config.mysql:
    DATABASE_URL = db_config.mysql.connection_string

    engine = create_async_engine(
        DATABASE_URL,
        echo=False,  # Set True for SQL query logging
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )

    AsyncSessionLocal = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    logger.success("MySQL async engine created")
else:
    engine = None
    AsyncSessionLocal = None


# ═══════════════════════════════════════════════════════════
# MongoDB Setup (Async)
# ═══════════════════════════════════════════════════════════

if db_config.type.value == "mongodb" and db_config.mongodb:
    mongo_client = AsyncIOMotorClient(db_config.mongodb.uri)
    mongo_db = mongo_client.get_default_database()

    logger.success("MongoDB async client created")
else:
    mongo_client = None
    mongo_db = None


# ═══════════════════════════════════════════════════════════
# Dependency for FastAPI
# ═══════════════════════════════════════════════════════════

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for FastAPI routes - provides async DB session"""
    if AsyncSessionLocal is None:
        raise RuntimeError("Database not configured for MySQL")

    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_mongo() -> AsyncGenerator:
    """Dependency for FastAPI routes - provides MongoDB database"""
    if mongo_db is None:
        raise RuntimeError("Database not configured for MongoDB")

    try:
        yield mongo_db
    finally:
        pass  # Motor handles connection pooling automatically


__all__ = ["engine", "AsyncSessionLocal", "mongo_client", "mongo_db", "get_db", "get_mongo"]
