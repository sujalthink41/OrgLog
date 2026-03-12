from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import redis_client
from app.core.security import decode_token
from app.data.database.session import get_async_session
from app.data.models.user_model import User
from app.infrastructure.postgres_log_repository import PostgresLogRepository
from app.infrastructure.postgres_organization_repository import (
    PostgresOrganizationRepository,
)
from app.infrastructure.postgres_user_repository import PostgresUserRepository
from app.infrastructure.redis_publisher import RedisPublisher
from app.services.auth_service import AuthService
from app.services.log_analytics_service import LogAnalyticsService
from app.services.log_ingestion_service import LogIngestionService
from app.services.log_query_service import LogQueryService

# bearer token extractor for protected routes
bearer_scheme = HTTPBearer()


# --- Log dependencies ---


def get_log_ingestion_service() -> LogIngestionService:
    publisher = RedisPublisher(redis_client)
    return LogIngestionService(publisher)


async def get_log_query_service(
    session: AsyncSession = Depends(get_async_session),
) -> LogQueryService:
    repository = PostgresLogRepository(session)
    return LogQueryService(repository)


async def get_log_analytics_service(
    session: AsyncSession = Depends(get_async_session),
) -> LogAnalyticsService:
    repository = PostgresLogRepository(session)
    return LogAnalyticsService(repository)


# --- Auth dependencies ---


async def get_auth_service(
    session: AsyncSession = Depends(get_async_session),
) -> AuthService:
    user_repo = PostgresUserRepository(session)
    org_repo = PostgresOrganizationRepository(session)
    return AuthService(user_repo, org_repo)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    auth_service: AuthService = Depends(get_auth_service),
) -> User:
    """Extract and validate JWT from Authorization header, return the user."""
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    return await auth_service.get_user_by_id(payload["sub"])
