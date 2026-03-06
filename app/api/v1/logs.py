from fastapi import APIRouter, Depends 

from app.core.dependencies import get_log_ingestion_service
from app.services.log_ingestion_service import LogIngestionService
from app.schemas.log_request import LogCreateRequest

router = APIRouter(prefix="/api/v1")

@router.post("/logs")
async def create_log(
    request: LogCreateRequest,
    service: LogIngestionService = Depends(get_log_ingestion_service)
):
    await service.ingest_log(request)
    return {
        "status": "success", 
        "message": "queued for ingestion"
    }
