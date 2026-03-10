from fastapi import FastAPI

from app.api.v1.logs import router as log_router
from app.api.v1.ws import router as ws_router

app = FastAPI(title="Log Ingestion API", version="1.0.0")

app.include_router(log_router)
app.include_router(ws_router)
