"""Unified Memory Manager coordinating short and long-term memory."""

from typing import List, Dict, Any, Optional
from backend.memory.short_term import ShortTermMemory
from backend.memory.long_term import LongTermMemory
from backend.database.models import Memory


class MemoryManager:
    def __init__(self):
        self.short_term = ShortTermMemory(max_messages=12)
        self.long_term = LongTermMemory()

    async def get_context(self, conversation_id: str, query: str) -> Dict[str, Any]:
        """Fetch both conversation context and relevant long-term memories."""
        history = await self.short_term.get_context(conversation_id)
        memories = await self.long_term.retrieve_relevant_memories(query)

        return {
            "conversation_history": history,
            "long_term_memories": memories,
        }

    async def evaluate_and_store(self, user_text: str) -> Optional[Memory]:
        """Store long term memory if user text contains memorable information."""
        return await self.long_term.save_if_pertinent(user_text)


# Global MemoryManager singleton
memory_manager = MemoryManager()
