from abc import ABC, abstractmethod
from typing import List, Dict, Any, AsyncGenerator


class ProviderError(Exception):
    """
    Raised when a provider cannot produce a response.

    Cascading used to be decided by string-matching the return value
    ("Error from Cloud Provider ..."), so any error phrased differently — a
    timeout, an auth failure — was handed back to the user verbatim as if it
    were the model's answer, and the local fallback never ran. Providers now
    raise this on failure and the manager catches it to fall back.
    """


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
