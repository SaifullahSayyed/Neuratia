"""
Authentication & RBAC Dependency for FastAPI.
Verifies Supabase JWT tokens and extracts user identity and role.
"""

from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel

from app.core.config import settings

security = HTTPBearer(auto_error=False)


class AuthUser(BaseModel):
    id: str
    email: str | None = None
    role: str = "patient"


def verify_jwt_token(token: str) -> dict:
    """Verifies a Supabase JWT token against the configured secret or HS256 algorithm."""
    try:
        # Supabase uses HS256 with the SUPABASE_JWT_SECRET
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired authentication token: {e!s}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> AuthUser:
    """FastAPI Dependency: Ensures request has a valid Bearer token and returns AuthUser."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = verify_jwt_token(token)

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing subject ('sub')",
        )

    # Extract role from user_metadata or app_metadata if present
    user_metadata = payload.get("user_metadata", {})
    app_metadata = payload.get("app_metadata", {})
    role = user_metadata.get("role") or app_metadata.get("role") or "patient"
    email = payload.get("email")

    return AuthUser(id=user_id, email=email, role=role)


def require_role(allowed_roles: list[str]) -> Callable:
    """Factory dependency for role-based access control."""
    async def role_checker(user: AuthUser = Depends(get_current_user)) -> AuthUser:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {allowed_roles}",
            )
        return user

    return role_checker
