"""Authentication & Authorization dependencies for FRIDAY API (P0-A)."""

import secrets
from typing import Optional
from fastapi import Request, WebSocket, HTTPException, status
from backend.config.settings import settings
from backend.utils.logger import get_logger

logger = get_logger("auth")

ALLOWED_ORIGINS = {
    "http://127.0.0.1:8080",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://localhost:5173",
}


from starlette.requests import HTTPConnection


def require_api_key(conn: HTTPConnection) -> Optional[str]:
    """Verify API key from request headers or query params.

    Allows unauthenticated requests only when FRIDAY_API_KEY is unset AND
    ENVIRONMENT is development or testing.
    Supports both HTTP Requests and WebSockets.
    """
    is_ws = conn.scope.get("type") == "websocket"

    # For WebSockets, enforce Origin allowlist
    if is_ws:
        origin = conn.headers.get("origin")
        if not verify_ws_origin(origin):
            logger.warning(f"Rejected WS connection from unauthorized origin: {origin}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden origin.",
            )

    configured_key = settings.FRIDAY_API_KEY

    if not configured_key:
        if settings.ENVIRONMENT in ("development", "testing"):
            return "dev-anonymous"
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract API key from headers or query param (for WebSockets)
    provided_key = conn.headers.get("x-api-key")
    if not provided_key:
        auth_header = conn.headers.get("authorization", "")
        if auth_header.lower().startswith("bearer "):
            provided_key = auth_header[7:].strip()
    if not provided_key:
        provided_key = conn.query_params.get("api_key")

    if not provided_key or not secrets.compare_digest(provided_key, configured_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return "authenticated-user"


def verify_ws_origin(origin: Optional[str]) -> bool:
    """Verify WebSocket Origin header against allowed local origins."""
    if not origin:
        # Non-browser clients (native apps, test scripts) may omit Origin
        return True
    return origin.rstrip("/") in ALLOWED_ORIGINS


def verify_ws_auth(websocket: WebSocket) -> bool:
    """Verify WebSocket authentication via query param or header."""
    configured_key = settings.FRIDAY_API_KEY

    if not configured_key:
        return settings.ENVIRONMENT in ("development", "testing")

    provided_key = websocket.query_params.get("api_key")
    if not provided_key:
        provided_key = websocket.headers.get("x-api-key")
    if not provided_key:
        auth_header = websocket.headers.get("authorization", "")
        if auth_header.lower().startswith("bearer "):
            provided_key = auth_header[7:].strip()

    if not provided_key:
        return False

    return secrets.compare_digest(provided_key, configured_key)
