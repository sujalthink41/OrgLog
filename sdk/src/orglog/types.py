"""OrgLog SDK type definitions."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import UUID, uuid4


@dataclass
class LogEntry:
    """A single log entry to be sent to OrgLog."""

    project_id: str
    service: str
    level: str
    message: str
    trace_id: str = field(default_factory=lambda: str(uuid4()))
    metadata: Optional[Dict[str, Any]] = None
    timestamp: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "project_id": self.project_id,
            "trace_id": self.trace_id,
            "service": self.service,
            "level": self.level,
            "message": self.message,
        }
        if self.metadata is not None:
            payload["metadata"] = self.metadata
        if self.timestamp is not None:
            payload["timestamp"] = self.timestamp
        else:
            payload["timestamp"] = datetime.now(timezone.utc).isoformat()
        return payload
