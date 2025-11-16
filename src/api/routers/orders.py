"""Order API Endpoints"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from src.core.database import get_db
from src.shared.services import OrderService, UserService
from src.shared.schemas.order_schemas import OrderResponse, OrderCreate
from src.shared.models.sql_models import OrderStatus

router = APIRouter()


@router.get("/", response_model=List[OrderResponse])
async def list_orders(
    status: Optional[OrderStatus] = None,
    limit: int = Query(50, le=100),
    session: AsyncSession = Depends(get_db),
):
    """List recent orders"""
    order_service = OrderService(session)
    orders = await order_service.get_recent_orders(limit=limit, status=status)
    return orders


@router.get("/user/{discord_id}", response_model=List[OrderResponse])
async def get_user_orders(
    discord_id: str,
    status: Optional[OrderStatus] = None,
    limit: int = Query(50, le=100),
    session: AsyncSession = Depends(get_db),
):
    """Get orders for a user"""
    user_service = UserService(session)
    order_service = OrderService(session)

    # Get user
    user = await user_service.get_user_by_discord_id(discord_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    orders = await order_service.get_user_orders(user.id, status=status, limit=limit)
    return orders


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: int, session: AsyncSession = Depends(get_db)):
    """Get order by ID"""
    order_service = OrderService(session)
    order = await order_service.get_order_by_id(order_id)

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return order


@router.get("/number/{order_number}", response_model=OrderResponse)
async def get_order_by_number(order_number: str, session: AsyncSession = Depends(get_db)):
    """Get order by order number"""
    order_service = OrderService(session)
    order = await order_service.get_order_by_number(order_number.upper())

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return order


@router.post("/", response_model=OrderResponse, status_code=201)
async def create_order(order_data: OrderCreate, discord_id: str, session: AsyncSession = Depends(get_db)):
    """Create new order"""
    order_service = OrderService(session)

    try:
        order = await order_service.create_order(discord_id, order_data.items)
        return order
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{order_id}/process", response_model=OrderResponse)
async def process_order(order_id: int, session: AsyncSession = Depends(get_db)):
    """Process order"""
    order_service = OrderService(session)

    try:
        order = await order_service.process_order(order_id)
        return order
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{order_id}/complete", response_model=OrderResponse)
async def complete_order(order_id: int, session: AsyncSession = Depends(get_db)):
    """Complete order"""
    order_service = OrderService(session)

    try:
        order = await order_service.complete_order(order_id)
        return order
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(order_id: int, refund: bool = True, session: AsyncSession = Depends(get_db)):
    """Cancel order"""
    order_service = OrderService(session)

    try:
        order = await order_service.cancel_order(order_id, refund=refund)
        return order
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{order_id}/items", response_model=dict)
async def get_order_items(order_id: int, session: AsyncSession = Depends(get_db)):
    """Get delivered items for order"""
    order_service = OrderService(session)

    try:
        items = await order_service.get_order_items_content(order_id)
        return items
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
