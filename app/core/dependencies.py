from app.core.redis import redis_client
from app.infrastructure.redis_publisher import RedisPublisher
from app.services.log_ingestion_service import LogIngestionService


def get_log_ingestion_service() -> LogIngestionService:
    publisher = RedisPublisher(redis_client)
    return LogIngestionService(publisher)
