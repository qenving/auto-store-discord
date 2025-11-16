"""Payment API Endpoints"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from decimal import Decimal

from src.core.database import get_db
from src.shared.services import PaymentService, UserService
from src.shared.schemas.payment_schemas import PaymentResponse, PaymentCreate
from src.shared.models.sql_models import PaymentStatus

router = APIRouter()


@router.get("/", response_model=List[PaymentResponse])
async def list_payments(
    status: Optional[PaymentStatus] = None,
    limit: int = Query(50, le=100),
    session: AsyncSession = Depends(get_db),
):
    """List recent payments"""
    payment_service = PaymentService(session)
    payments = await payment_service.payment_repo.get_recent(limit=limit, status=status)
    return [PaymentResponse.model_validate(p) for p in payments]


@router.get("/user/{discord_id}", response_model=List[PaymentResponse])
async def get_user_payments(
    discord_id: str, limit: int = Query(50, le=100), session: AsyncSession = Depends(get_db)
):
    """Get payments for a user"""
    user_service = UserService(session)
    payment_service = PaymentService(session)

    # Get user
    user = await user_service.get_user_by_discord_id(discord_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    payments = await payment_service.get_user_payments(user.id, limit=limit)
    return payments


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(payment_id: int, session: AsyncSession = Depends(get_db)):
    """Get payment by ID"""
    payment_service = PaymentService(session)
    payment = await payment_service.get_payment_by_id(payment_id)

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    return payment


@router.get("/transaction/{transaction_id}", response_model=PaymentResponse)
async def get_payment_by_transaction_id(transaction_id: str, session: AsyncSession = Depends(get_db)):
    """Get payment by transaction ID"""
    payment_service = PaymentService(session)
    payment = await payment_service.get_payment_by_transaction_id(transaction_id)

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    return payment


@router.post("/", response_model=PaymentResponse, status_code=201)
async def create_payment(
    discord_id: str,
    amount: Decimal,
    payment_method: str,
    order_id: Optional[int] = None,
    session: AsyncSession = Depends(get_db),
):
    """Create new payment"""
    payment_service = PaymentService(session)

    try:
        payment = await payment_service.create_payment(discord_id, amount, payment_method, order_id)
        return payment
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{payment_id}/cancel", response_model=PaymentResponse)
async def cancel_payment(payment_id: int, session: AsyncSession = Depends(get_db)):
    """Cancel payment"""
    payment_service = PaymentService(session)

    try:
        payment = await payment_service.cancel_payment(payment_id)
        return payment
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/callback", response_model=PaymentResponse)
async def payment_callback(
    transaction_id: str, status: PaymentStatus, session: AsyncSession = Depends(get_db)
):
    """Payment gateway callback"""
    payment_service = PaymentService(session)

    try:
        payment = await payment_service.process_payment_callback(transaction_id, status)
        return payment
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Payment gateway specific endpoints
@router.post("/midtrans", response_model=dict)
async def create_midtrans_payment(
    discord_id: str,
    amount: Decimal,
    order_id: Optional[int] = None,
    session: AsyncSession = Depends(get_db),
):
    """Create Midtrans payment"""
    payment_service = PaymentService(session)

    try:
        result = await payment_service.create_midtrans_payment(discord_id, amount, order_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/duitku", response_model=dict)
async def create_duitku_payment(
    discord_id: str,
    amount: Decimal,
    order_id: Optional[int] = None,
    session: AsyncSession = Depends(get_db),
):
    """Create Duitku payment"""
    payment_service = PaymentService(session)

    try:
        result = await payment_service.create_duitku_payment(discord_id, amount, order_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/tripay", response_model=dict)
async def create_tripay_payment(
    discord_id: str,
    amount: Decimal,
    order_id: Optional[int] = None,
    session: AsyncSession = Depends(get_db),
):
    """Create Tripay payment"""
    payment_service = PaymentService(session)

    try:
        result = await payment_service.create_tripay_payment(discord_id, amount, order_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
