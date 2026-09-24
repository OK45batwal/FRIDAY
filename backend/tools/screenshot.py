"""Screenshot Tool for capturing the current screen and saving it locally."""

import os
import sys
import time
import asyncio
from typing import Dict, Any
from backend.config.settings import settings
from backend.tools.base import BaseTool
from backend.utils.logger import get_logger

logger = get_logger("tool_screenshot")


class ScreenshotTool(BaseTool):
    name = "screenshot"
    description = "Capture a screenshot of the computer screen and save it to the workspace screenshots folder."
    parameters = {
        "filename": {
            "type": "string",
            "description": "Optional custom filename for the screenshot (e.g. 'my_screen.png')",
            "required": False,
        }
    }
    requires_confirmation = False

    async def execute(self, arguments: Any) -> str:
        custom_name = None
        if isinstance(arguments, str):
            custom_name = arguments.strip() if arguments.strip() else None
        elif isinstance(arguments, dict):
            custom_name = arguments.get("filename") or arguments.get("name") or arguments.get("input")

        workspace = getattr(settings, "WORKSPACE_ROOT", ".")
        screenshots_dir = os.path.join(workspace, "screenshots")
        os.makedirs(screenshots_dir, exist_ok=True)

        timestamp = int(time.time())
        if custom_name and isinstance(custom_name, str) and custom_name.strip():
            safe_name = os.path.basename(custom_name.strip())
            if not safe_name.lower().endswith(".png"):
                safe_name += ".png"
        else:
            safe_name = f"screenshot_{timestamp}.png"

        target_path = os.path.join(screenshots_dir, safe_name)
        platform = sys.platform

        try:
            if platform == "darwin":  # macOS
                cmd = ["screencapture", "-x", target_path]
                proc = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                await proc.communicate()
                if proc.returncode == 0 and os.path.exists(target_path):
                    return f"Screenshot captured successfully: screenshots/{safe_name}"

            if os.path.exists(target_path):
                return f"Screenshot captured successfully: screenshots/{safe_name}"
            return f"Error: Unable to capture screenshot on platform '{platform}'."
        except Exception as e:
            return f"Error capturing screenshot: {str(e)}"
