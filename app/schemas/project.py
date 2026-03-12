from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CreateProjectRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Project name")


class ProjectResponse(BaseModel):
    id: UUID
    name: str
    organization_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
