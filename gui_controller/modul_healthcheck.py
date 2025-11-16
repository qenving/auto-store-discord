"""
Health Check Module
Monitor system health and connectivity
"""

import time
import requests
import asyncio
from pathlib import Path
from typing import Dict

from .utils import log_event


class HealthMonitor:
    """Monitor system health"""

    def __init__(self, bot_controller, api_controller):
        self.bot_controller = bot_controller
        self.api_controller = api_controller

        self.last_ping = 999
        self.last_check_time = 0

    def get_ping(self) -> int:
        """Get network ping (ms)"""
        try:
            # Ping localhost API
            start = time.time()
            response = requests.get("http://localhost:3001/health", timeout=1)
            end = time.time()

            if response.status_code == 200:
                self.last_ping = int((end - start) * 1000)
            else:
                self.last_ping = 999

        except:
            self.last_ping = 999

        return self.last_ping

    def get_health(self) -> Dict[str, any]:
        """Get overall health status"""
        health_data = {
            "overall": "unknown",
            "database": "unknown",
            "config": "unknown",
            "network": "unknown",
            "stats": {}
        }

        try:
            # Check config
            config_path = Path("config.json")
            if config_path.exists():
                health_data["config"] = "healthy"
            else:
                health_data["config"] = "warning"

            # Check database
            health_data["database"] = self._check_database()

            # Check network
            if self.last_ping < 100:
                health_data["network"] = "healthy"
            elif self.last_ping < 500:
                health_data["network"] = "warning"
            else:
                health_data["network"] = "error"

            # Get statistics
            health_data["stats"] = self._get_stats()

            # Overall health
            if all(v == "healthy" for v in [health_data["config"], health_data["database"], health_data["network"]]):
                health_data["overall"] = "healthy"
            elif any(v == "error" for v in [health_data["config"], health_data["database"], health_data["network"]]):
                health_data["overall"] = "error"
            else:
                health_data["overall"] = "warning"

        except Exception as e:
            log_event("Health", f"Health check error: {e}", "ERROR")
            health_data["overall"] = "error"

        return health_data

    def _check_database(self) -> str:
        """Check database health"""
        try:
            # Check if database files/connections exist
            from src.core.config import get_settings

            settings = get_settings()
            db_type = settings.database.type.value

            if db_type == "local_json":
                # Check if data directory exists
                data_path = Path(settings.database.local_json.path if settings.database.local_json else "data")
                if data_path.exists():
                    return "healthy"
                else:
                    return "warning"

            elif db_type == "mysql":
                # Try to import database engine
                from src.core.database import engine
                if engine:
                    return "healthy"
                else:
                    return "error"

            elif db_type == "mongodb":
                # Try to import mongo client
                from src.core.database import mongo_client
                if mongo_client:
                    return "healthy"
                else:
                    return "error"

            return "unknown"

        except Exception as e:
            return "error"

    def _get_stats(self) -> Dict[str, any]:
        """Get system statistics"""
        stats = {
            "users": "--",
            "products": "--",
            "orders": "--",
            "sales": "--"
        }

        try:
            # Try to get stats from database
            from src.core.config import get_settings

            settings = get_settings()
            db_type = settings.database.type.value

            if db_type == "local_json":
                # Count from JSON files
                from src.core.database import json_storage

                if json_storage:
                    # Run async count
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)

                    users = loop.run_until_complete(json_storage.count("users"))
                    products = loop.run_until_complete(json_storage.count("products"))
                    orders = loop.run_until_complete(json_storage.count("orders"))

                    loop.close()

                    stats["users"] = users
                    stats["products"] = products
                    stats["orders"] = orders
                    stats["sales"] = "0"  # Would need to calculate

            elif db_type == "mysql":
                # Query MySQL
                # This would require async code, simplified for now
                pass

        except Exception as e:
            log_event("Health", f"Stats error: {e}", "DEBUG")

        return stats
