import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.redis import redis_client
from app.infrastructure.redis_pubsub import RedisPubSub

router = APIRouter(prefix="/api/v1", tags=["WebSocket"])


@router.websocket("/ws/{project_id}")
async def websocket_logs(websocket: WebSocket, project_id: str):
    # accept the incoming websocket connection
    await websocket.accept()

    # subscribe to this project's log channel
    pubsub = RedisPubSub(redis_client)
    subscription = await pubsub.subscribe(project_id)

    try:
        # continuously listen for new log messages on the channel
        async for message in subscription.listen():
            # redis sends a subscribe confirmation first, skip it
            if message["type"] != "message":
                continue

            # parse the log data and send it to websocket client
            log_data = json.loads(message["data"])
            await websocket.send_json(log_data)
    except WebSocketDisconnect:
        # client closed the connection, clean up
        pass
    finally:
        # always unsubscribe when done to free redis resources
        await subscription.unsubscribe()
        await subscription.aclose()
