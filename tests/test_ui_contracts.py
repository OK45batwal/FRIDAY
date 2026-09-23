"""UI Contracts Integration & Schema Tests for FRIDAY Local Intelligence Console.

Validates that all backend API contracts consumed by web/app.js are fully functional,
return expected schema shapes, and handle edge cases gracefully.
"""

import pytest
from unittest.mock import AsyncMock, patch


def test_health_contract(client):
    """Verify /api/health returns system telemetry required by Dashboard and status badge."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "tools" in data
    assert "database" in data
    assert "activity" in data
    assert "system" in data


def test_tools_list_contract(client):
    """Verify /api/tools returns registered tools with schema specifications."""
    res = client.get("/api/tools")
    assert res.status_code == 200
    tools = res.json()
    assert isinstance(tools, list)
    assert len(tools) > 0
    # Check shape of tool metadata
    first = tools[0]
    assert "name" in first
    assert "description" in first
    assert "parameters" in first


def test_tool_execute_calculate(client):
    """Verify /api/tools/{name}/execute works synchronously for local tools."""
    res = client.post(
        "/api/tools/calculate/execute",
        json={"arguments": {"expression": "12 * 12 + 4"}},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["tool"] == "calculate"
    assert "148" in str(data["result"])


def test_settings_contracts(client):
    """Verify GET and PUT /api/settings conform to Settings view requirements."""
    # GET settings
    get_res = client.get("/api/settings")
    assert get_res.status_code == 200
    settings_data = get_res.json()
    assert "llm_model" in settings_data
    assert "temperature" in settings_data

    # PUT settings update
    put_res = client.put(
        "/api/settings",
        json={"temperature": 0.7},
    )
    assert put_res.status_code == 200
    assert put_res.json()["status"] == "updated"


def test_conversations_contract(client):
    """Verify /api/conversations list contract used by Chat sidebar."""
    res = client.get("/api/conversations")
    assert res.status_code == 200
    convs = res.json()
    assert isinstance(convs, list)


def test_voice_status_contract(client):
    """Verify /api/voice/status returns voice pipeline readiness for Voice Console."""
    res = client.get("/api/voice/status")
    assert res.status_code == 200
    voice_info = res.json()
    assert "tts_available" in voice_info
    assert "voices" in voice_info
    assert "stt" in voice_info


def test_memory_contract(client):
    """Verify /api/memory returns list of stored memories."""
    res = client.get("/api/memory")
    assert res.status_code == 200
    memories = res.json()
    assert isinstance(memories, list)
