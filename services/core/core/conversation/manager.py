from typing import List, Optional, Dict, Any
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from services.core.db.models import Conversation, Message

class ConversationManager:
    async def create_conversation(self, db: AsyncSession, title: str = "New Conversation") -> Conversation:
        conv = Conversation(title=title)
        db.add(conv)
        await db.commit()
        await db.refresh(conv)
        return conv

    async def get_conversation(self, db: AsyncSession, conversation_id: str) -> Optional[Conversation]:
        stmt = select(Conversation).where(Conversation.id == conversation_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_conversations(self, db: AsyncSession, limit: int = 50) -> List[Dict[str, Any]]:
        stmt = select(Conversation).order_by(Conversation.updated_at.desc()).limit(limit)
        result = await db.execute(stmt)
        convs = list(result.scalars().all())
        output = []
        for c in convs:
            msg_stmt = select(Message).where(Message.conversation_id == c.id)
            msg_res = await db.execute(msg_stmt)
            count = len(list(msg_res.scalars().all()))
            c_dict = c.to_dict()
            c_dict["message_count"] = count
            output.append(c_dict)
        return output

    async def rename_conversation(self, db: AsyncSession, conversation_id: str, new_title: str) -> Optional[Conversation]:
        conv = await self.get_conversation(db, conversation_id)
        if not conv:
            return None
        conv.title = new_title.strip()
        await db.commit()
        await db.refresh(conv)
        return conv

    async def delete_conversation(self, db: AsyncSession, conversation_id: str) -> bool:
        conv = await self.get_conversation(db, conversation_id)
        if not conv:
            return False
        # Delete associated messages
        msg_stmt = select(Message).where(Message.conversation_id == conversation_id)
        msg_res = await db.execute(msg_stmt)
        for msg in msg_res.scalars().all():
            await db.delete(msg)
        await db.delete(conv)
        await db.commit()
        return True

    async def add_message(
        self,
        db: AsyncSession,
        conversation_id: str,
        role: str,
        content: str,
        input_type: str = "text",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Message:
        conv = await self.get_conversation(db, conversation_id)
        if not conv:
            conv = await self.create_conversation(db, title=content[:30] if content else "Conversation")
            conversation_id = conv.id

        if conv.title == "New Conversation" and role == "user":
            conv.title = content[:35] + ("..." if len(content) > 35 else "")

        msg = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            input_type=input_type,
            metadata_json=metadata or {}
        )
        db.add(msg)
        await db.commit()
        await db.refresh(msg)
        return msg

    async def get_recent_history(self, db: AsyncSession, conversation_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        stmt = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at.asc())
        result = await db.execute(stmt)
        msgs = list(result.scalars().all())
        if limit:
            msgs = msgs[-limit:]
        return [m.to_dict() for m in msgs]

conversation_manager = ConversationManager()
