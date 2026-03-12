from abc import ABC, abstractmethod
from typing import Optional

from app.data.models.organization_model import Organization


class OrganizationRepository(ABC):

    @abstractmethod
    async def find_by_domain(self, domain: str) -> Optional[Organization]:
        pass

    @abstractmethod
    async def create(self, organization: Organization) -> Organization:
        pass
