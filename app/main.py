from fastapi import FastAPI
from app.api.v1.logs import router as log_router 

app = FastAPI(title="Log Ingestion API", version="1.0.0")

app.include_router(log_router)