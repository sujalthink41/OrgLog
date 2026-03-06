import json

import asyncpg

from app.domain.log_entry import LogEntry
from app.interfaces.log_repository import LogRepository


class PostgresLogRepository(LogRepository):

    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool

    async def save(self, log: LogEntry):

        query = """
        INSERT INTO logs (
            project_id,
            trace_id,
            service,
            level,
            message,
            metadata,
            timestamp
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        """
        async with self.pool.acquire() as connection:
            await connection.execute(
                query,
                str(log.project_id),
                str(log.trace_id),
                log.service,
                log.level,
                log.message,
                json.dumps(log.metadata) if log.metadata else None,
                log.timestamp,
            )
