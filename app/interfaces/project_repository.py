from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from app.data.models.project_model import Project


class ProjectRepository(ABC):

    @abstractmethod
    async def find_by_id(self, project_id: UUID) -> Optional[Project]:
        pass

    @abstractmethod
    async def find_by_id_and_org_id(
        self, project_id: UUID, organization_id: UUID
    ) -> Optional[Project]:
        pass

    @abstractmethod
    async def find_all_by_org_id(self, organization_id: UUID) -> list[Project]:
        pass

    @abstractmethod
    async def create(self, project: Project) -> Project:
        pass
