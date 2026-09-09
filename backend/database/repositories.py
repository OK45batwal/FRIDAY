"""Async Repositories for SQLite Database Operations."""

import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from backend.database.database import get_db_connection
from backend.database.models import Conversation, Message, Memory, ToolLog


# ============================================================================
# Conversation Repository
# ============================================================================
class ConversationRepository:
    @staticmethod
    async def create(title: str = "New Conversation") -> Conversation:
        conv = Conversation(title=title)
        async with get_db_connection() as conn:
            await conn.execute(
                "INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
                (conv.id, conv.title, conv.created_at, conv.updated_at),
            )
            await conn.commit()
        return conv

    @staticmethod
    async def list_all() -> List[Conversation]:
        async with get_db_connection() as conn:
            cursor = await conn.execute(
                "SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC"
            )
            rows = await cursor.fetchall()
            return [
                Conversation(
                    id=row["id"],
                    title=row["title"],
                    created_at=row["created_at"],
                    updated_at=row["updated_at"],
                )
                for row in rows
            ]

    @staticmethod
    async def get_by_id(conv_id: str) -> Optional[Conversation]:
        async with get_db_connection() as conn:
            cursor = await conn.execute(
                "SELECT id, title, created_at, updated_at FROM conversations WHERE id = ?",
                (conv_id,),
            )
            row = await cursor.fetchone()
            if not row:
                return None
            return Conversation(
                id=row["id"],
                title=row["title"],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
            )

    @staticmethod
    async def update_title(conv_id: str, new_title: str) -> bool:
        now = datetime.now(timezone.utc).isoformat()
        async with get_db_connection() as conn:
            cursor = await conn.execute(
                "UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?",
                (new_title, now, conv_id),
            )
            await conn.commit()
            return cursor.rowcount > 0

    @staticmethod
    async def delete(conv_id: str) -> bool:
        async with get_db_connection() as conn:
            cursor = await conn.execute(
                "DELETE FROM conversations WHERE id = ?", (conv_id,)
            )
            await conn.commit()
            return cursor.rowcount > 0


# ============================================================================
# Message Repository
# ============================================================================
class MessageRepository:
    @staticmethod
    async def add(conversation_id: str, role: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> Message:
        msg = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            metadata=metadata,
        )
        meta_json = json.dumps(metadata) if metadata else None
        async with get_db_connection() as conn:
            await conn.execute(
                "INSERT INTO messages (id, conversation_id, role, content, timestamp, metadata) VALUES (?, ?, ?, ?, ?, ?)",
                (msg.id, msg.conversation_id, msg.role, msg.content, msg.timestamp, meta_json),
            )
            await conn.execute(
                "UPDATE conversations SET updated_at = ? WHERE id = ?",
                (msg.timestamp, conversation_id),
            )
            await conn.commit()
        return msg

    @staticmethod
    async def get_by_conversation(conversation_id: str, limit: int = 50) -> List[Message]:
        async with get_db_connection() as conn:
            cursor = await conn.execute(
                "SELECT id, conversation_id, role, content, timestamp, metadata FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC LIMIT ?",
                (conversation_id, limit),
            )
            rows = await cursor.fetchall()
            messages = []
            for row in rows:
                meta = json.loads(row["metadata"]) if row["metadata"] else None
                messages.append(
                    Message(
                        id=row["id"],
                        conversation_id=row["conversation_id"],
                        role=row["role"],
                        content=row["content"],
                        timestamp=row["timestamp"],
                        metadata=meta,
                    )
                )
            return messages

    @staticmethod
    async def count_total() -> int:
        async with get_db_connection() as conn:
            cursor = await conn.execute("SELECT COUNT(*) as count FROM messages")
            row = await cursor.fetchone()
            return row["count"] if row else 0


# ============================================================================
# Memory Repository (Long-Term Memory)
# ============================================================================
class MemoryRepository:
    @staticmethod
    async def add(content: str, category: str = "general", importance: float = 1.0) -> Memory:
        mem = Memory(content=content, category=category, importance=importance)
        async with get_db_connection() as conn:
            await conn.execute(
                "INSERT INTO memories (id, content, category, importance, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                (mem.id, mem.content, mem.category, mem.importance, mem.created_at, mem.updated_at),
            )
            await conn.commit()
        return mem

    @staticmethod
    async def list_all() -> List[Memory]:
        async with get_db_connection() as conn:
            cursor = await conn.execute(
                "SELECT id, content, category, importance, created_at, updated_at FROM memories ORDER BY importance DESC, updated_at DESC"
            )
            rows = await cursor.fetchall()
            return [
                Memory(
                    id=row["id"],
                    content=row["content"],
                    category=row["category"],
                    importance=row["importance"],
                    created_at=row["created_at"],
                    updated_at=row["updated_at"],
                )
                for row in rows
            ]

    @staticmethod
    async def search(keyword: str) -> List[Memory]:
        async with get_db_connection() as conn:
            cursor = await conn.execute(
                "SELECT id, content, category, importance, created_at, updated_at FROM memories WHERE content LIKE ? ORDER BY importance DESC",
                (f"%{keyword}%",),
            )
            rows = await cursor.fetchall()
            return [
                Memory(
                    id=row["id"],
                    content=row["content"],
                    category=row["category"],
                    importance=row["importance"],
                    created_at=row["created_at"],
                    updated_at=row["updated_at"],
                )
                for row in rows
            ]

    @staticmethod
    async def delete(memory_id: str) -> bool:
        async with get_db_connection() as conn:
            cursor = await conn.execute("DELETE FROM memories WHERE id = ?", (memory_id,))
            await conn.commit()
            return cursor.rowcount > 0

    @staticmethod
    async def count_total() -> int:
        async with get_db_connection() as conn:
            cursor = await conn.execute("SELECT COUNT(*) as count FROM memories")
            row = await cursor.fetchone()
            return row["count"] if row else 0


# ============================================================================
# Tool Log Repository
# ============================================================================
class ToolLogRepository:
    @staticmethod
    async def log(tool_name: str, arguments: Dict[str, Any], result: str, status: str = "success") -> ToolLog:
        t_log = ToolLog(
            tool_name=tool_name,
            arguments=arguments,
            result=result,
            status=status,
        )
        async with get_db_connection() as conn:
            await conn.execute(
                "INSERT INTO tool_logs (id, tool_name, arguments, result, status, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
                (t_log.id, t_log.tool_name, json.dumps(t_log.arguments), t_log.result, t_log.status, t_log.timestamp),
            )
            await conn.commit()
        return t_log

    @staticmethod
    async def count_total() -> int:
        async with get_db_connection() as conn:
            cursor = await conn.execute("SELECT COUNT(*) as count FROM tool_logs")
            row = await cursor.fetchone()
            return row["count"] if row else 0

    @staticmethod
    async def list_recent(limit: int = 20) -> List[ToolLog]:
        async with get_db_connection() as conn:
            cursor = await conn.execute(
                "SELECT id, tool_name, arguments, result, status, timestamp FROM tool_logs ORDER BY timestamp DESC LIMIT ?",
                (limit,),
            )
            rows = await cursor.fetchall()
            logs = []
            for row in rows:
                args = json.loads(row["arguments"]) if row["arguments"] else {}
                logs.append(
                    ToolLog(
                        id=row["id"],
                        tool_name=row["tool_name"],
                        arguments=args,
                        result=row["result"],
                        status=row["status"],
                        timestamp=row["timestamp"],
                    )
                )
            return logs


# ============================================================================
# Settings Repository
# ============================================================================
class SettingsRepository:
    @staticmethod
    async def get(key: str, default: Optional[str] = None) -> Optional[str]:
        async with get_db_connection() as conn:
            cursor = await conn.execute("SELECT value FROM settings WHERE key = ?", (key,))
            row = await cursor.fetchone()
            return row["value"] if row else default

    @staticmethod
    async def set(key: str, value: str) -> None:
        async with get_db_connection() as conn:
            await conn.execute(
                "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                (key, value),
            )
            await conn.commit()

    @staticmethod
    async def get_all() -> Dict[str, str]:
        async with get_db_connection() as conn:
            cursor = await conn.execute("SELECT key, value FROM settings")
            rows = await cursor.fetchall()
            return {row["key"]: row["value"] for row in rows}
