"""Tests for onboarding API, conversation rename PATCH, and pagination."""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_onboarding_flow():
    """Verify GET /api/onboarding/status and POST /api/onboarding/complete."""
    res = client.get("/api/onboarding/status")
    assert res.status_code == 200
    data = res.json()
    assert "completed" in data
    assert "enabled_tools" in data

    comp_res = client.post(
        "/api/onboarding/complete",
        json={"user_name": "Antigravity", "persona": "precise"},
    )
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert comp_data["status"] == "ok"
    assert comp_data["state"]["completed"] is True
    assert comp_data["state"]["user_name"] == "Antigravity"


def test_conversation_patch_rename():
    """Verify PATCH /api/conversations/{id} renames properly."""
    create_res = client.post("/api/conversations", json={"title": "Original Title"})
    assert create_res.status_code == 200
    conv = create_res.json()
    conv_id = conv["id"]

    patch_res = client.patch(f"/api/conversations/{conv_id}", json={"title": "Patched Title"})
    assert patch_res.status_code == 200
    assert patch_res.json()["title"] == "Patched Title"

    # Verify via GET
    get_res = client.get(f"/api/conversations/{conv_id}")
    assert get_res.status_code == 200
    assert get_res.json()["conversation"]["title"] == "Patched Title"

    # Cleanup
    client.delete(f"/api/conversations/{conv_id}")


def test_conversations_pagination():
    """Verify limit and offset query params on /api/conversations."""
    res = client.get("/api/conversations?limit=2&offset=0")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) <= 2
