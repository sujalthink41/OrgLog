from app.domain.log_entry import LogEntry
from app.interfaces.event_publisher import EventPublisher
from app.schemas.log_request import LogCreateRequest

class LogIngestionService: 

    def __init__(self, publisher: EventPublisher):
        self.publisher = publisher

    async def ingest_log(self, request: LogCreateRequest):
        log_entry = LogEntry.from_request(request)
        await self.publisher.publish(log_entry)