"""Security & Trust Boundary tests for Batch P0-B (Tools, Voice, Privacy: CR-03, CR-04, CR-05)."""

import os
import base64
import pytest
from unittest.mock import patch, AsyncMock
from backend.config.settings import settings
from backend.tools.registry import tool_registry
from backend.tools.approval import create_approval_token, verify_and_consume_token


def test_file_manager_requires_confirmation_flag():
    """Verify file_manager tool declares requires_confirmation=True (0B.1)."""
    tool = tool_registry.get("file_manager")
    assert tool is not None
    assert tool.requires_confirmation is True


def test_direct_file_manager_execution_without_token_fails_403(client):
    """Verify executing file_manager without approval token returns 403 Forbidden."""
    res = client.post(
        "/api/tools/file_manager/execute",
        json={"arguments": {"action": "read", "target": "README.md"}},
    )
    assert res.status_code == 403
    assert "explicit confirmation" in res.json()["detail"].lower()


def test_direct_file_manager_read_alias_without_token_fails_403(client):
    """Verify POST /api/tools/file_manager/read without approval token returns 403 Forbidden."""
    res = client.post(
        "/api/tools/file_manager/read",
        json={"arguments": {"target": "README.md"}},
    )
    assert res.status_code == 403
    assert "explicit confirmation" in res.json()["detail"].lower()


def test_tool_approval_flow_succeeds(client, tmp_path, monkeypatch):
    """Verify approval endpoint issues token that allows one-time tool execution."""
    # Create safe test file in sandbox
    test_file = tmp_path / "sandbox_doc.txt"
    test_file.write_text("Hello from secure sandbox!")
    monkeypatch.setattr(settings, "WORKSPACE_ROOT", str(tmp_path))

    # 1. Request approval token
    app_res = client.post("/api/tools/file_manager/approve", json={})
    assert app_res.status_code == 200
    token = app_res.json()["approval_token"]
    assert token and len(token) > 20

    # 2. Execute with valid token succeeds
    exec_res = client.post(
        "/api/tools/file_manager/execute",
        json={
            "arguments": {"action": "read", "target": str(test_file)},
            "approval_token": token,
        },
    )
    assert exec_res.status_code == 200
    assert "Hello from secure sandbox!" in exec_res.json()["result"]

    # 3. Token is single-use: second attempt fails with 403
    retry_res = client.post(
        "/api/tools/file_manager/execute",
        json={
            "arguments": {"action": "read", "target": str(test_file)},
            "approval_token": token,
        },
    )
    assert retry_res.status_code == 403


def test_workspace_sandbox_blocks_traversal_and_sensitive_files(tmp_path, monkeypatch):
    """Verify workspace sandbox denies files outside root and sensitive patterns (0B.2)."""
    workspace = tmp_path / "workspace"
    workspace.mkdir()
    outside = tmp_path / "outside.txt"
    outside.write_text("Secret outside file")

    sensitive_env = workspace / ".env"
    sensitive_env.write_text("FRIDAY_API_KEY=leak")

    sensitive_db = workspace / "friday.db"
    sensitive_db.write_text("sqlite data")

    monkeypatch.setattr(settings, "WORKSPACE_ROOT", str(workspace))
    file_tool = tool_registry.get("file_manager")

    import asyncio

    # Traversal test
    traversal_result = asyncio.run(file_tool.execute({"action": "read", "target": str(outside)}))
    assert "Access Denied" in traversal_result
    assert "outside the authorized workspace" in traversal_result

    # Sensitive .env test
    env_result = asyncio.run(file_tool.execute({"action": "read", "target": str(sensitive_env)}))
    assert "Access Denied" in env_result
    assert "sensitive or system file" in env_result

    # Sensitive DB test
    db_result = asyncio.run(file_tool.execute({"action": "read", "target": str(sensitive_db)}))
    assert "Access Denied" in db_result
    assert "sensitive or system file" in db_result


def test_orchestrator_chat_pauses_confirmation_required_tools():
    """Verify model output alone cannot execute confirmation-required tools (0B.1)."""
    import asyncio
    from backend.ai.orchestrator import orchestrator

    fake_model_reply = '```tool\n{"tool": "file_manager", "arguments": {"action": "read", "target": "notes.txt"}}\n```'

    async def mock_stream(messages):
        yield "Tool execution requires explicit confirmation."

    with patch.object(orchestrator.client, "check_health", new_callable=AsyncMock, return_value=True):
        with patch.object(orchestrator.client, "chat", new_callable=AsyncMock) as mock_chat:
            with patch.object(orchestrator.client, "chat_stream", side_effect=mock_stream):
                mock_chat.return_value = fake_model_reply
                events = []

                async def _run():
                    async for ev in orchestrator.process_stream("read my notes", conversation_id=None):
                        events.append(ev)

                asyncio.run(_run())

    event_types = [e["type"] for e in events]
    assert "confirmation_required" in event_types
    # Verify tool_completed is NOT emitted because tool execution was blocked
    assert "tool_completed" not in event_types
    conf_event = next(e for e in events if e["type"] == "confirmation_required")
    assert conf_event["tool"] == "file_manager"
    assert "/api/tools/file_manager/approve" in conf_event["approval_endpoint"]


def test_voice_transcribe_payload_limits(client, monkeypatch):
    """Verify audio transcribe endpoint rejects oversized payloads with 413 (0B.3)."""
    monkeypatch.setattr(settings, "MAX_VOICE_PAYLOAD_BYTES", 1000)

    # 1. Content-Length header exceeding limit
    res_hdr = client.post(
        "/api/voice/transcribe",
        headers={"Content-Length": "2000", "Content-Type": "audio/wav"},
        content=b"small",
    )
    assert res_hdr.status_code == 413

    # 2. Raw binary body exceeding limit
    big_audio = b"0" * 1500
    res_raw = client.post(
        "/api/voice/transcribe",
        headers={"Content-Type": "audio/wav"},
        content=big_audio,
    )
    assert res_raw.status_code == 413

    # 3. JSON base64 exceeding limit
    big_b64 = base64.b64encode(big_audio).decode("ascii")
    res_json = client.post(
        "/api/voice/transcribe",
        json={"audio_base64": big_b64, "suffix": ".wav"},
    )
    assert res_json.status_code == 413

    # 4. Invalid base64
    res_bad_b64 = client.post(
        "/api/voice/transcribe",
        json={"audio_base64": "not-valid-base64!@#$", "suffix": ".wav"},
    )
    assert res_bad_b64.status_code == 400

    # 5. Unsupported audio suffix
    res_bad_suffix = client.post(
        "/api/voice/transcribe",
        json={"audio_base64": base64.b64encode(b"audio").decode("ascii"), "suffix": ".exe"},
    )
    assert res_bad_suffix.status_code == 400


def test_voice_tts_text_length_limit(client, monkeypatch):
    """Verify TTS synthesis caps text length (0B.3)."""
    monkeypatch.setattr(settings, "MAX_TTS_TEXT_LENGTH", 100)

    long_text = "A" * 150
    res = client.post("/api/voice/tts", json={"text": long_text})
    assert res.status_code == 400
    assert "maximum allowed length" in res.json()["detail"]


def test_voice_tts_default_local_provider_header(client, monkeypatch):
    """Verify default TTS path uses local provider and reports X-TTS-Provider: local (0B.4)."""
    monkeypatch.setattr(settings, "TTS_MODE", "local")
    monkeypatch.setattr(settings, "TTS_ALLOW_CLOUD", False)

    from backend.voice.voice_service import voice_service

    # Mock local macOS synthesis to return dummy audio bytes
    with patch.object(voice_service, "_synthesize_local_macos") as mock_local:
        with patch("edge_tts.Communicate") as mock_cloud:
            mock_local.return_value = (b"dummy_wav_audio", "audio/wav")

            res = client.post("/api/voice/tts", json={"text": "Hello world from FRIDAY voice"})
            assert res.status_code == 200
            assert res.headers.get("X-TTS-Provider") == "local"
            # Ensure zero cloud calls made
            mock_cloud.assert_not_called()
