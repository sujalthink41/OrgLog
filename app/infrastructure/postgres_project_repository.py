from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.models.project_model import Project
from app.interfaces.project_repository import ProjectRepository


class PostgresProjectRepository(ProjectRepository):

    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_by_id(self, project_id: UUID) -> Optional[Project]:
        result = await self.db.execute(select(Project).where(Project.id == project_id))
        return result.scalar_one_or_none()

    async def find_by_id_and_org_id(
        self, project_id: UUID, organization_id: UUID
    ) -> Optional[Project]:
        result = await self.db.execute(
            select(Project).where(
                Project.id == project_id,
                Project.organization_id == organization_id,
            )
        )
        return result.scalar_one_or_none()

    async def find_all_by_org_id(self, organization_id: UUID) -> list[Project]:
        result = await self.db.execute(
            select(Project).where(Project.organization_id == organization_id)
        )
        return list(result.scalars().all())

    async def create(self, project: Project) -> Project:
        self.db.add(project)
        await self.db.flush()
        return project
