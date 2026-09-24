"""FRIDAY Tool System package."""

from backend.tools.base import BaseTool
from backend.tools.calculator import CalculatorTool
from backend.tools.time_tool import TimeTool
from backend.tools.search import SearchTool
from backend.tools.weather import WeatherTool
from backend.tools.system_info import SystemInfoTool
from backend.tools.file_manager import FileManagerTool
from backend.tools.open_website import OpenWebsiteTool
from backend.tools.open_application import OpenApplicationTool
from backend.tools.terminal import TerminalTool
from backend.tools.screenshot import ScreenshotTool
from backend.tools.notes import NotesTool
from backend.tools.registry import tool_registry, ToolRegistry
from backend.tools.approval import create_approval_token, verify_and_consume_token

__all__ = [
    "BaseTool",
    "CalculatorTool",
    "TimeTool",
    "SearchTool",
    "WeatherTool",
    "SystemInfoTool",
    "FileManagerTool",
    "OpenWebsiteTool",
    "OpenApplicationTool",
    "TerminalTool",
    "ScreenshotTool",
    "NotesTool",
    "tool_registry",
    "ToolRegistry",
    "create_approval_token",
    "verify_and_consume_token",
]
