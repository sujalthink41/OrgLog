from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.dependencies import get_log_ingestion_service, get_project_service
from app.core.security import decode_token
from app.schemas.log_request import LogCreateRequest
from app.services.log_ingestion_service import LogIngestionService
from app.services.project_service import ProjectService

router = APIRouter(prefix="/api/v1")
bearer_scheme = HTTPBearer()


@router.post("/ingest")
async def ingest_log(
    request: LogCreateRequest,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    service: LogIngestionService = Depends(get_log_ingestion_service),
    project_service: ProjectService = Depends(get_project_service),
):
    """
    Public log ingestion endpoint for external services.

    Authenticates via JWT Bearer token and validates the project exists.
    This is the endpoint SDKs and integrations should use to push logs.
    """
    # validate the token
    try:
        decode_token(credentials.credentials)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    # validate the project exists
    project = await project_service.get_project_by_id(request.project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    await service.ingest_log(request)
    return {"status": "success", "message": "queued for ingestion"}
