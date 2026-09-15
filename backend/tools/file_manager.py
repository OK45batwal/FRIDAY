"""Safe File Manager Tool for local search and inspection."""

import os
import re
import subprocess
from typing import Dict, Any
from backend.tools.base import BaseTool


class FileManagerTool(BaseTool):
    name = "file_manager"
    description = "Search for files on this computer by name/pattern, or read content of a specific local file."
    parameters = {
        "action": {
            "type": "string",
            "description": "'find' to search for files, or 'read' to view file contents",
            "required": True,
        },
        "target": {
            "type": "string",
            "description": "File name pattern (for find) or file path (for read)",
            "required": True,
        },
    }
    requires_confirmation = False

    async def execute(self, arguments: Dict[str, Any]) -> str:
        action = arguments.get("action", "find").lower().strip()
        target = str(next((arguments[k] for k in ("target", "query", "pattern", "path", "file") if arguments.get(k)), "")).strip()

        if not target:
            return "Error: Target filename or path must be specified."

        if action in ("find", "search", "list"):
            clean_name = target.replace("'", "").replace('"', "").replace("*", "").strip()
            if not clean_name or not re.match(r"^[\w.\-\s/]+$", clean_name):
                return "Error: Invalid filename pattern. Allowed characters: letters, digits, dots, hyphens, underscores, slashes."
            matches = []

            # 1. Spotlight search
            try:
                proc = subprocess.run(["mdfind", "-onlyin", os.getcwd(), "-name", clean_name], capture_output=True, text=True, timeout=4)
                if proc.returncode == 0 and proc.stdout.strip():
                    matches = [l.strip() for l in proc.stdout.strip().splitlines() if l.strip()][:10]
            except Exception:
                pass

            # 2. Filesystem fallback
            if not matches:
                for root, dirs, files in os.walk(os.getcwd()):
                    dirs[:] = [d for d in dirs if not d.startswith(".") and d not in ("node_modules", ".venv", "__pycache__")]
                    for f in files:
                        if clean_name.lower() in f.lower():
                            matches.append(os.path.join(root, f))
                            if len(matches) >= 10:
                                break
                    if len(matches) >= 10:
                        break

            if not matches:
                return f"No files found matching '{target}' in the current workspace."

            lines = [f"Found {len(matches)} matching file(s):"]
            for m in matches:
                size_kb = round(os.path.getsize(m) / 1024, 1)
                lines.append(f"- {m} ({size_kb} KB)")
            return "\n".join(lines)

        elif action in ("read", "view", "cat"):
            expanded_path = os.path.realpath(os.path.abspath(os.path.expanduser(target)))
            workspace_root = os.path.realpath(os.getcwd())

            # Security: Disallow sensitive paths and patterns
            sensitive_patterns = [
                ".ssh", ".env", ".aws", ".git/config", "id_rsa", "id_ed25519",
                "/etc/", "/private/", "/System/", "keychain", ".pem", ".key"
            ]
            path_lower = expanded_path.lower()
            if any(p in path_lower for p in sensitive_patterns):
                return f"Access Denied: Reading sensitive or system file '{target}' is restricted for security."

            # Security: Prevent path traversal outside authorized workspace root
            try:
                common = os.path.commonpath([expanded_path, workspace_root])
                if common != workspace_root:
                    return f"Access Denied: Access to '{target}' is outside the authorized workspace."
            except ValueError:
                return f"Access Denied: Access to '{target}' is outside the authorized workspace."

            if not os.path.exists(expanded_path):
                return f"Error: File not found at '{expanded_path}'."
            if os.path.isdir(expanded_path):
                entries = os.listdir(expanded_path)[:20]
                return f"Directory contents of '{expanded_path}':\n" + "\n".join(f"- {e}" for e in entries)

            try:
                size = os.path.getsize(expanded_path)
                with open(expanded_path, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read(3000)
                res = [f"=== File: {expanded_path} ({size} bytes) ===", content]
                if size > 3000:
                    res.append("\n[Truncated: showing first 3000 characters]")
                return "\n".join(res)
            except Exception as e:
                return f"Error reading file: {str(e)}"

        return f"Unknown file action '{action}'. Supported actions: 'find', 'read'."
