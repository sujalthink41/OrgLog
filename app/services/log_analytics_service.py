from uuid import UUID

from app.interfaces.log_repository import LogRepository
from app.schemas.log_analytics import LogAnalyticsResponse


class LogAnalyticsService:

    def __init__(self, repository: LogRepository):
        self.repository = repository

    async def get_analytics(self, project_id: UUID) -> LogAnalyticsResponse:
        data = await self.repository.get_analytics(project_id)
        return LogAnalyticsResponse.model_validate(data)
