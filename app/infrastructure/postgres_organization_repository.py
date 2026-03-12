from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.models.organization_model import Organization
from app.interfaces.organization_repository import OrganizationRepository


class PostgresOrganizationRepository(OrganizationRepository):

    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_by_domain(self, domain: str) -> Optional[Organization]:
        result = await self.db.execute(
            select(Organization).where(Organization.domain == domain)
        )
        return result.scalar_one_or_none()

    async def create(self, organization: Organization) -> Organization:
        self.db.add(organization)
        await self.db.flush()
        return organization
