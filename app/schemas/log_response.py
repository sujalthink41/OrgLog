from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.domain.enums.log_level import LogLevel


class LogResponse(BaseModel):
    id: UUID = Field(..., description="The unique identifier of the log entry")
    project_id: UUID = Field(..., description="The ID of the project")
    trace_id: UUID = Field(..., description="The trace ID for distributed tracing")
    service: str = Field(..., description="The service that generated the log")
    level: LogLevel = Field(..., description="The log level")
    message: str = Field(..., description="The log message")
    metadata: Optional[Dict[str, Any]] = Field(
        None, description="Additional metadata", alias="log_metadata"
    )
    timestamp: datetime = Field(..., description="The timestamp of the log")
    created_at: datetime = Field(..., description="When the log was stored")

    class Config:
        from_attributes = True
        populate_by_name = True


class LogListResponse(BaseModel):
    logs: list[LogResponse] = Field(..., description="Log entries matching the query")
    total: int = Field(..., description="Total entries matching the query")
    limit: int = Field(..., description="Max entries returned")
    offset: int = Field(..., description="Entries skipped")
