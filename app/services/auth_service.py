from uuid import UUID

from fastapi import HTTPException, status

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.data.models.organization_model import Organization
from app.data.models.user_model import User
from app.interfaces.organization_repository import OrganizationRepository
from app.interfaces.user_repository import UserRepository
from app.schemas.auth import RegisterRequest
from app.utils.email import build_org_email


class AuthService:

    def __init__(
        self,
        user_repo: UserRepository,
        org_repo: OrganizationRepository,
    ):
        self.user_repo = user_repo
        self.org_repo = org_repo

    async def register(self, request: RegisterRequest) -> User:
        """Register a new user with org email."""
        email = build_org_email(request.email_prefix)

        # check if user already exists
        existing = await self.user_repo.find_by_email(email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists",
            )

        # get or create the organization
        org = await self._get_or_create_org()

        # create the user with hashed password
        user = User(
            name=request.name,
            email=email,
            password_hash=hash_password(request.password),
            organization_id=org.id,
        )
        return await self.user_repo.create(user)

    async def login(self, email_prefix: str, password: str) -> dict:
        """Authenticate user and return tokens."""
        email = build_org_email(email_prefix)

        user = await self.user_repo.find_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        # generate both tokens
        access_token = create_access_token(str(user.id))
        refresh_token = create_refresh_token(str(user.id))

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    async def get_user_by_id(self, user_id: str) -> User:
        """Fetch user by ID for token validation."""
        user = await self.user_repo.find_by_id(UUID(user_id))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        return user

    async def _get_or_create_org(self) -> Organization:
        """Get existing org or create one from config."""
        org = await self.org_repo.find_by_domain(settings.ORG_DOMAIN)
        if not org:
            org = Organization(name=settings.ORG_NAME, domain=settings.ORG_DOMAIN)
            org = await self.org_repo.create(org)
        return org
