"""User API Endpoints"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal

from src.core.database import get_db
from src.shared.services import UserService
from src.shared.schemas.user_schemas import UserResponse, UserCreate, UserUpdate

router = APIRouter()


@router.get("/{discord_id}", response_model=UserResponse)
async def get_user(discord_id: str, session: AsyncSession = Depends(get_db)):
    """Get user by Discord ID"""
    user_service = UserService(session)
    user = await user_service.get_user_by_discord_id(discord_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.post("/", response_model=UserResponse, status_code=201)
async def create_user(user_data: UserCreate, session: AsyncSession = Depends(get_db)):
    """Create new user"""
    user_service = UserService(session)

    # Check if user already exists
    existing = await user_service.get_user_by_discord_id(user_data.discord_id)
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    user = await user_service.get_or_create_user(user_data.discord_id, user_data.username)
    return user


@router.patch("/{discord_id}", response_model=UserResponse)
async def update_user(
    discord_id: str, user_data: UserUpdate, session: AsyncSession = Depends(get_db)
):
    """Update user"""
    user_service = UserService(session)
    user = await user_service.get_user_by_discord_id(discord_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Use repository directly for update
    from src.shared.repositories.user_repository import UserRepository
    from src.shared.models.sql_models import User

    user_repo = UserRepository(session)
    db_user = await user_repo.get_by_discord_id(discord_id)
    if db_user:
        updated_user = await user_repo.update(db_user, user_data)
        return UserResponse.model_validate(updated_user)

    raise HTTPException(status_code=404, detail="User not found")


@router.post("/{discord_id}/balance/add", response_model=UserResponse)
async def add_balance(discord_id: str, amount: Decimal, session: AsyncSession = Depends(get_db)):
    """Add balance to user"""
    user_service = UserService(session)

    try:
        user = await user_service.add_balance(discord_id, amount)
        return user
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{discord_id}/balance/deduct", response_model=UserResponse)
async def deduct_balance(discord_id: str, amount: Decimal, session: AsyncSession = Depends(get_db)):
    """Deduct balance from user"""
    user_service = UserService(session)

    try:
        user = await user_service.deduct_balance(discord_id, amount)
        return user
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{discord_id}/ban", response_model=UserResponse)
async def ban_user(discord_id: str, is_banned: bool = True, session: AsyncSession = Depends(get_db)):
    """Ban or unban user"""
    user_service = UserService(session)

    try:
        user = await user_service.ban_user(discord_id, is_banned)
        return user
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{discord_id}/admin", response_model=UserResponse)
async def set_admin(discord_id: str, is_admin: bool = True, session: AsyncSession = Depends(get_db)):
    """Set user admin status"""
    user_service = UserService(session)

    try:
        user = await user_service.set_admin(discord_id, is_admin)
        return user
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
