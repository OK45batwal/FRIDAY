"""Tool confirmation and approval token management (Batch P0-B / CR-03)."""

import time
import secrets
from typing import Optional, Dict, Any
from backend.utils.logger import get_logger

logger = get_logger("tool_approval")

# In-memory token storage: token -> {tool_name, arguments, expires_at}
_APPROVAL_TOKENS: Dict[str, Dict[str, Any]] = {}
DEFAULT_TOKEN_TTL = 300  # 5 minutes


def _prune_expired_tokens():
    """Remove expired tokens to prevent unbounded memory growth."""
    now = time.time()
    expired = [tok for tok, data in _APPROVAL_TOKENS.items() if data["expires_at"] < now]
    for tok in expired:
        _APPROVAL_TOKENS.pop(tok, None)


def create_approval_token(
    tool_name: str,
    arguments: Optional[Dict[str, Any]] = None,
    ttl_seconds: int = DEFAULT_TOKEN_TTL,
) -> str:
    """Issue a cryptographically random, short-lived approval token for a tool execution."""
    _prune_expired_tokens()
    token = secrets.token_urlsafe(32)
    _APPROVAL_TOKENS[token] = {
        "tool_name": tool_name.strip().lower(),
        "arguments": arguments or {},
        "expires_at": time.time() + ttl_seconds,
    }
    logger.info(f"Issued approval token for tool '{tool_name}' (valid for {ttl_seconds}s).")
    return token


def verify_and_consume_token(
    tool_name: str,
    token: Optional[str],
    arguments: Optional[Dict[str, Any]] = None,
) -> bool:
    """Verify approval token for the specified tool and consume it if valid."""
    if not token:
        return False

    _prune_expired_tokens()
    data = _APPROVAL_TOKENS.get(token)
    if not data:
        return False

    now = time.time()
    if data["expires_at"] < now:
        _APPROVAL_TOKENS.pop(token, None)
        return False

    # Check tool name matches
    if data["tool_name"] != tool_name.strip().lower():
        return False

    # Consume single-use token upon successful verification
    _APPROVAL_TOKENS.pop(token, None)
    logger.info(f"Verified and consumed approval token for tool '{tool_name}'.")
    return True
