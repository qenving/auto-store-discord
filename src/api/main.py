"""
FastAPI Main Application
Professional async API server with auto-docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from src.core.config import get_settings

# Get settings
settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="Auto-Store API",
    description="Professional Discord Auto-Store Backend API",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # GUI & Web
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Startup event"""
    logger.info("=" * 60)
    logger.info("AUTO-STORE FASTAPI SERVER - STARTING")
    logger.info("=" * 60)
    logger.info(f"Mode: {settings.mode.value}")
    logger.info(f"Database: {settings.database.type.value}")
    logger.success("FastAPI server ready!")
    logger.info("=" * 60)


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event"""
    logger.info("FastAPI server shutting down...")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Auto-Store API",
        "version": "3.0.0",
        "mode": settings.mode.value,
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "database": settings.database.type.value,
        "bot_enabled": settings.is_bot_enabled(),
        "web_enabled": settings.is_web_enabled(),
    }


# TODO: Import and include routers
# from .routers import users, products, orders
# app.include_router(users.router, prefix="/api/users", tags=["users"])
# app.include_router(products.router, prefix="/api/products", tags=["products"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.api.main:app",
        host="0.0.0.0",
        port=settings.website.port if settings.website else 3001,
        reload=True,
        log_level="info",
    )
