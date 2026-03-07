from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import UUID

from app.domain.enums.log_level import LogLevel


@dataclass
class LogEntry:
    project_id: UUID
    trace_id: UUID
    service: str
    level: LogLevel
    message: str
    metadata: Optional[Dict[str, Any]]
    timestamp: datetime

    @classmethod
    def from_request(cls, request):
        return cls(
            project_id=request.project_id,
            trace_id=request.trace_id,
            service=request.service,
            level=request.level,
            message=request.message,
            metadata=request.metadata,
            timestamp=request.timestamp or datetime.now(timezone.utc),
        )

    @classmethod
    def from_dict(cls, data: dict) -> "LogEntry":
        return cls(
            project_id=UUID(data["project_id"]),
            trace_id=UUID(data["trace_id"]),
            service=data["service"],
            level=LogLevel(data["level"]),
            message=data["message"],
            metadata=data.get("metadata"),
            timestamp=datetime.fromisoformat(data["timestamp"]),
        )

    def to_dict(self):
        return asdict(self)
