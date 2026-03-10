import asyncio
import json
import logging

from redis.exceptions import ResponseError

from app.core.constants import LOG_CONSUMER_GROUP, LOG_STREAM
from app.core.redis import redis_client
from app.data.database.session import AsyncSessionLocal
from app.domain.log_entry import LogEntry
from app.infrastructure.postgres_log_repository import PostgresLogRepository
from app.infrastructure.redis_pubsub import RedisPubSub
from app.utils.workername import generate_worker_name

logger = logging.getLogger(__name__)


class LogWorker:

    def __init__(self):
        self.consumer_name = generate_worker_name()
        # pubsub broadcaster to push logs to websocket clients
        self.pubsub = RedisPubSub(redis_client=redis_client)

    async def start(self):
        await self.create_consumer_group()
        logger.info(f"Worker {self.consumer_name} started")

        while True:
            messages = await redis_client.xreadgroup(
                groupname=LOG_CONSUMER_GROUP,
                consumername=self.consumer_name,
                streams={LOG_STREAM: ">"},
                count=10,
                block=5000,
            )

            if not messages:
                continue

            for stream, events in messages:
                for message_id, data in events:
                    await self.process_event(message_id, data)

    async def create_consumer_group(self):
        try:
            await redis_client.xgroup_create(
                name=LOG_STREAM, groupname=LOG_CONSUMER_GROUP, id="0", mkstream=True
            )
        except ResponseError as e:
            # BUSYGROUP means group already exists, safe to ignore
            if "BUSYGROUP" not in str(e):
                raise

    async def process_event(self, message_id, data):
        try:
            log_data = json.loads(data["data"])
            log_entry = LogEntry.from_dict(log_data)

            # save to postgres
            async with AsyncSessionLocal() as session:
                repo = PostgresLogRepository(session)
                await repo.save(log_entry)
                await session.commit()

            # broadcast to websocket clients via pub/sub
            await self.pubsub.publish(str(log_entry.project_id), log_data)

            # acknowledge message so redis doesn't redeliver it
            await redis_client.xack(LOG_STREAM, LOG_CONSUMER_GROUP, message_id)
            logger.info(f"Processed log: {message_id}")
        except Exception:
            logger.exception(f"Failed to process message: {message_id}")


async def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    worker = LogWorker()
    await worker.start()


if __name__ == "__main__":
    asyncio.run(main())
