"""User Repository - Data access layer for users"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from src.shared.models.sql_models import User
from src.shared.schemas.user_schemas import UserCreate, UserUpdate


class UserRepository:
    """Repository for User operations"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        result = await self.session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_discord_id(self, discord_id: str) -> Optional[User]:
        """Get user by Discord ID"""
        result = await self.session.execute(select(User).where(User.discord_id == discord_id))
        return result.scalar_one_or_none()

    async def create(self, user_data: UserCreate) -> User:
        """Create new user"""
        user = User(**user_data.model_dump())
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def update(self, user: User, user_data: UserUpdate) -> User:
        """Update user"""
        update_data = user_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)

        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def delete(self, user: User) -> None:
        """Delete user"""
        await self.session.delete(user)
        await self.session.commit()
