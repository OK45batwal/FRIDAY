"""Long-term persistent semantic memory with evaluation filters."""

import re
from typing import List, Optional, Tuple
from backend.database.repositories import MemoryRepository
from backend.database.models import Memory
from backend.utils.logger import get_logger

logger = get_logger("long_term_memory")

# Common patterns indicating user wants something remembered
REMEMBER_PATTERNS = [
    r"remember\s+that\s+(.*)",
    r"remember\s+(.*)",
    r"don't\s+forget\s+that\s+(.*)",
    r"don't\s+forget\s+(.*)",
    r"my\s+(?:name|project|goal|preference|favorite)\s+is\s+(.*)",
    r"i\s+(?:prefer|like|use|work\s+on)\s+(.*)",
]


class LongTermMemory:
    """Manages persistent facts, preferences, and project context."""

    @staticmethod
    def evaluate_for_memory(user_text: str) -> Optional[Tuple[str, str, float]]:
        """Evaluate if user text contains an explicit or implicit long-term fact to store.

        Returns (content, category, importance) if matched, else None.
        """
        text = user_text.strip()

        for pattern in REMEMBER_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                extracted = match.group(1).strip()
                # Clean trailing punctuation
                extracted = extracted.rstrip(".!?")
                if len(extracted) > 3:
                    # Categorize
                    category = "general"
                    if "project" in text.lower():
                        category = "project"
                    elif "prefer" in text.lower() or "like" in text.lower():
                        category = "preference"
                    elif "name" in text.lower():
                        category = "personal"

                    return (f"User stated: {extracted}", category, 1.0)

        return None

    @staticmethod
    async def save_if_pertinent(user_text: str) -> Optional[Memory]:
        """Automatically evaluate and save if the message contains a memorable fact."""
        eval_result = LongTermMemory.evaluate_for_memory(user_text)
        if eval_result:
            content, category, importance = eval_result
            mem = await MemoryRepository.add(content=content, category=category, importance=importance)
            logger.info(f"Stored long-term memory [{category}]: {content}")
            return mem
        return None

    @staticmethod
    async def retrieve_relevant_memories(query: str, limit: int = 5) -> List[str]:
        """Search and retrieve stored long-term memories relevant to the user query."""
        all_memories = await MemoryRepository.list_all()
        if not all_memories:
            return []

        # Simple token intersection relevance scoring
        query_tokens = set(re.findall(r"\w+", query.lower()))
        scored = []
        for m in all_memories:
            mem_tokens = set(re.findall(r"\w+", m.content.lower()))
            overlap = len(query_tokens & mem_tokens)
            score = overlap * 2.0 + m.importance
            scored.append((score, m.content))

        scored.sort(key=lambda x: x[0], reverse=True)
        # Return memories with positive score, plus top priority memories if empty
        relevant = [m_text for s, m_text in scored if s > 0][:limit]
        if not relevant and all_memories:
            # Fallback: provide top 2 most important memories
            relevant = [m.content for m in all_memories[:2]]

        return relevant
