import json

import redis.asyncio as redis

from app.core.constants import LOG_STREAM
from app.domain.log_entry import LogEntry
from app.interfaces.event_publisher import EventPublisher


class RedisPublisher(EventPublisher):

    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client

    async def publish(self, log: LogEntry):
        payload = json.dumps(log.to_dict(), default=str)
        await self.redis_client.xadd(LOG_STREAM, {"data": payload})
