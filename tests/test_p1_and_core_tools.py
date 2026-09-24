"""Unit and integration tests for Batch P1 Correctness Contracts and Core 10 Tools."""

import os
import re
import asyncio
import pytest
from unittest.mock import patch, AsyncMock

from backend.config.settings import settings
from backend.database.repositories import SettingsRepository, MemoryRepository
from backend.tools import (
    tool_registry,
    create_approval_token,
    OpenWebsiteTool,
    OpenApplicationTool,
    TerminalTool,
    ScreenshotTool,
    NotesTool,
)


def test_core_10_tools_registered():
    """Verify that all Core 10 Tools requested for FRIDAY v1 are properly registered."""
    core_10_names = [
        "web_search",
        "open_website",
        "open_application",
        "file_manager",
        "terminal",
        "calculator",
        "weather",
        "screenshot",
        "notes",
        "system_info",
    ]
    for name in core_10_names:
        tool = tool_registry.get(name)
        assert tool is not None, f"Tool '{name}' was not found in registry"
        assert tool.name == name or tool.name in tool_registry.ALIASES.values()


def test_tool_open_website_validation():
    """Verify OpenWebsiteTool URL validation and execution."""
    tool = OpenWebsiteTool()

    # Disallow invalid schemes (like file://, javascript://)
    res_bad = asyncio.run(tool.execute({"url": "file:///etc/passwd"}))
    assert "Error: Only HTTP and HTTPS URLs are permitted" in res_bad

    res_empty = asyncio.run(tool.execute({"url": ""}))
    assert "Error: Website URL cannot be empty" in res_empty

    # Safe mock for browser open
    with patch("webbrowser.open", return_value=True):
        res_ok = asyncio.run(tool.execute({"url": "https://google.com"}))
        assert "Website opened successfully" in res_ok

        # Flexible string input
        res_str = asyncio.run(tool.execute("github.com"))
        assert "Website opened successfully" in res_str


def test_tool_open_application_security_and_confirmation():
    """Verify OpenApplicationTool requires confirmation token and sanitizes app name."""
    tool = OpenApplicationTool()
    assert tool.requires_confirmation is True

    # Attempting to execute directly via registry without approval token must raise PermissionError
    with pytest.raises(PermissionError):
        asyncio.run(tool_registry.execute("open_application", {"app_name": "Chrome"}))

    # Injection attack attempts must be rejected
    res_inject = asyncio.run(tool.execute({"app_name": "Calculator; rm -rf /"}))
    assert "illegal characters" in res_inject.lower()

    # Valid invocation with approval token
    token = create_approval_token("open_application", {"app_name": "Calculator"})
    with patch("asyncio.create_subprocess_exec") as mock_exec:
        mock_proc = AsyncMock()
        mock_proc.returncode = 0
        mock_proc.communicate.return_value = (b"", b"")
        mock_exec.return_value = mock_proc

        result = asyncio.run(
            tool_registry.execute(
                "open_application",
                {"app_name": "Calculator"},
                approval_token=token,
            )
        )
        assert "Calculator opened successfully" in result


def test_tool_terminal_security_and_execution():
    """Verify TerminalTool requires confirmation, blocks dangerous commands, and runs safe commands."""
    tool = TerminalTool()
    assert tool.requires_confirmation is True

    # Blocked dangerous commands
    res_rm = asyncio.run(tool.execute({"command": "rm -rf /"}))
    assert "security policy" in res_rm.lower()

    res_fork = asyncio.run(tool.execute({"command": ":(){ :|:& };:"}) )
    assert "security policy" in res_rm.lower()

    # Unauthorized execution without approval token raises PermissionError
    with pytest.raises(PermissionError):
        asyncio.run(tool_registry.execute("terminal", {"command": "echo test"}))

    # Safe execution with token
    token = create_approval_token("terminal", {"command": "echo 'FRIDAY_CLI'"})
    result = asyncio.run(
        tool_registry.execute(
            "terminal",
            {"command": "echo 'FRIDAY_CLI'"},
            approval_token=token,
        )
    )
    assert "FRIDAY_CLI" in result
    assert "return code 0" in result


def test_tool_screenshot_execution(tmp_path):
    """Verify ScreenshotTool captures screenshots into workspace folder."""
    tool = ScreenshotTool()
    with patch.object(settings, "WORKSPACE_ROOT", str(tmp_path)):
        with patch("asyncio.create_subprocess_exec") as mock_exec:
            mock_proc = AsyncMock()
            mock_proc.returncode = 0
            mock_proc.communicate.return_value = (b"", b"")
            mock_exec.return_value = mock_proc

            # Create mock destination file to simulate successful capture
            sc_dir = tmp_path / "screenshots"
            sc_dir.mkdir(parents=True, exist_ok=True)
            test_file = sc_dir / "test.png"
            test_file.write_text("fake_png")

            res = asyncio.run(tool.execute({"filename": "test.png"}))
            assert "Screenshot captured successfully: screenshots/test.png" in res


def test_tool_notes_crud():
    """Verify NotesTool can create, list, search, and delete notes."""
    tool = NotesTool()

    # Create note
    res_create = asyncio.run(tool.execute({"action": "create", "content": "Review Stark Tower power grid"}))
    assert "Note created successfully" in res_create

    # List notes
    res_list = asyncio.run(tool.execute({"action": "list"}))
    assert "Review Stark Tower power grid" in res_list

    # Search notes
    res_search = asyncio.run(tool.execute({"action": "search", "content": "Stark Tower"}))
    assert "Review Stark Tower power grid" in res_search

    # Extract ID and delete
    match = re.search(r"\[ID:\s*([^\]]+)\]", res_create)
    assert match is not None
    note_id = match.group(1).strip()

    res_del = asyncio.run(tool.execute({"action": "delete", "id": note_id}))
    assert "deleted successfully" in res_del


# ============================================================================
# Batch P1 Correctness Contracts Tests
# ============================================================================

def test_p1_1_settings_persisted_load():
    """Batch P1.1: Verify persisted settings are correctly applied to the settings singleton."""
    from backend.api.settings import apply_saved_settings

    # Set custom values in DB
    asyncio.run(SettingsRepository.set("llm_model", "test-friday-model"))
    asyncio.run(SettingsRepository.set("temperature", "0.42"))
    asyncio.run(SettingsRepository.set("enable_voice", "false"))

    saved = asyncio.run(SettingsRepository.get_all())
    apply_saved_settings(saved)

    assert settings.LLM_MODEL == "test-friday-model"
    assert settings.LLM_TEMPERATURE == 0.42
    assert settings.ENABLE_VOICE is False


def test_p1_2_importance_zero_preserved(client):
    """Batch P1.2: Verify importance=0.0 is preserved and not coerced to 1.0."""
    resp = client.post("/api/memory", json={"content": "Low priority memo", "importance": 0.0})
    assert resp.status_code == 200
    data = resp.json()
    assert data["importance"] == 0.0

    # Verify in database
    mem = asyncio.run(MemoryRepository.search("Low priority memo"))
    assert len(mem) > 0
    assert mem[0].importance == 0.0


def test_p1_3_onboarding_persistence_and_validation(client):
    """Batch P1.3: Verify onboarding validates personas/tools and persists in DB."""
    # Invalid persona -> 422
    resp_bad_persona = client.post(
        "/api/onboarding/complete",
        json={"persona": "evil_villain"},
    )
    assert resp_bad_persona.status_code == 422

    # Invalid tool -> 422
    resp_bad_tool = client.post(
        "/api/onboarding/complete",
        json={"persona": "precise", "enabled_tools": ["non_existent_hack_tool"]},
    )
    assert resp_bad_tool.status_code == 422

    # Valid completion
    resp_ok = client.post(
        "/api/onboarding/complete",
        json={
            "user_name": "Tony",
            "persona": "iron_man",
            "enabled_tools": ["calculator", "web_search", "weather"],
        },
    )
    assert resp_ok.status_code == 200
    state = resp_ok.json()["state"]
    assert state["completed"] is True
    assert state["user_name"] == "Tony"
    assert state["persona"] == "iron_man"

    # Check status endpoint reads back from DB
    status_resp = client.get("/api/onboarding/status")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["completed"] is True
    assert status_data["user_name"] == "Tony"
    assert status_data["persona"] == "iron_man"
    assert "calculator" in status_data["enabled_tools"]


def test_p1_4_request_model_bounds(client):
    """Batch P1.4: Verify request model bounds produce 422 on invalid ranges."""
    # Settings temperature > 2.0 -> 422
    resp_temp = client.put("/api/settings", json={"temperature": 5.0})
    assert resp_temp.status_code == 422

    # Settings temperature < 0.0 -> 422
    resp_temp_neg = client.put("/api/settings", json={"temperature": -0.5})
    assert resp_temp_neg.status_code == 422

    # Memory importance > 1.0 -> 422
    resp_mem_imp = client.post("/api/memory", json={"content": "test", "importance": 1.5})
    assert resp_mem_imp.status_code == 422

    # Conversation pagination limit < 1 -> 422
    resp_limit = client.get("/api/conversations?limit=0")
    assert resp_limit.status_code == 422

    # Conversation pagination limit > 100 -> 422
    resp_limit_high = client.get("/api/conversations?limit=150")
    assert resp_limit_high.status_code == 422


def test_p1_5_chat_error_hygiene(client):
    """Batch P1.5: Verify non-streaming chat returns success=False on failure."""
    # Mock orchestrator to raise exception
    with patch("backend.ai.orchestrator.orchestrator.process_stream") as mock_stream:
        async def failing_stream(*args, **kwargs):
            raise RuntimeError("Simulated internal LLM breakdown")
            yield  # pragma: no cover

        mock_stream.side_effect = failing_stream

        resp = client.post(
            "/api/chat",
            json={"prompt": "Hello Friday", "stream": False},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is False
        assert "error" in data and data["error"] is not None
        # Internal trace or sensitive exception details should not be in reply
        assert "Simulated internal LLM breakdown" not in data["reply"]
