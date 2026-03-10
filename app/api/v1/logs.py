from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import (
    get_log_analytics_service,
    get_log_ingestion_service,
    get_log_query_service,
)
from app.domain.enums.log_level import LogLevel
from app.schemas.log_analytics import LogAnalyticsResponse
from app.schemas.log_query import LogQuery
from app.schemas.log_request import LogCreateRequest
from app.schemas.log_response import LogListResponse
from app.services.log_analytics_service import LogAnalyticsService
from app.services.log_ingestion_service import LogIngestionService
from app.services.log_query_service import LogQueryService

router = APIRouter(prefix="/api/v1")


@router.get("/health")
async def health_check():
    return {"status": "ok", "message": "Log Ingestion API is healthy"}


@router.post("/logs")
async def create_log(
    request: LogCreateRequest,
    service: LogIngestionService = Depends(get_log_ingestion_service),
):
    await service.ingest_log(request)
    return {"status": "success", "message": "queued for ingestion"}


@router.get("/logs", response_model=LogListResponse)
async def search_logs(
    project_id: UUID = Query(..., description="Project ID"),
    service: Optional[str] = Query(None, description="Filter by service"),
    level: Optional[LogLevel] = Query(None, description="Filter by level"),
    start_time: Optional[datetime] = Query(None, description="From time"),
    end_time: Optional[datetime] = Query(None, description="To time"),
    search_text: Optional[str] = Query(None, description="Search in message"),
    limit: int = Query(50, ge=1, le=100, description="Max results"),
    offset: int = Query(0, ge=0, description="Skip results"),
    query_service: LogQueryService = Depends(get_log_query_service),
):
    query = LogQuery(
        project_id=project_id,
        service=service,
        level=level,
        start_time=start_time,
        end_time=end_time,
        search_text=search_text,
        limit=limit,
        offset=offset,
    )
    return await query_service.search_logs(query)


@router.get("/logs/analytics", response_model=LogAnalyticsResponse)
async def get_analytics(
    project_id: UUID = Query(..., description="Project ID"),
    analytics_service: LogAnalyticsService = Depends(get_log_analytics_service),
):
    return await analytics_service.get_analytics(project_id)
