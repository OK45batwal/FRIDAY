"""Tests for Device Continuity & Universal Clipboard API endpoints."""

import pytest


def test_list_devices(client):
    """Verify GET /api/devices returns ecosystem device registry."""
    res = client.get("/api/devices")
    assert res.status_code == 200
    data = res.json()
    assert "devices" in data
    assert data["continuity_active"] is True
    assert data["clipboard_synced"] is True
    devices = data["devices"]
    assert len(devices) >= 3
    platforms = [d["platform"] for d in devices]
    assert "macOS" in platforms
    assert "Android" in platforms
    assert "Web" in platforms


def test_clipboard_lifecycle(client):
    """Verify reading and broadcasting clipboard text across ecosystem."""
    # Get current clipboard
    get_res = client.get("/api/devices/clipboard")
    assert get_res.status_code == 200
    initial = get_res.json()
    assert "content" in initial

    # Broadcast new clipboard text
    test_content = "FRIDAY Continuity Test Sync 42"
    post_res = client.post(
        "/api/devices/clipboard",
        json={"content": test_content, "source_device": "pytest-client"},
    )
    assert post_res.status_code == 200
    post_data = post_res.json()
    assert post_data["status"] == "synced"
    assert post_data["clipboard"]["content"] == test_content
    assert post_data["clipboard"]["source_device"] == "pytest-client"

    # Verify updated content on subsequent GET
    verify_res = client.get("/api/devices/clipboard")
    assert verify_res.status_code == 200
    assert verify_res.json()["content"] == test_content


def test_device_handover(client):
    """Verify dispatching cross-device tasks and error handling on unknown device."""
    # Handover to Mac
    mac_res = client.post(
        "/api/devices/handover",
        json={
            "target_device": "mac",
            "action": "open_url",
            "payload": {"url": "https://github.com/OK45batwal/FRIDAY"},
        },
    )
    assert mac_res.status_code == 200
    mac_data = mac_res.json()
    assert mac_data["status"] == "dispatched"
    assert mac_data["target_device"] == "mac"

    # Handover to Android
    android_res = client.post(
        "/api/devices/handover",
        json={
            "target_device": "android",
            "action": "notify",
            "payload": {"title": "Task Ready"},
        },
    )
    assert android_res.status_code == 200
    assert android_res.json()["target_device"] == "android"

    # Handover to nonexistent device
    bad_res = client.post(
        "/api/devices/handover",
        json={
            "target_device": "smart-fridge",
            "action": "cool",
            "payload": {},
        },
    )
    assert bad_res.status_code == 404
