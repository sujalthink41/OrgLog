from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.domain.enums.log_level import LogLevel


class LogQuery(BaseModel):
    project_id: UUID = Field(..., description="The ID of the project to query logs for")
    service: Optional[str] = Field(
        None, description="The name of the service to filter logs by"
    )
    level: Optional[LogLevel] = Field(
        None, description="The log level to filter logs by (e.g., INFO, ERROR)"
    )
    start_time: Optional[datetime] = Field(
        None, description="The start time for the log query"
    )
    end_time: Optional[datetime] = Field(
        None, description="The end time for the log query"
    )
    search_text: Optional[str] = Field(
        None, description="Text to search for in the logs"
    )
    limit: int = Field(
        50, ge=1, le=100, description="The maximum number of log entries to return"
    )
    offset: int = Field(
        0,
        ge=0,
        description="The number of log entries to skip before starting to return results",
    )
