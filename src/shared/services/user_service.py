"""User Service - Business logic for user operations"""

from decimal import Decimal
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from src.shared.repositories.user_repository import UserRepository
from src.shared.models.sql_models import User
from src.shared.schemas.user_schemas import UserCreate, UserUpdate, UserResponse
from src.core.exceptions import ValidationError, DatabaseError
from loguru import logger


class UserService:
    """Service for user business logic"""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repo = UserRepository(session)

    async def get_user_by_id(self, user_id: int) -> Optional[UserResponse]:
        """Get user by ID"""
        user = await self.user_repo.get_by_id(user_id)
        if user:
            return UserResponse.model_validate(user)
        return None

    async def get_user_by_discord_id(self, discord_id: str) -> Optional[UserResponse]:
        """Get user by Discord ID"""
        user = await self.user_repo.get_by_discord_id(discord_id)
        if user:
            return UserResponse.model_validate(user)
        return None

    async def get_or_create_user(self, discord_id: str, username: str) -> UserResponse:
        """Get existing user or create new one"""
        # Check if user exists
        user = await self.user_repo.get_by_discord_id(discord_id)

        if user:
            # Update username if changed
            if user.username != username:
                logger.info(f"Updating username for {discord_id}: {user.username} -> {username}")
                user_update = UserUpdate(username=username)
                user = await self.user_repo.update(user, user_update)

            return UserResponse.model_validate(user)

        # Create new user
        logger.info(f"Creating new user: {username} ({discord_id})")
        user_data = UserCreate(discord_id=discord_id, username=username)
        user = await self.user_repo.create(user_data)

        return UserResponse.model_validate(user)

    async def add_balance(self, discord_id: str, amount: Decimal) -> UserResponse:
        """Add balance to user account"""
        if amount <= 0:
            raise ValidationError("Jumlah deposit harus lebih dari 0")

        user = await self.user_repo.get_by_discord_id(discord_id)
        if not user:
            raise ValidationError("User tidak ditemukan")

        if user.is_banned:
            raise ValidationError("Akun Anda telah dibanned")

        # Add balance
        new_balance = user.balance + amount
        user_update = UserUpdate(balance=new_balance)
        user = await self.user_repo.update(user, user_update)

        logger.info(f"Balance added: {discord_id} +{amount} = {new_balance}")
        return UserResponse.model_validate(user)

    async def deduct_balance(self, discord_id: str, amount: Decimal) -> UserResponse:
        """Deduct balance from user account"""
        if amount <= 0:
            raise ValidationError("Jumlah harus lebih dari 0")

        user = await self.user_repo.get_by_discord_id(discord_id)
        if not user:
            raise ValidationError("User tidak ditemukan")

        if user.is_banned:
            raise ValidationError("Akun Anda telah dibanned")

        if user.balance < amount:
            raise ValidationError(
                f"Saldo tidak cukup. Saldo Anda: Rp{user.balance:,.0f}, Dibutuhkan: Rp{amount:,.0f}"
            )

        # Deduct balance
        new_balance = user.balance - amount
        user_update = UserUpdate(balance=new_balance)
        user = await self.user_repo.update(user, user_update)

        logger.info(f"Balance deducted: {discord_id} -{amount} = {new_balance}")
        return UserResponse.model_validate(user)

    async def update_user_stats(
        self, discord_id: str, total_spent: Optional[Decimal] = None, increment_orders: bool = False
    ) -> UserResponse:
        """Update user statistics after purchase"""
        user = await self.user_repo.get_by_discord_id(discord_id)
        if not user:
            raise ValidationError("User tidak ditemukan")

        # Update total spent
        if total_spent is not None:
            user.total_spent += total_spent

        # Increment order count
        if increment_orders:
            user.total_orders += 1

        await self.session.commit()
        await self.session.refresh(user)

        logger.info(
            f"User stats updated: {discord_id} | Total spent: {user.total_spent} | Orders: {user.total_orders}"
        )
        return UserResponse.model_validate(user)

    async def ban_user(self, discord_id: str, is_banned: bool = True) -> UserResponse:
        """Ban or unban user"""
        user = await self.user_repo.get_by_discord_id(discord_id)
        if not user:
            raise ValidationError("User tidak ditemukan")

        user_update = UserUpdate(is_banned=is_banned)
        user = await self.user_repo.update(user, user_update)

        action = "banned" if is_banned else "unbanned"
        logger.warning(f"User {action}: {discord_id}")
        return UserResponse.model_validate(user)

    async def set_admin(self, discord_id: str, is_admin: bool = True) -> UserResponse:
        """Set user admin status"""
        user = await self.user_repo.get_by_discord_id(discord_id)
        if not user:
            raise ValidationError("User tidak ditemukan")

        user_update = UserUpdate(is_admin=is_admin)
        user = await self.user_repo.update(user, user_update)

        action = "granted" if is_admin else "revoked"
        logger.info(f"Admin {action}: {discord_id}")
        return UserResponse.model_validate(user)

    async def check_balance(self, discord_id: str, required_amount: Decimal) -> bool:
        """Check if user has enough balance"""
        user = await self.user_repo.get_by_discord_id(discord_id)
        if not user:
            return False

        return user.balance >= required_amount
