from typing import List, Optional, Dict, Any
from sqlalchemy import func
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from services.core.db.models import Conversation, Message, now_utc


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
        # Efficient query with subquery/aggregation to prevent N+1 query loop
        stmt = (
            select(Conversation, func.count(Message.id).label("msg_count"))
            .outerjoin(Message, Conversation.id == Message.conversation_id)
            .group_by(Conversation.id)
            .order_by(Conversation.updated_at.desc())
            .limit(limit)
        )
        result = await db.execute(stmt)
        rows = result.all()
        return [conv.to_dict(count=count) for conv, count in rows]

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
        await db.delete(conv)
        await db.commit()
        return True


    async def resolve_or_create(self, db: AsyncSession, conversation_id: Optional[str], seed_title: str = "") -> Conversation:
        """
        Return the conversation for `conversation_id`, creating one if it is
        missing or unknown.

        This exists because callers previously passed a sentinel id such as
        "default" that never existed in the database. add_message would create a
        replacement conversation and rebind its *local* variable, so the caller
        kept using the stale id: every turn produced two orphan conversations,
        the user and assistant messages landed in different rows, and
        get_recent_history always returned empty. Resolving once, up front, and
        handing the real object back is what makes history work at all.
        """
        if conversation_id:
            conv = await self.get_conversation(db, conversation_id)
            if conv:
                return conv
        title = (seed_title or "").strip()[:35] or "New Conversation"
        return await self.create_conversation(db, title=title)

    async def add_message(
        self,
        db: AsyncSession,
        conversation_id: str,
        role: str,
        content: str,
        input_type: str = "text",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Message:
        conv = await self.resolve_or_create(db, conversation_id, seed_title=content)

        if conv.title == "New Conversation" and role == "user" and content:
            conv.title = content[:35] + ("..." if len(content) > 35 else "")

        # Touch the parent so list_conversations' ORDER BY updated_at DESC means
        # something. Adding a message does not modify the Conversation row, so
        # `onupdate` never fired and the sidebar was permanently ordered by
        # creation time — an active conversation stayed buried under new empty ones.
        conv.updated_at = now_utc()

        msg = Message(
            # Always the resolved id, never the caller's possibly-stale one.
            conversation_id=conv.id,
            role=role,
            content=content,
            input_type=input_type,
            metadata_json=metadata or {}
        )
        db.add(msg)
        await db.commit()
        await db.refresh(msg)
        return msg

    async def get_message(self, db: AsyncSession, message_id: str) -> Optional[Message]:
        stmt = select(Message).where(Message.id == message_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_exchange(self, db: AsyncSession, message_id: str) -> Optional[Dict[str, str]]:
        """
        Given an assistant message id, return the {prompt, response} pair as it
        was actually stored.

        The feedback endpoint used to accept both the prompt and the response
        text from the client and write them straight into the learned-response
        store, which is consulted before inference. That let any caller pin
        arbitrary output to any prompt permanently. Reconstructing the exchange
        from the database means feedback can only ever reference something FRIDAY
        genuinely said.
        """
        msg = await self.get_message(db, message_id)
        if msg is None or msg.role != "assistant":
            return None

        # The user turn immediately preceding this assistant message.
        stmt = (
            select(Message)
            .where(
                Message.conversation_id == msg.conversation_id,
                Message.role == "user",
                Message.created_at <= msg.created_at,
                Message.id != msg.id,
            )
            .order_by(Message.created_at.desc(), Message.id.desc())
            .limit(1)
        )
        result = await db.execute(stmt)
        prompt_msg = result.scalar_one_or_none()
        if prompt_msg is None:
            return None
        return {
            "conversation_id": msg.conversation_id,
            "prompt": prompt_msg.content,
            "response": msg.content,
        }

    async def get_recent_history(self, db: AsyncSession, conversation_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        # Order/limit in the database. This used to load every message in the
        # conversation into memory and slice in Python.
        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc(), Message.id.desc())
            .limit(limit)
        )
        result = await db.execute(stmt)
        msgs = list(result.scalars().all())
        msgs.reverse()
        return [m.to_dict() for m in msgs]

conversation_manager = ConversationManager()
