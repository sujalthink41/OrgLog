from sqlalchemy import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.models.log_model import Log
from app.domain.log_entry import LogEntry
from app.interfaces.log_repository import LogRepository


class PostgresLogRepository(LogRepository):

    def __init__(self, db: AsyncSession):
        self.db = db

    async def save(self, log_entry: LogEntry):
        stmt = insert(Log).values(
            project_id=log_entry.project_id,
            trace_id=log_entry.trace_id,
            service=log_entry.service,
            level=log_entry.level.value,
            message=log_entry.message,
            log_metadata=log_entry.metadata,
            timestamp=log_entry.timestamp,
        )

        await self.db.execute(stmt)
        await self.db.commit()
