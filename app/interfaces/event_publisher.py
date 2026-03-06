from abc import ABC, abstractmethod

from app.domain.log_entry import LogEntry

class EventPublisher(ABC):

    @abstractmethod
    async def publish(self, log: LogEntry):
        pass
