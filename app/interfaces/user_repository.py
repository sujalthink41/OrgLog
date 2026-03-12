from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from app.data.models.user_model import User


class UserRepository(ABC):

    @abstractmethod
    async def find_by_email(self, email: str) -> Optional[User]:
        pass

    @abstractmethod
    async def find_by_id(self, user_id: UUID) -> Optional[User]:
        pass

    @abstractmethod
    async def create(self, user: User) -> User:
        pass
