"""
Request authorization for the FRIDAY Core API.

FRIDAY drives the host OS: it launches applications, creates reminders, reads
files and synthesizes speech. Before this module existed the API had no
authorization of any kind while advertising `Access-Control-Allow-Origin: *`,
which made every one of those capabilities reachable from any web page the user
happened to visit.

A request is authorized when EITHER:

  1. Its `Origin` header is in `settings.CORS_ORIGINS` (the first-party web
     client, running on a known dev/prod origin), OR
  2. It carries a valid `X-FRIDAY-Token` (native clients: the Electron
     renderer, Capacitor, curl).

A request with **no** Origin header and no token is rejected. That case matters:
`<img src="http://localhost:8000/api/voice/speak?text=...">` on an attacker's
page issues a credential-less GET with no Origin and no preflight, so an
Origin-allowlist alone would not stop it. Requiring one of the two proofs closes
that path while leaving scripted/native access possible.

Note this is a same-host trust boundary, not a user authentication system. It
stops remote and cross-origin callers; it does not defend against local malware
already running as the user, which could read the token file anyway.
"""

from __future__ import annotations

import logging
import os
import secrets
import stat

from fastapi import HTTPException, Request, status

from services.core.app.config import settings

logger = logging.getLogger(__name__)

TOKEN_HEADER = "X-FRIDAY-Token"
TOKEN_QUERY_PARAM = "token"

# Reachable without proof of origin. Health is needed by container probes and
# the client's connectivity check; downloads are plain static release binaries
# with hardcoded filenames and are meant to be clickable links.
PUBLIC_PATH_PREFIXES: tuple[str, ...] = (
    "/health",
    "/api/health",
    "/api/models",
    "/api/model/info",
    "/api/download",
    "/docs",
    "/redoc",
    "/openapi.json",
)


_CACHED_TOKEN: str | None = None


def get_api_token() -> str:
    """
    Resolve the shared secret, generating and persisting one on first run.

    Precedence: FRIDAY_API_TOKEN env var, then the token file, then a freshly
    generated token written with 0600 permissions.
    """
    global _CACHED_TOKEN
    if _CACHED_TOKEN:
        return _CACHED_TOKEN

    if settings.API_TOKEN:
        _CACHED_TOKEN = settings.API_TOKEN
        return _CACHED_TOKEN

    token_file = settings.TOKEN_FILE
    try:
        if token_file.exists():
            existing = token_file.read_text(encoding="utf-8").strip()
            if existing:
                _CACHED_TOKEN = existing
                return _CACHED_TOKEN
    except OSError as exc:
        logger.warning("Could not read API token file %s: %s", token_file, exc)

    token = secrets.token_urlsafe(32)
    try:
        token_file.parent.mkdir(parents=True, exist_ok=True)
        # Create with 0600 from the outset rather than chmod-ing after write,
        # which would leave a window where the secret is world-readable.
        fd = os.open(token_file, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, stat.S_IRUSR | stat.S_IWUSR)
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(token)
    except OSError as exc:
        # Falling back to an in-memory token keeps the service usable, but
        # native clients cannot discover it, so make the failure loud.
        logger.error("Could not persist API token to %s: %s", token_file, exc)

    _CACHED_TOKEN = token
    return _CACHED_TOKEN


def is_public_path(path: str) -> bool:
    return any(path.startswith(prefix) for prefix in PUBLIC_PATH_PREFIXES)


def is_trusted_origin(origin: str | None) -> bool:
    """
    True when `origin` is explicitly allowlisted.

    `None` (header absent) and the literal `"null"` are both untrusted: a
    sandboxed iframe and a `file://` document both report `null`, so honouring
    it would readmit the drive-by attacks this module exists to block.
    """
    if not origin or origin == "null":
        return False
    return origin in settings.CORS_ORIGINS


def has_valid_token(supplied: str | None) -> bool:
    if not supplied:
        return False
    # Constant-time compare so a network attacker cannot recover the token
    # byte-by-byte from response timing.
    return secrets.compare_digest(supplied, get_api_token())


def is_authorized(origin: str | None, token: str | None) -> bool:
    return is_trusted_origin(origin) or has_valid_token(token)


async def require_authorization(request: Request) -> None:
    """FastAPI dependency form, for routes that opt in individually."""
    if is_public_path(request.url.path):
        return
    origin = request.headers.get("origin")
    token = request.headers.get(TOKEN_HEADER) or request.query_params.get(TOKEN_QUERY_PARAM)
    if not is_authorized(origin, token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Untrusted origin. Supply a valid X-FRIDAY-Token or call from an allowlisted origin.",
        )
