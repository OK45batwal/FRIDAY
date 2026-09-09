"""Data models and schemas for FRIDAY database."""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import uuid


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class Conversation(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    title: str = "New Conversation"
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


class Message(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    conversation_id: str
    role: str  # "user", "assistant", "system", "tool"
    content: str
    timestamp: str = Field(default_factory=utc_now_iso)
    metadata: Optional[Dict[str, Any]] = None


class Memory(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    content: str
    category: str = "general"  # "preference", "project", "personal", "fact"
    importance: float = 1.0     # 0.0 to 1.0
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


class ToolLog(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    tool_name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)
    result: str = ""
    status: str = "success"  # "success", "error", "pending"
    timestamp: str = Field(default_factory=utc_now_iso)


class SystemLog(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    level: str = "INFO"
    message: str
    timestamp: str = Field(default_factory=utc_now_iso)


class SystemStats(BaseModel):
    llm_connected: bool = True
    llm_model: str = "gemma2:2b"
    database_connected: bool = True
    memory_count: int = 0
    tools_count: int = 6
    voice_available: bool = True
    total_messages: int = 0
    total_tool_calls: int = 0
    battery_pct: str = "100%"
    ram_gb: float = 16.0
    disk_free_gb: float = 600.0
