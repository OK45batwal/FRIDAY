"""Short-term rolling conversation memory."""

from typing import List, Dict, Any
from backend.database.repositories import MessageRepository
from backend.database.models import Message


class ShortTermMemory:
    """Manages active conversation context within token budget."""

    def __init__(self, max_messages: int = 12):
        self.max_messages = max_messages

    async def get_context(self, conversation_id: str) -> List[Dict[str, str]]:
        """Retrieve recent conversation turns formatted for LLM messages list."""
        if not conversation_id:
            return []

        messages: List[Message] = await MessageRepository.get_by_conversation(
            conversation_id=conversation_id, limit=self.max_messages
        )

        formatted = []
        for msg in messages:
            # Map role safely (user, assistant, system)
            role = msg.role if msg.role in ("user", "assistant", "system") else "user"
            formatted.append({"role": role, "content": msg.content})

        return formatted
