import asyncio
import json

from app.core.redis import redis_client
from app.core.constants import LOG_STREAM, LOG_CONSUMER_GROUP
from app.utils.workername import generate_worker_name 

class LogWorker:

    def __init__(self):
        self.consumer_name = generate_worker_name()

    async def start(self):

        await self.create_consumer_group()

        while True:
            messages = await redis_client.xreadgroup(
                groupname=LOG_CONSUMER_GROUP,
                consumername=self.consumer_name,
                streams={LOG_STREAM: ">"},
                count=10,
                block=5000
            )

            if not messages:
                continue

            for stream, events in messages:
                for message_id, data in events:

                    await self.process_event(message_id, data)

    async def create_consumer_group(self):
        try:
            await redis_client.xgroup_create(
                name=LOG_STREAM,
                groupname=LOG_CONSUMER_GROUP,
                id="0",
                mkstream=True
            )
        except Exception:
            pass

    async def process_event(self, message_id, data):

        log_data = json.loads(data["data"])

        print("Processing log:", log_data)

        await redis_client.xack(
            LOG_STREAM,
            LOG_CONSUMER_GROUP,
            message_id
        )


async def main():
    worker = LogWorker()
    await worker.start()


if __name__ == "__main__":
    asyncio.run(main())