"""Order Repository - Data access layer for orders"""

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime, timedelta

from src.shared.models.sql_models import Order, OrderItem, OrderStatus
from src.shared.schemas.order_schemas import OrderCreate, OrderItemCreate


class OrderRepository:
    """Repository for Order operations"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, order_id: int, include_items: bool = True) -> Optional[Order]:
        """Get order by ID with optional items"""
        query = select(Order).where(Order.id == order_id)
        if include_items:
            query = query.options(selectinload(Order.items))

        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_order_number(self, order_number: str, include_items: bool = True) -> Optional[Order]:
        """Get order by order number"""
        query = select(Order).where(Order.order_number == order_number)
        if include_items:
            query = query.options(selectinload(Order.items))

        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_user(
        self, user_id: int, status: Optional[OrderStatus] = None, limit: int = 50
    ) -> List[Order]:
        """Get orders by user with optional status filter"""
        query = select(Order).where(Order.user_id == user_id)

        if status:
            query = query.where(Order.status == status)

        query = query.options(selectinload(Order.items)).order_by(Order.created_at.desc()).limit(limit)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_recent(self, limit: int = 50, status: Optional[OrderStatus] = None) -> List[Order]:
        """Get recent orders"""
        query = select(Order)

        if status:
            query = query.where(Order.status == status)

        query = query.options(selectinload(Order.items)).order_by(Order.created_at.desc()).limit(limit)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_pending_orders(self, older_than_minutes: int = 30) -> List[Order]:
        """Get pending orders older than specified minutes"""
        cutoff_time = datetime.utcnow() - timedelta(minutes=older_than_minutes)

        result = await self.session.execute(
            select(Order)
            .where(and_(Order.status == OrderStatus.PENDING, Order.created_at < cutoff_time))
            .options(selectinload(Order.items))
        )
        return list(result.scalars().all())

    async def create(self, order_data: OrderCreate, user_id: int) -> Order:
        """Create new order with items"""
        # Generate order number
        order_number = await self._generate_order_number()

        # Create order
        order = Order(
            order_number=order_number,
            user_id=user_id,
            total_amount=order_data.total_amount,
            final_amount=order_data.final_amount,
            status=OrderStatus.PENDING,
        )
        self.session.add(order)
        await self.session.flush()  # Get order ID without committing

        # Create order items
        for item_data in order_data.items:
            order_item = OrderItem(
                order_id=order.id,
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                total_price=item_data.total_price,
            )
            self.session.add(order_item)

        await self.session.commit()
        await self.session.refresh(order)

        # Load items
        await self.session.execute(
            select(Order).where(Order.id == order.id).options(selectinload(Order.items))
        )
        await self.session.refresh(order)

        return order

    async def update_status(self, order: Order, status: OrderStatus) -> Order:
        """Update order status"""
        order.status = status
        await self.session.commit()
        await self.session.refresh(order)
        return order

    async def complete_order(self, order: Order) -> Order:
        """Mark order as completed"""
        order.status = OrderStatus.COMPLETED
        await self.session.commit()
        await self.session.refresh(order)
        return order

    async def cancel_order(self, order: Order) -> Order:
        """Cancel order"""
        order.status = OrderStatus.CANCELLED
        await self.session.commit()
        await self.session.refresh(order)
        return order

    async def delete(self, order: Order) -> None:
        """Delete order (cascade will delete items)"""
        await self.session.delete(order)
        await self.session.commit()

    async def _generate_order_number(self) -> str:
        """Generate unique order number"""
        import random
        import string

        while True:
            # Format: ORD-YYYYMMDD-XXXX
            date_part = datetime.utcnow().strftime("%Y%m%d")
            random_part = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
            order_number = f"ORD-{date_part}-{random_part}"

            # Check if exists
            result = await self.session.execute(
                select(Order).where(Order.order_number == order_number)
            )
            if result.scalar_one_or_none() is None:
                return order_number


class OrderItemRepository:
    """Repository for OrderItem operations"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, item_id: int) -> Optional[OrderItem]:
        """Get order item by ID"""
        result = await self.session.execute(select(OrderItem).where(OrderItem.id == item_id))
        return result.scalar_one_or_none()

    async def get_by_order(self, order_id: int) -> List[OrderItem]:
        """Get all items for an order"""
        result = await self.session.execute(
            select(OrderItem).where(OrderItem.order_id == order_id).order_by(OrderItem.id.asc())
        )
        return list(result.scalars().all())

    async def update_delivered_content(self, item: OrderItem, content: str) -> OrderItem:
        """Update delivered content for order item"""
        item.delivered_content = content
        await self.session.commit()
        await self.session.refresh(item)
        return item
