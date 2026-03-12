from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from app.core.dependencies import get_auth_service, get_current_user
from app.core.security import create_access_token, decode_token
from app.data.models.user_model import User
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


@router.post("/register", response_model=UserResponse)
async def register(
    request: RegisterRequest,
    service: AuthService = Depends(get_auth_service),
):
    user = await service.register(request)
    return user


@router.post("/login", response_model=AuthResponse)
async def login(
    request: LoginRequest,
    response: Response,
    service: AuthService = Depends(get_auth_service),
):
    result = await service.login(request.email_prefix, request.password)

    # set refresh token as httponly cookie (JS can't access it)
    response.set_cookie(
        key="refresh_token",
        value=result["refresh_token"],
        httponly=True,
        secure=False,  # set True in production (requires HTTPS)
        samesite="lax",
        max_age=7 * 24 * 60 * 60,  # 7 days in seconds
    )

    return AuthResponse(access_token=result["access_token"])


@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(
    request: Request,
    service: AuthService = Depends(get_auth_service),
):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found",
        )

    try:
        payload = decode_token(token)
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    # verify user still exists
    await service.get_user_by_id(payload["sub"])

    new_access_token = create_access_token(payload["sub"])
    return AuthResponse(access_token=new_access_token)


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="refresh_token")
    return {"message": "Logged out"}


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user
