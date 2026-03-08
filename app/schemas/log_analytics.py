from datetime import datetime
from typing import Dict, List
from uuid import UUID

from pydantic import BaseModel, Field


class ErrorPerMinute(BaseModel):
    minute: datetime = Field(..., description="The minute bucket")
    count: int = Field(..., description="Number of errors in this minute")


class LogAnalyticsResponse(BaseModel):
    project_id: UUID = Field(..., description="The ID of the project")
    total_logs: int = Field(..., description="Total log count")
    logs_by_level: Dict[str, int] = Field(..., description="Count per log level")
    logs_by_service: Dict[str, int] = Field(..., description="Count per service")
    errors_per_minute: List[ErrorPerMinute] = Field(
        ..., description="Error counts per minute"
    )

    class Config:
        from_attributes = True
