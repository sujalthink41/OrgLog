from uuid import UUID

from fastapi import HTTPException, status

from app.data.models.project_model import Project
from app.interfaces.project_repository import ProjectRepository


class ProjectService:

    def __init__(self, project_repo: ProjectRepository):
        self.project_repo = project_repo

    async def create_project(self, name: str, organization_id: UUID) -> Project:
        """Create a new project under the user's organization."""
        project = Project(name=name, organization_id=organization_id)
        return await self.project_repo.create(project)

    async def list_projects(self, organization_id: UUID) -> list[Project]:
        """List all projects belonging to the user's organization."""
        return await self.project_repo.find_all_by_org_id(organization_id)

    async def get_project(self, project_id: UUID, organization_id: UUID) -> Project:
        """Get a single project, ensuring it belongs to the user's org."""
        project = await self.project_repo.find_by_id_and_org_id(
            project_id, organization_id
        )
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found in your organization",
            )
        return project

    async def get_project_by_id(self, project_id: UUID) -> Project | None:
        """Get a project by ID without org validation (for ingestion endpoints)."""
        return await self.project_repo.find_by_id(project_id)

    async def validate_project_access(
        self, project_id: UUID, organization_id: UUID
    ) -> Project:
        """Validate that a project belongs to the user's organization."""
        project = await self.project_repo.find_by_id_and_org_id(
            project_id, organization_id
        )
        if not project:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this project",
            )
        return project
