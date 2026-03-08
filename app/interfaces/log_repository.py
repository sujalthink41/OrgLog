from abc import ABC, abstractmethod
from typing import Tuple
from uuid import UUID

from app.domain.log_entry import LogEntry
from app.schemas.log_query import LogQuery


class LogRepository(ABC):

    @abstractmethod
    async def save(self, log_entry: LogEntry):
        pass

    @abstractmethod
    async def search(self, query: LogQuery) -> Tuple[list, int]:
        pass

    @abstractmethod
    async def get_analytics(self, project_id: UUID) -> dict:
        pass
