"""
Professional Logging System with Loguru
"""

import sys
from pathlib import Path
from loguru import logger

# Remove default handler
logger.remove()

# Add console handler with colors
logger.add(
    sys.stdout,
    colorize=True,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
    "<level>{message}</level>",
    level="INFO",
)

# Add file handler for errors
logger.add(
    Path("logs/error.log"),
    rotation="10 MB",
    retention="30 days",
    level="ERROR",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} | {message}",
)

# Add file handler for all logs
logger.add(
    Path("logs/app.log"),
    rotation="50 MB",
    retention="7 days",
    level="DEBUG",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} | {message}",
)


def get_logger(name: str):
    """Get a logger instance for a module"""
    return logger.bind(name=name)


__all__ = ["logger", "get_logger"]
