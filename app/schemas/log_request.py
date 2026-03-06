from pydantic import BaseModel, Field
from uuid import UUID 
from typing import Optional, Dict, Any 
from datetime import datetime 

from app.domain.enums.log_level import LogLevel


class LogCreateRequest(BaseModel):

    project_id: UUID = Field(..., description="Project this log belongs to")
    trace_id: UUID = Field(..., description="Trace ID for distributed tracing")
    service: str = Field(..., description="Service generating the log")
    level: LogLevel
    message: str
    metadata: Optional[Dict[str, Any]] = None
    timestamp: Optional[datetime] = None