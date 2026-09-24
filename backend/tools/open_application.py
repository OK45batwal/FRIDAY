"""Open Application Tool for launching local desktop applications."""

import sys
import re
import asyncio
from typing import Dict, Any
from backend.tools.base import BaseTool
from backend.utils.logger import get_logger

logger = get_logger("tool_open_application")


class OpenApplicationTool(BaseTool):
    name = "open_application"
    description = "Launch or open a desktop application by name (e.g. Chrome, Spotify, Calculator, Notes)."
    parameters = {
        "app_name": {
            "type": "string",
            "description": "The exact name of the application to open",
            "required": True,
        }
    }
    requires_confirmation = True

    async def execute(self, arguments: Any) -> str:
        if isinstance(arguments, str):
            app_name = arguments.strip()
        elif isinstance(arguments, dict):
            app_name = str(
                arguments.get("app_name")
                or arguments.get("name")
                or arguments.get("application")
                or arguments.get("app")
                or arguments.get("input")
                or ""
            ).strip()
        else:
            app_name = str(arguments).strip()

        if not app_name:
            return "Error: Application name cannot be empty."

        # Security: sanitize app_name to prevent argument injection or directory traversal
        # Allow alphanumeric, spaces, dashes, dots, underscores
        if not re.match(r"^[\w\s\.\-]+$", app_name):
            return f"Error: Invalid application name '{app_name}'. Contains illegal characters."

        platform = sys.platform

        try:
            if platform == "darwin":  # macOS
                cmd = ["open", "-a", app_name]
            elif platform.startswith("linux"):
                cmd = ["gtk-launch", app_name]
            elif platform == "win32":
                cmd = ["cmd", "/c", "start", "", app_name]
            else:
                return f"Error: Unsupported operating system platform '{platform}'."

            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await proc.communicate()

            if proc.returncode == 0:
                return f"{app_name} opened successfully"
            else:
                err_text = stderr.decode().strip() or stdout.decode().strip()
                return f"Failed to open '{app_name}': {err_text or 'Application not found'}"
        except Exception as e:
            return f"Error opening application '{app_name}': {str(e)}"
