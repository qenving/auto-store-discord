"""Payment Repository - Data access layer for payments"""

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from datetime import datetime, timedelta

from src.shared.models.sql_models import Payment, PaymentStatus
from src.shared.schemas.payment_schemas import PaymentCreate


class PaymentRepository:
    """Repository for Payment operations"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, payment_id: int) -> Optional[Payment]:
        """Get payment by ID"""
        result = await self.session.execute(select(Payment).where(Payment.id == payment_id))
        return result.scalar_one_or_none()

    async def get_by_transaction_id(self, transaction_id: str) -> Optional[Payment]:
        """Get payment by transaction ID"""
        result = await self.session.execute(
            select(Payment).where(Payment.transaction_id == transaction_id)
        )
        return result.scalar_one_or_none()

    async def get_by_order(self, order_id: int) -> Optional[Payment]:
        """Get payment for an order"""
        result = await self.session.execute(select(Payment).where(Payment.order_id == order_id))
        return result.scalar_one_or_none()

    async def get_by_user(self, user_id: int, limit: int = 50) -> List[Payment]:
        """Get payments by user"""
        result = await self.session.execute(
            select(Payment)
            .where(Payment.user_id == user_id)
            .order_by(Payment.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_pending_payments(self, older_than_minutes: int = 30) -> List[Payment]:
        """Get pending payments older than specified minutes"""
        cutoff_time = datetime.utcnow() - timedelta(minutes=older_than_minutes)

        result = await self.session.execute(
            select(Payment).where(
                and_(Payment.status == PaymentStatus.PENDING, Payment.created_at < cutoff_time)
            )
        )
        return list(result.scalars().all())

    async def get_recent(self, limit: int = 50, status: Optional[PaymentStatus] = None) -> List[Payment]:
        """Get recent payments"""
        query = select(Payment)

        if status:
            query = query.where(Payment.status == status)

        query = query.order_by(Payment.created_at.desc()).limit(limit)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def create(self, payment_data: PaymentCreate) -> Payment:
        """Create new payment"""
        payment = Payment(**payment_data.model_dump())
        self.session.add(payment)
        await self.session.commit()
        await self.session.refresh(payment)
        return payment

    async def update_status(self, payment: Payment, status: PaymentStatus) -> Payment:
        """Update payment status"""
        payment.status = status
        await self.session.commit()
        await self.session.refresh(payment)
        return payment

    async def update_payment_details(
        self, payment: Payment, payment_url: Optional[str] = None, qr_url: Optional[str] = None
    ) -> Payment:
        """Update payment URLs"""
        if payment_url is not None:
            payment.payment_url = payment_url
        if qr_url is not None:
            payment.qr_url = qr_url

        await self.session.commit()
        await self.session.refresh(payment)
        return payment

    async def mark_as_paid(self, payment: Payment) -> Payment:
        """Mark payment as paid"""
        payment.status = PaymentStatus.PAID
        await self.session.commit()
        await self.session.refresh(payment)
        return payment

    async def cancel_payment(self, payment: Payment) -> Payment:
        """Cancel payment"""
        payment.status = PaymentStatus.CANCELLED
        await self.session.commit()
        await self.session.refresh(payment)
        return payment

    async def expire_payment(self, payment: Payment) -> Payment:
        """Expire payment"""
        payment.status = PaymentStatus.EXPIRED
        await self.session.commit()
        await self.session.refresh(payment)
        return payment

    async def delete(self, payment: Payment) -> None:
        """Delete payment"""
        await self.session.delete(payment)
        await self.session.commit()
