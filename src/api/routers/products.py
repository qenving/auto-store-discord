"""Product API Endpoints"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from src.core.database import get_db
from src.shared.services import ProductService
from src.shared.schemas.product_schemas import ProductResponse, ProductCreate, ProductUpdate

router = APIRouter()


@router.get("/", response_model=List[ProductResponse])
async def list_products(
    active_only: bool = True,
    category: Optional[str] = None,
    search: Optional[str] = None,
    session: AsyncSession = Depends(get_db),
):
    """List all products"""
    product_service = ProductService(session)

    if search:
        products = await product_service.search_products(search, active_only=active_only)
    elif category:
        products = await product_service.get_products_by_category(category, active_only=active_only)
    else:
        products = await product_service.get_all_products(active_only=active_only)

    return products


@router.get("/featured", response_model=List[ProductResponse])
async def get_featured_products(session: AsyncSession = Depends(get_db)):
    """Get featured products"""
    product_service = ProductService(session)
    products = await product_service.get_featured_products()
    return products


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, session: AsyncSession = Depends(get_db)):
    """Get product by ID"""
    product_service = ProductService(session)
    product = await product_service.get_product_by_id(product_id)

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return product


@router.get("/code/{code}", response_model=ProductResponse)
async def get_product_by_code(code: str, session: AsyncSession = Depends(get_db)):
    """Get product by code"""
    product_service = ProductService(session)
    product = await product_service.get_product_by_code(code.upper())

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return product


@router.post("/", response_model=ProductResponse, status_code=201)
async def create_product(product_data: ProductCreate, session: AsyncSession = Depends(get_db)):
    """Create new product"""
    product_service = ProductService(session)

    try:
        product = await product_service.create_product(product_data)
        return product
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int, product_data: ProductUpdate, session: AsyncSession = Depends(get_db)
):
    """Update product"""
    product_service = ProductService(session)

    try:
        product = await product_service.update_product(product_id, product_data)
        return product
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: int, soft_delete: bool = True, session: AsyncSession = Depends(get_db)
):
    """Delete product"""
    product_service = ProductService(session)

    try:
        await product_service.delete_product(product_id, soft_delete=soft_delete)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{product_id}/stock", response_model=ProductResponse)
async def add_stock(
    product_id: int, stock_items: List[str], session: AsyncSession = Depends(get_db)
):
    """Add stock to product"""
    product_service = ProductService(session)

    try:
        product = await product_service.add_stock(product_id, stock_items)
        return product
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{product_id}/stock", status_code=200)
async def remove_unused_stock(product_id: int, session: AsyncSession = Depends(get_db)):
    """Remove all unused stock from product"""
    product_service = ProductService(session)

    try:
        deleted_count = await product_service.remove_unused_stock(product_id)
        return {"deleted_count": deleted_count}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{product_id}/availability", response_model=dict)
async def check_availability(
    product_id: int, quantity: int = Query(1, ge=1), session: AsyncSession = Depends(get_db)
):
    """Check product availability"""
    product_service = ProductService(session)

    is_available = await product_service.check_availability(product_id, quantity)
    available_count = await product_service.get_available_stock_count(product_id)

    return {"available": is_available, "available_count": available_count, "requested": quantity}
