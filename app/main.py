import asyncio
import logging
import subprocess
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.auth import router as auth_router
from app.api.v1.ingest import router as ingest_router
from app.api.v1.logs import router as log_router
from app.api.v1.projects import router as project_router
from app.api.v1.ws import router as ws_router
from app.core.config import settings
from app.workers.log_worker import LogWorker

logger = logging.getLogger(__name__)


def run_migrations():
    """Run alembic migrations on startup."""
    try:
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
        )
        if result.returncode == 0:
            logger.info("Database migrations completed successfully")
        else:
            logger.error(f"Migration failed: {result.stderr}")
    except Exception:
        logger.exception("Failed to run migrations")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run database migrations automatically
    run_migrations()
    # Start the log worker as a background task inside the API process
    worker = LogWorker()
    worker_task = asyncio.create_task(worker.start())
    logger.info("Log worker started as background task")
    yield
    worker_task.cancel()
    logger.info("Log worker stopped")


app = FastAPI(title="OrgLog API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.ALLOWED_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(ingest_router)
app.include_router(project_router)
app.include_router(log_router)
app.include_router(ws_router)
