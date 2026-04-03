from uuid import UUID

from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user, get_project_service
from app.data.models.user_model import User
from app.schemas.project import CreateProjectRequest, ProjectResponse
from app.services.project_service import ProjectService

router = APIRouter(prefix="/api/v1/projects", tags=["Projects"])


@router.post("", response_model=ProjectResponse)
async def create_project(
    request: CreateProjectRequest,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    project = await service.create_project(
        name=request.name,
        organization_id=current_user.organization_id,
    )
    return project


@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    return await service.list_projects(current_user.organization_id)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    return await service.get_project(project_id, current_user.organization_id)
