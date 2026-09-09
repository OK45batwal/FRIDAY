"""Central Tool Registry with validation and execution logging."""

from typing import Dict, Any, List, Optional
from backend.tools.base import BaseTool
from backend.tools.calculator import CalculatorTool
from backend.tools.time_tool import TimeTool
from backend.tools.search import SearchTool
from backend.tools.weather import WeatherTool
from backend.tools.system_info import SystemInfoTool
from backend.tools.file_manager import FileManagerTool
from backend.database.repositories import ToolLogRepository
from backend.utils.logger import get_logger

logger = get_logger("tool_registry")


class ToolRegistry:
    """Manages available tools, validation, and safe invocation."""

    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}
        self._register_default_tools()

    def _register_default_tools(self):
        """Register the standard suite of tools."""
        self.register(CalculatorTool())
        self.register(TimeTool())
        self.register(SearchTool())
        self.register(WeatherTool())
        self.register(SystemInfoTool())
        self.register(FileManagerTool())

    def register(self, tool: BaseTool):
        """Register a new tool instance."""
        self._tools[tool.name] = tool
        logger.debug(f"Registered tool: {tool.name}")

    def get(self, name: str) -> Optional[BaseTool]:
        """Get tool by name."""
        return self._tools.get(name)

    def list_tools(self) -> List[Dict[str, Any]]:
        """List metadata for all active tools."""
        return [tool.to_schema() for tool in self._tools.values()]

    async def execute(self, tool_name: str, arguments: Dict[str, Any]) -> str:
        """Execute a tool with safety checks, error capture, and database logging."""
        tool = self.get(tool_name)
        if not tool:
            err_msg = f"Error: Tool '{tool_name}' not found. Available tools: {list(self._tools.keys())}"
            await ToolLogRepository.log(tool_name, arguments, err_msg, status="error")
            return err_msg

        logger.info(f"Executing tool '{tool_name}' with args: {arguments}")
        try:
            result = await tool.execute(arguments)
            await ToolLogRepository.log(tool_name, arguments, result, status="success")
            return result
        except Exception as e:
            err_msg = f"Error executing tool '{tool_name}': {str(e)}"
            logger.error(err_msg)
            await ToolLogRepository.log(tool_name, arguments, err_msg, status="error")
            return err_msg


# Global ToolRegistry singleton
tool_registry = ToolRegistry()
