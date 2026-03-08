from uuid import UUID

from sqlalchemy import func, insert, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.models.log_model import Log
from app.domain.log_entry import LogEntry
from app.interfaces.log_repository import LogRepository
from app.schemas.log_query import LogQuery


class PostgresLogRepository(LogRepository):

    def __init__(self, db: AsyncSession):
        self.db = db

    async def save(self, log_entry: LogEntry):
        """
        Save a log entry to the PostgreSQL database using SQLAlchemy.
        """
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

    async def search(self, query: LogQuery):
        """
        Search for log entries based on the provided query parameters.
        """
        stmt = select(Log).where(Log.project_id == query.project_id)

        if query.service:
            stmt = stmt.where(Log.service == query.service)

        if query.level:
            stmt = stmt.where(Log.level == query.level.value)

        if query.start_time:
            stmt = stmt.where(Log.timestamp >= query.start_time)

        if query.end_time:
            stmt = stmt.where(Log.timestamp <= query.end_time)

        if query.search_text:
            stmt = stmt.where(Log.message.ilike(f"%{query.search_text}%"))

        # get total count before pagination
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar()

        # apply pagination and ordering : I run count quert before applying order and pagination to avoid performance issues with count on large datasets
        stmt = stmt.order_by(Log.timestamp.desc())
        stmt = stmt.limit(query.limit).offset(query.offset)

        result = await self.db.execute(stmt)
        logs = result.scalars().all()

        return logs, total

    async def get_analytics(self, project_id):
        """Get analytics for a given project, including total log count, count by level, count by service, and error trends."""
        # 1. Total log count for this project
        total_stmt = (
            select(func.count()).select_from(Log).where(Log.project_id == project_id)
        )
        total = (await self.db.execute(total_stmt)).scalar()

        # 2. Count grouped by level
        level_stmt = (
            select(Log.level, func.count())
            .where(Log.project_id == project_id)
            .group_by(Log.level)
        )
        level_rows = (await self.db.execute(level_stmt)).all()
        logs_by_level = {row[0]: row[1] for row in level_rows}

        # 3. Count grouped by service
        service_stmt = (
            select(Log.service, func.count())
            .where(Log.project_id == project_id)
            .group_by(Log.service)
        )
        service_rows = (await self.db.execute(service_stmt)).all()
        logs_by_service = {row[0]: row[1] for row in service_rows}

        # 4. Error count per minute (last 60 minutes)
        minute_bucket = func.date_trunc("minute", Log.timestamp)
        errors_stmt = (
            select(minute_bucket.label("minute"), func.count().label("count"))
            .where(Log.project_id == project_id)
            .where(Log.level.in_(["ERROR", "CRITICAL"]))
            .group_by(minute_bucket)
            .order_by(minute_bucket)
        )
        error_rows = (await self.db.execute(errors_stmt)).all()
        errors_per_minute = [{"minute": row[0], "count": row[1]} for row in error_rows]

        return {
            "project_id": project_id,
            "total_logs": total,
            "logs_by_level": logs_by_level,
            "logs_by_service": logs_by_service,
            "errors_per_minute": errors_per_minute,
        }
