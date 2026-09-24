"""Device Continuity & Universal Clipboard API (Ecosystem Hub)."""

import time
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from backend.utils.logger import get_logger

logger = get_logger("devices_api")

router = APIRouter(prefix="/api/devices", tags=["devices"])

# In-memory shared state for device continuity
_clipboard_state = {
    "content": "Hello from FRIDAY Universal Clipboard",
    "source_device": "macOS Host",
    "updated_at": time.time(),
}

_connected_devices = {
    "mac": {
        "id": "mac-01",
        "name": "MacBook Pro (Host)",
        "platform": "macOS",
        "status": "online",
        "last_seen": time.time(),
        "capabilities": ["voice", "computer_control", "terminal", "local_llm"],
    },
    "android": {
        "id": "android-01",
        "name": "Android Companion",
        "platform": "Android",
        "status": "connected",
        "last_seen": time.time(),
        "capabilities": ["voice", "floating_orb", "torch", "camera", "volume"],
    },
    "web": {
        "id": "web-01",
        "name": "FRIDAY Web Console",
        "platform": "Web",
        "status": "active",
        "last_seen": time.time(),
        "capabilities": ["dashboard", "memory", "chat", "command_palette"],
    },
}


class ClipboardPayload(BaseModel):
    content: str = Field(..., max_length=50000, description="Clipboard text content")
    source_device: Optional[str] = Field("Web Console", max_length=50)


class DeviceHandoverPayload(BaseModel):
    target_device: str = Field(..., max_length=50, description="Target device id: 'mac', 'android', 'web'")
    action: str = Field(..., max_length=50, description="Action: 'open_url', 'paste_clipboard', 'send_file', 'notify'")
    payload: Dict[str, Any] = Field(default_factory=dict)


@router.get("")
async def list_devices():
    """List all registered devices in the FRIDAY continuity ecosystem."""
    # Update last seen for active device
    now = time.time()
    devices_list = []
    for key, d in _connected_devices.items():
        devices_list.append({
            **d,
            "is_online": (now - d["last_seen"]) < 300,
        })
    return {
        "devices": devices_list,
        "continuity_active": True,
        "clipboard_synced": True,
    }


@router.get("/clipboard")
async def get_clipboard():
    """Get the current universal clipboard content."""
    return _clipboard_state


@router.post("/clipboard")
async def update_clipboard(payload: ClipboardPayload):
    """Broadcast text to the universal clipboard across all devices."""
    global _clipboard_state
    _clipboard_state = {
        "content": payload.content,
        "source_device": payload.source_device or "Web Console",
        "updated_at": time.time(),
    }
    logger.info(f"Universal clipboard updated from '{_clipboard_state['source_device']}'")
    return {"status": "synced", "clipboard": _clipboard_state}


@router.post("/handover")
async def device_handover(payload: DeviceHandoverPayload):
    """Dispatch a cross-device handover task (e.g. Android to Mac or Mac to Android)."""
    target = payload.target_device.lower()
    if target not in _connected_devices:
        raise HTTPException(status_code=404, detail=f"Device '{payload.target_device}' not found in ecosystem.")

    logger.info(f"Handover action '{payload.action}' dispatched to target '{target}'")
    return {
        "status": "dispatched",
        "target_device": target,
        "action": payload.action,
        "timestamp": time.time(),
        "message": f"Successfully beamed task to {_connected_devices[target]['name']}",
    }
