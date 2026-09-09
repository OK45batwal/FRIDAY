"""Base Tool interface for FRIDAY Tool System."""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class BaseTool(ABC):
    """Abstract interface that all FRIDAY tools must implement."""

    name: str = ""
    description: str = ""
    parameters: Dict[str, Any] = {}
    requires_confirmation: bool = False

    @abstractmethod
    async def execute(self, arguments: Dict[str, Any]) -> str:
        """Execute the tool with validated arguments and return a string result."""
        pass

    def to_schema(self) -> Dict[str, Any]:
        """Export tool metadata for system prompt injection."""
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters,
            "requires_confirmation": self.requires_confirmation,
        }
