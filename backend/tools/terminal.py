"""Terminal Execution Tool for running shell commands safely within the workspace."""

import re
import asyncio
from typing import Dict, Any
from backend.config.settings import settings
from backend.tools.base import BaseTool
from backend.utils.logger import get_logger

logger = get_logger("tool_terminal")

# Block destructive patterns that could damage the host system
BLOCKED_PATTERNS = [
    r"\brm\s+(-[a-zA-Z]*\s+)*(/\s*$|/\s+|/\*|/etc|/var|/usr|/bin|/sbin|/System|/Library|~\s*$|~\s+|~/)",
    r"\bmkfs\b",
    r"\bdd\s+if=",
    r":\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:",
    r"\bshutdown\b",
    r"\breboot\b",
    r"\bpoweroff\b",
    r">\s*/dev/sd[a-z]",
    r">\s*/dev/nvme",
]


class TerminalTool(BaseTool):
    name = "terminal"
    description = (
        "Run shell commands inside the workspace directory. "
        "Useful for running Python scripts, git commands, inspecting project files, and tests."
    )
    parameters = {
        "command": {
            "type": "string",
            "description": "The shell command to execute",
            "required": True,
        }
    }
    requires_confirmation = True

    async def execute(self, arguments: Any) -> str:
        if isinstance(arguments, str):
            command = arguments.strip()
        elif isinstance(arguments, dict):
            command = str(
                arguments.get("command")
                or arguments.get("cmd")
                or arguments.get("input")
                or ""
            ).strip()
        else:
            command = str(arguments).strip()

        if not command:
            return "Error: Command cannot be empty."

        # Safety: check against dangerous destruction commands
        for pattern in BLOCKED_PATTERNS:
            if re.search(pattern, command, re.IGNORECASE):
                logger.warning(f"Blocked dangerous command attempt: {command}")
                return "Error: Command rejected by security policy (dangerous system operation detected)."

        workspace_root = getattr(settings, "WORKSPACE_ROOT", ".")

        try:
            # Execute with timeout
            proc = await asyncio.create_subprocess_shell(
                command,
                cwd=workspace_root,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            try:
                stdout_data, stderr_data = await asyncio.wait_for(proc.communicate(), timeout=15.0)
            except asyncio.TimeoutError:
                try:
                    proc.kill()
                except Exception:
                    pass
                return "Error: Command execution timed out after 15 seconds."

            stdout = stdout_data.decode("utf-8", errors="replace").strip()
            stderr = stderr_data.decode("utf-8", errors="replace").strip()

            output_lines = [f"Command finished with return code {proc.returncode}"]
            if stdout:
                output_lines.append(f"STDOUT:\n{stdout}")
            if stderr:
                output_lines.append(f"STDERR:\n{stderr}")
            if not stdout and not stderr:
                output_lines.append("(No output produced)")

            return "\n\n".join(output_lines)
        except Exception as e:
            return f"Error executing terminal command: {str(e)}"
