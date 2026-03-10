import json

import redis.asyncio as redis


class RedisPubSub:

    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client

    async def publish(self, project_id: str, log_date: dict):
        channel = f"logs:project:{project_id}"
        await self.redis_client.publish(channel, json.dumps(log_date, default=str))

    async def subscribe(self, project_id: str):
        pubsub = self.redis_client.pubsub()
        channel = f"logs:project:{project_id}"
        await pubsub.subscribe(channel)
        return pubsub
