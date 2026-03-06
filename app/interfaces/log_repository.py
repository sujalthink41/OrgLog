from abc import ABC, abstractmethod

from app.domain.log_entry import LogEntry


class LogRepository(ABC):

    @abstractmethod
    async def save(self, log_entry: LogEntry):
        pass
