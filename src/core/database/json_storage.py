"""
Local JSON Storage - File-based database alternative
Simple JSON-based storage for development & small-scale deployments
"""

import json
import asyncio
from pathlib import Path
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime
from decimal import Decimal
from loguru import logger


class JSONEncoder(json.JSONEncoder):
    """Custom JSON encoder for Decimal and datetime"""

    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


class JSONStorage:
    """
    Async JSON file storage
    Thread-safe with file locking
    """

    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self._locks: Dict[str, asyncio.Lock] = {}
        logger.info(f"JSON Storage initialized at: {self.data_dir.absolute()}")

    def _get_lock(self, collection: str) -> asyncio.Lock:
        """Get or create lock for collection"""
        if collection not in self._locks:
            self._locks[collection] = asyncio.Lock()
        return self._locks[collection]

    def _get_file_path(self, collection: str) -> Path:
        """Get file path for collection"""
        return self.data_dir / f"{collection}.json"

    async def _read_file(self, collection: str) -> List[Dict[str, Any]]:
        """Read data from JSON file"""
        file_path = self._get_file_path(collection)

        if not file_path.exists():
            return []

        loop = asyncio.get_event_loop()
        data = await loop.run_in_executor(None, self._read_file_sync, file_path)
        return data

    def _read_file_sync(self, file_path: Path) -> List[Dict[str, Any]]:
        """Synchronous file read"""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError:
            logger.error(f"JSON decode error in {file_path}, returning empty list")
            return []
        except Exception as e:
            logger.error(f"Error reading {file_path}: {e}")
            return []

    async def _write_file(self, collection: str, data: List[Dict[str, Any]]) -> None:
        """Write data to JSON file"""
        file_path = self._get_file_path(collection)

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._write_file_sync, file_path, data)

    def _write_file_sync(self, file_path: Path, data: List[Dict[str, Any]]) -> None:
        """Synchronous file write"""
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False, cls=JSONEncoder)
        except Exception as e:
            logger.error(f"Error writing {file_path}: {e}")
            raise

    async def find_all(self, collection: str, filter_func: Optional[Callable] = None) -> List[Dict[str, Any]]:
        """Find all documents matching filter"""
        async with self._get_lock(collection):
            data = await self._read_file(collection)

            if filter_func:
                return [item for item in data if filter_func(item)]

            return data

    async def find_one(self, collection: str, filter_func: Callable) -> Optional[Dict[str, Any]]:
        """Find first document matching filter"""
        async with self._get_lock(collection):
            data = await self._read_file(collection)

            for item in data:
                if filter_func(item):
                    return item

            return None

    async def find_by_id(self, collection: str, doc_id: int) -> Optional[Dict[str, Any]]:
        """Find document by ID"""
        return await self.find_one(collection, lambda x: x.get("id") == doc_id)

    async def insert(self, collection: str, document: Dict[str, Any]) -> Dict[str, Any]:
        """Insert new document"""
        async with self._get_lock(collection):
            data = await self._read_file(collection)

            # Auto-generate ID
            if "id" not in document:
                max_id = max([item.get("id", 0) for item in data], default=0)
                document["id"] = max_id + 1

            # Add timestamps
            now = datetime.utcnow().isoformat()
            if "created_at" not in document:
                document["created_at"] = now
            if "updated_at" not in document:
                document["updated_at"] = now

            data.append(document)
            await self._write_file(collection, data)

            logger.debug(f"Inserted document to {collection}: ID {document['id']}")
            return document

    async def update(
        self, collection: str, filter_func: Callable, update_data: Dict[str, Any]
    ) -> int:
        """Update documents matching filter"""
        async with self._get_lock(collection):
            data = await self._read_file(collection)
            updated_count = 0

            for item in data:
                if filter_func(item):
                    item.update(update_data)
                    item["updated_at"] = datetime.utcnow().isoformat()
                    updated_count += 1

            if updated_count > 0:
                await self._write_file(collection, data)
                logger.debug(f"Updated {updated_count} documents in {collection}")

            return updated_count

    async def update_one(
        self, collection: str, filter_func: Callable, update_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update first document matching filter"""
        async with self._get_lock(collection):
            data = await self._read_file(collection)

            for item in data:
                if filter_func(item):
                    item.update(update_data)
                    item["updated_at"] = datetime.utcnow().isoformat()
                    await self._write_file(collection, data)
                    logger.debug(f"Updated document in {collection}: ID {item.get('id')}")
                    return item

            return None

    async def delete(self, collection: str, filter_func: Callable) -> int:
        """Delete documents matching filter"""
        async with self._get_lock(collection):
            data = await self._read_file(collection)
            original_len = len(data)

            data = [item for item in data if not filter_func(item)]
            deleted_count = original_len - len(data)

            if deleted_count > 0:
                await self._write_file(collection, data)
                logger.debug(f"Deleted {deleted_count} documents from {collection}")

            return deleted_count

    async def delete_by_id(self, collection: str, doc_id: int) -> bool:
        """Delete document by ID"""
        deleted = await self.delete(collection, lambda x: x.get("id") == doc_id)
        return deleted > 0

    async def count(self, collection: str, filter_func: Optional[Callable] = None) -> int:
        """Count documents matching filter"""
        data = await self.find_all(collection, filter_func)
        return len(data)

    async def clear_collection(self, collection: str) -> None:
        """Clear all data from collection"""
        async with self._get_lock(collection):
            await self._write_file(collection, [])
            logger.warning(f"Cleared collection: {collection}")


# Global JSON storage instance
_json_storage: Optional[JSONStorage] = None


def get_json_storage(data_dir: str = "data") -> JSONStorage:
    """Get or create JSON storage instance"""
    global _json_storage

    if _json_storage is None:
        _json_storage = JSONStorage(data_dir)

    return _json_storage
