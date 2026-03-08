from app.interfaces.log_repository import LogRepository
from app.schemas.log_query import LogQuery
from app.schemas.log_response import LogListResponse, LogResponse


class LogQueryService:
    def __init__(self, repository: LogRepository):
        self.repository = repository

    async def search_logs(self, query: LogQuery) -> LogListResponse:
        """Search logs based on the provided query parameters."""
        logs, total = await self.repository.search(query)

        return LogListResponse(
            logs=[LogResponse.model_validate(log) for log in logs],
            total=total,
            offset=query.offset,
            limit=query.limit,
        )
