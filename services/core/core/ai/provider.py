from abc import ABC, abstractmethod
from typing import List, Dict, Any, AsyncGenerator

class BaseAIProvider(ABC):
    """
    Abstract interface for all AI model providers in FRIDAY.
    """
    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    async def generate_response(
        self,
        prompt: str,
        system_prompt: str,
        history: List[Dict[str, Any]]
    ) -> str:
        pass
