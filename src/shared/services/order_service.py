"""Order Service - Business logic for order operations"""

from decimal import Decimal
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from src.shared.repositories.order_repository import OrderRepository, OrderItemRepository
from src.shared.repositories.stock_repository import StockRepository
from src.shared.repositories.product_repository import ProductRepository
from src.shared.repositories.user_repository import UserRepository
from src.shared.models.sql_models import OrderStatus
from src.shared.schemas.order_schemas import OrderCreate, OrderItemCreate, OrderResponse
from src.core.exceptions import ValidationError
from loguru import logger


class OrderService:
    """Service for order business logic"""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.order_repo = OrderRepository(session)
        self.order_item_repo = OrderItemRepository(session)
        self.stock_repo = StockRepository(session)
        self.product_repo = ProductRepository(session)
        self.user_repo = UserRepository(session)

    async def get_order_by_id(self, order_id: int) -> Optional[OrderResponse]:
        """Get order by ID"""
        order = await self.order_repo.get_by_id(order_id)
        if order:
            return OrderResponse.model_validate(order)
        return None

    async def get_order_by_number(self, order_number: str) -> Optional[OrderResponse]:
        """Get order by order number"""
        order = await self.order_repo.get_by_order_number(order_number)
        if order:
            return OrderResponse.model_validate(order)
        return None

    async def get_user_orders(
        self, user_id: int, status: Optional[OrderStatus] = None, limit: int = 50
    ) -> List[OrderResponse]:
        """Get orders for a user"""
        orders = await self.order_repo.get_by_user(user_id, status=status, limit=limit)
        return [OrderResponse.model_validate(o) for o in orders]

    async def get_recent_orders(
        self, limit: int = 50, status: Optional[OrderStatus] = None
    ) -> List[OrderResponse]:
        """Get recent orders"""
        orders = await self.order_repo.get_recent(limit=limit, status=status)
        return [OrderResponse.model_validate(o) for o in orders]

    async def create_order(self, discord_id: str, items: List[OrderItemCreate]) -> OrderResponse:
        """Create new order"""
        # Get user
        user = await self.user_repo.get_by_discord_id(discord_id)
        if not user:
            raise ValidationError("User tidak ditemukan")

        if user.is_banned:
            raise ValidationError("Akun Anda telah dibanned")

        if not items:
            raise ValidationError("Order harus memiliki minimal 1 item")

        # Validate items and calculate total
        total_amount = Decimal("0")
        validated_items = []

        for item in items:
            # Get product
            product = await self.product_repo.get_by_id(item.product_id)
            if not product:
                raise ValidationError(f"Product ID {item.product_id} tidak ditemukan")

            if not product.is_active:
                raise ValidationError(f"Product '{product.name}' tidak tersedia")

            # Check stock
            available = await self.stock_repo.count_available(item.product_id)
            if available < item.quantity:
                raise ValidationError(
                    f"Stok tidak cukup untuk '{product.name}'. Tersedia: {available}, Diminta: {item.quantity}"
                )

            # Calculate price
            unit_price = product.discount_price if product.discount_price else product.price
            item_total = unit_price * item.quantity

            validated_items.append(
                OrderItemCreate(
                    product_id=item.product_id,
                    quantity=item.quantity,
                    unit_price=unit_price,
                    total_price=item_total,
                )
            )

            total_amount += item_total

        # Check user balance
        if user.balance < total_amount:
            raise ValidationError(
                f"Saldo tidak cukup. Saldo Anda: Rp{user.balance:,.0f}, Dibutuhkan: Rp{total_amount:,.0f}"
            )

        # Create order
        order_data = OrderCreate(
            items=validated_items, total_amount=total_amount, final_amount=total_amount
        )

        order = await self.order_repo.create(order_data, user.id)
        logger.info(f"Order created: {order.order_number} for user {discord_id} - Rp{total_amount:,.0f}")

        return OrderResponse.model_validate(order)

    async def process_order(self, order_id: int) -> OrderResponse:
        """Process order - mark as processing"""
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise ValidationError("Order tidak ditemukan")

        if order.status != OrderStatus.PENDING:
            raise ValidationError(f"Order tidak bisa diproses. Status saat ini: {order.status.value}")

        order = await self.order_repo.update_status(order, OrderStatus.PROCESSING)
        logger.info(f"Order processing: {order.order_number}")

        return OrderResponse.model_validate(order)

    async def complete_order(self, order_id: int) -> OrderResponse:
        """Complete order - deliver items and update user stats"""
        order = await self.order_repo.get_by_id(order_id, include_items=True)
        if not order:
            raise ValidationError("Order tidak ditemukan")

        if order.status == OrderStatus.COMPLETED:
            raise ValidationError("Order sudah selesai")

        if order.status == OrderStatus.CANCELLED:
            raise ValidationError("Order sudah dibatalkan")

        # Get user
        user = await self.user_repo.get_by_id(order.user_id)
        if not user:
            raise ValidationError("User tidak ditemukan")

        # Deduct balance
        user.balance -= order.final_amount

        # Deliver items
        for order_item in order.items:
            # Get stock items
            stock_items = await self.stock_repo.get_available_for_product(
                order_item.product_id, limit=order_item.quantity
            )

            if len(stock_items) < order_item.quantity:
                raise ValidationError(f"Stok tidak cukup untuk product ID {order_item.product_id}")

            # Mark stock as used and collect content
            delivered_content = []
            for stock_item in stock_items:
                await self.stock_repo.mark_as_used(stock_item, user.id)
                delivered_content.append(stock_item.content)

            # Update order item with delivered content
            content_str = "\n".join(delivered_content)
            await self.order_item_repo.update_delivered_content(order_item, content_str)

            # Update product stock counts
            product = await self.product_repo.get_by_id(order_item.product_id)
            if product:
                total_stock = await self.stock_repo.count_total(order_item.product_id)
                available_stock = await self.stock_repo.count_available(order_item.product_id)
                await self.product_repo.update_stock(product, total_stock, available_stock)

        # Update user stats
        user.total_spent += order.final_amount
        user.total_orders += 1

        # Complete order
        order = await self.order_repo.update_status(order, OrderStatus.COMPLETED)

        await self.session.commit()

        logger.success(
            f"Order completed: {order.order_number} | User: {user.discord_id} | Amount: Rp{order.final_amount:,.0f}"
        )

        return OrderResponse.model_validate(order)

    async def cancel_order(self, order_id: int, refund: bool = True) -> OrderResponse:
        """Cancel order with optional refund"""
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise ValidationError("Order tidak ditemukan")

        if order.status == OrderStatus.COMPLETED:
            raise ValidationError("Order yang sudah selesai tidak bisa dibatalkan")

        if order.status == OrderStatus.CANCELLED:
            raise ValidationError("Order sudah dibatalkan")

        # Refund if requested
        if refund:
            user = await self.user_repo.get_by_id(order.user_id)
            if user:
                user.balance += order.final_amount
                await self.session.commit()
                logger.info(f"Refunded Rp{order.final_amount:,.0f} to user {user.discord_id}")

        order = await self.order_repo.update_status(order, OrderStatus.CANCELLED)
        logger.info(f"Order cancelled: {order.order_number} (Refund: {refund})")

        return OrderResponse.model_validate(order)

    async def get_order_items_content(self, order_id: int) -> dict:
        """Get delivered content for all items in an order"""
        order = await self.order_repo.get_by_id(order_id, include_items=True)
        if not order:
            raise ValidationError("Order tidak ditemukan")

        if order.status != OrderStatus.COMPLETED:
            raise ValidationError("Order belum selesai")

        result = {}
        for item in order.items:
            product = await self.product_repo.get_by_id(item.product_id)
            if product and item.delivered_content:
                result[product.name] = item.delivered_content.split("\n")

        return result
