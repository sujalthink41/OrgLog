from fastapi.params import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import redis_client
from app.data.database.session import get_async_session
from app.infrastructure.postgres_log_repository import PostgresLogRepository
from app.infrastructure.redis_publisher import RedisPublisher
from app.services.log_analytics_service import LogAnalyticsService
from app.services.log_ingestion_service import LogIngestionService
from app.services.log_query_service import LogQueryService


def get_log_ingestion_service() -> LogIngestionService:
    publisher = RedisPublisher(redis_client)
    return LogIngestionService(publisher)


async def get_log_query_service(
    session: AsyncSession = Depends(get_async_session),
) -> LogQueryService:
    repository = PostgresLogRepository(session)
    return LogQueryService(repository)


async def get_log_analytics_service(
    session: AsyncSession = Depends(get_async_session),
) -> LogAnalyticsService:
    repository = PostgresLogRepository(session)
    return LogAnalyticsService(repository)
