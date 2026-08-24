"""
Normalization for untrusted WebSocket frames.

The previous inline parsing only guarded `json.loads` failure, so any valid JSON
that was not an object crashed the handler: `json.loads("5")` returns an int and
`5.get("type")` raises AttributeError, which killed the whole session. Sending
the single character `5` was enough to end a conversation. `{"message": null}`
did the same via `None.strip()`.
"""

from __future__ import annotations

import json
from typing import Any

DEFAULT_CONVERSATION_ID = "default"


def _as_text(value: Any) -> str:
    """Coerce an arbitrary JSON value to a stripped string, never raising."""
    if value is None or isinstance(value, (dict, list)):
        return ""
    if isinstance(value, str):
        return value.strip()
    return str(value).strip()


def coerce_client_payload(raw_text: str) -> dict[str, Any]:
    """
    Turn an arbitrary client frame into a fully-populated payload dict.

    Always returns every key the handler reads, so downstream code never needs
    `.get()` defaults or isinstance checks.
    """
    try:
        parsed = json.loads(raw_text)
    except (ValueError, TypeError):
        parsed = None

    # Non-object JSON (numbers, strings, arrays, null) and unparseable text are
    # both treated as a bare chat message, matching the original intent.
    if not isinstance(parsed, dict):
        return {
            "type": "chat_message",
            "message": _as_text(raw_text),
            "conversation_id": DEFAULT_CONVERSATION_ID,
            "input_type": "text",
            "agent_mode": "general",
        }

    msg_type = _as_text(parsed.get("type")) or "chat_message"
    conversation_id = _as_text(parsed.get("conversation_id")) or DEFAULT_CONVERSATION_ID

    return {
        "type": msg_type,
        "message": _as_text(parsed.get("message")),
        "conversation_id": conversation_id,
        "input_type": _as_text(parsed.get("input_type")) or "text",
        "agent_mode": _as_text(parsed.get("agent_mode")) or "general",
    }


def _self_check() -> None:
    """Regression guard for the frames that used to kill the connection."""
    # Bare non-object JSON: the original one-character session kill.
    for hostile in ("5", "null", "[1,2]", "true", '"hi"', "{bad json", ""):
        payload = coerce_client_payload(hostile)
        assert isinstance(payload, dict), hostile
        assert isinstance(payload["message"], str), hostile
        assert payload["conversation_id"], hostile

    # Explicit nulls inside a well-formed object.
    payload = coerce_client_payload('{"type": null, "message": null, "conversation_id": null}')
    assert payload["type"] == "chat_message"
    assert payload["message"] == ""
    assert payload["conversation_id"] == DEFAULT_CONVERSATION_ID

    # Nested structures where a string is expected must not leak through.
    payload = coerce_client_payload('{"message": {"a": 1}}')
    assert payload["message"] == ""

    # The happy path still works and strips whitespace.
    payload = coerce_client_payload('{"type":"chat_message","message":"  hi  ","conversation_id":"c1"}')
    assert payload == {
        "type": "chat_message",
        "message": "hi",
        "conversation_id": "c1",
        "input_type": "text",
        "agent_mode": "general",
    }

    # Plain text (not JSON) is still accepted as a chat message.
    assert coerce_client_payload("hello there")["message"] == "hello there"

    print("protocol self-check OK")


if __name__ == "__main__":
    _self_check()
