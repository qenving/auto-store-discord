"""Payment Service - Business logic for payment operations"""

from decimal import Decimal
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession

from src.shared.repositories.payment_repository import PaymentRepository
from src.shared.repositories.user_repository import UserRepository
from src.shared.repositories.order_repository import OrderRepository
from src.shared.models.sql_models import PaymentStatus, OrderStatus
from src.shared.schemas.payment_schemas import PaymentCreate, PaymentResponse
from src.core.exceptions import ValidationError
from loguru import logger


class PaymentService:
    """Service for payment business logic"""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.payment_repo = PaymentRepository(session)
        self.user_repo = UserRepository(session)
        self.order_repo = OrderRepository(session)

    async def get_payment_by_id(self, payment_id: int) -> Optional[PaymentResponse]:
        """Get payment by ID"""
        payment = await self.payment_repo.get_by_id(payment_id)
        if payment:
            return PaymentResponse.model_validate(payment)
        return None

    async def get_payment_by_transaction_id(self, transaction_id: str) -> Optional[PaymentResponse]:
        """Get payment by transaction ID"""
        payment = await self.payment_repo.get_by_transaction_id(transaction_id)
        if payment:
            return PaymentResponse.model_validate(payment)
        return None

    async def get_payment_by_order(self, order_id: int) -> Optional[PaymentResponse]:
        """Get payment for an order"""
        payment = await self.payment_repo.get_by_order(order_id)
        if payment:
            return PaymentResponse.model_validate(payment)
        return None

    async def get_user_payments(self, user_id: int, limit: int = 50) -> List[PaymentResponse]:
        """Get payments for a user"""
        payments = await self.payment_repo.get_by_user(user_id, limit=limit)
        return [PaymentResponse.model_validate(p) for p in payments]

    async def create_payment(
        self,
        discord_id: str,
        amount: Decimal,
        payment_method: str,
        order_id: Optional[int] = None,
    ) -> PaymentResponse:
        """Create new payment request"""
        # Get user
        user = await self.user_repo.get_by_discord_id(discord_id)
        if not user:
            raise ValidationError("User tidak ditemukan")

        if user.is_banned:
            raise ValidationError("Akun Anda telah dibanned")

        if amount <= 0:
            raise ValidationError("Jumlah pembayaran harus lebih dari 0")

        # Validate order if provided
        if order_id:
            order = await self.order_repo.get_by_id(order_id)
            if not order:
                raise ValidationError("Order tidak ditemukan")

            if order.user_id != user.id:
                raise ValidationError("Order bukan milik Anda")

            if order.status == OrderStatus.COMPLETED:
                raise ValidationError("Order sudah selesai")

        # Generate transaction ID
        transaction_id = await self._generate_transaction_id(payment_method)

        # Create payment
        payment_data = PaymentCreate(
            transaction_id=transaction_id,
            user_id=user.id,
            order_id=order_id,
            amount=amount,
            payment_method=payment_method,
            status=PaymentStatus.PENDING,
        )

        payment = await self.payment_repo.create(payment_data)
        logger.info(f"Payment created: {transaction_id} | User: {discord_id} | Amount: Rp{amount:,.0f}")

        return PaymentResponse.model_validate(payment)

    async def process_payment_callback(
        self, transaction_id: str, status: PaymentStatus, external_data: Optional[dict] = None
    ) -> PaymentResponse:
        """Process payment gateway callback"""
        payment = await self.payment_repo.get_by_transaction_id(transaction_id)
        if not payment:
            raise ValidationError(f"Payment dengan transaction ID '{transaction_id}' tidak ditemukan")

        # Update payment status
        payment = await self.payment_repo.update_status(payment, status)

        # If paid, add balance to user or complete order
        if status == PaymentStatus.PAID:
            user = await self.user_repo.get_by_id(payment.user_id)
            if user:
                if payment.order_id:
                    # Payment for order - complete the order
                    order = await self.order_repo.get_by_id(payment.order_id)
                    if order and order.status == OrderStatus.PENDING:
                        await self.order_repo.update_status(order, OrderStatus.PROCESSING)
                        logger.info(f"Order {order.order_number} marked as processing after payment")
                else:
                    # Top-up payment - add balance
                    user.balance += payment.amount
                    await self.session.commit()
                    logger.success(
                        f"Balance added: {user.discord_id} +Rp{payment.amount:,.0f} = Rp{user.balance:,.0f}"
                    )

        logger.info(f"Payment callback processed: {transaction_id} | Status: {status.value}")
        return PaymentResponse.model_validate(payment)

    async def cancel_payment(self, payment_id: int) -> PaymentResponse:
        """Cancel payment"""
        payment = await self.payment_repo.get_by_id(payment_id)
        if not payment:
            raise ValidationError("Payment tidak ditemukan")

        if payment.status == PaymentStatus.PAID:
            raise ValidationError("Payment yang sudah dibayar tidak bisa dibatalkan")

        payment = await self.payment_repo.cancel_payment(payment)
        logger.info(f"Payment cancelled: {payment.transaction_id}")

        return PaymentResponse.model_validate(payment)

    async def expire_old_payments(self, older_than_minutes: int = 30) -> int:
        """Expire pending payments older than specified minutes"""
        pending_payments = await self.payment_repo.get_pending_payments(
            older_than_minutes=older_than_minutes
        )

        expired_count = 0
        for payment in pending_payments:
            await self.payment_repo.expire_payment(payment)
            expired_count += 1

        if expired_count > 0:
            logger.info(f"Expired {expired_count} old pending payments")

        return expired_count

    async def _generate_transaction_id(self, payment_method: str) -> str:
        """Generate unique transaction ID"""
        import random
        import string
        from datetime import datetime

        while True:
            # Format: METHOD-YYYYMMDDHHMMSS-XXXX
            timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
            random_part = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
            transaction_id = f"{payment_method.upper()}-{timestamp}-{random_part}"

            # Check if exists
            existing = await self.payment_repo.get_by_transaction_id(transaction_id)
            if not existing:
                return transaction_id

    # Payment gateway integration methods (to be implemented)
    # These will integrate with Midtrans, Duitku, Tripay, etc.

    async def create_midtrans_payment(
        self, discord_id: str, amount: Decimal, order_id: Optional[int] = None
    ) -> dict:
        """Create Midtrans payment (placeholder for integration)"""
        # TODO: Implement Midtrans API integration
        logger.warning("Midtrans integration not yet implemented")
        payment = await self.create_payment(discord_id, amount, "midtrans", order_id)
        return {"payment_id": payment.id, "transaction_id": payment.transaction_id}

    async def create_duitku_payment(
        self, discord_id: str, amount: Decimal, order_id: Optional[int] = None
    ) -> dict:
        """Create Duitku payment (placeholder for integration)"""
        # TODO: Implement Duitku API integration
        logger.warning("Duitku integration not yet implemented")
        payment = await self.create_payment(discord_id, amount, "duitku", order_id)
        return {"payment_id": payment.id, "transaction_id": payment.transaction_id}

    async def create_tripay_payment(
        self, discord_id: str, amount: Decimal, order_id: Optional[int] = None
    ) -> dict:
        """Create Tripay payment (placeholder for integration)"""
        # TODO: Implement Tripay API integration
        logger.warning("Tripay integration not yet implemented")
        payment = await self.create_payment(discord_id, amount, "tripay", order_id)
        return {"payment_id": payment.id, "transaction_id": payment.transaction_id}
