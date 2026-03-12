from uuid import UUID

from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full name")
    email_prefix: str = Field(
        ...,
        min_length=2,
        max_length=50,
        description="Email prefix (before @)",
        pattern=r"^[a-zA-Z0-9._-]+$",
    )
    password: str = Field(..., min_length=8, max_length=128, description="Password")


class LoginRequest(BaseModel):
    email_prefix: str = Field(..., description="Email prefix (before @)")
    password: str = Field(..., description="Password")


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: UUID
    name: str
    email: str
    organization_id: UUID

    class Config:
        from_attributes = True
