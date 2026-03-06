from uuid import UUID
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Optional, Dict, Any

from app.domain.enums.log_level import LogLevel

@dataclass
class LogEntry:
    trace_id: UUID
    service: str 
    level: LogLevel 
    message: str 
    metadata: Optional[Dict[str, Any]]
    timestamp: datetime

    @classmethod
    def from_request(cls, request):
        return cls(
            trace_id=request.trace_id,
            service=request.service,
            level=request.level,
            message=request.message,
            metadata=request.metadata,
            timestamp=request.timestamp or datetime.utcnow()
        )
    
    def to_dict(self):
        return asdict(self)