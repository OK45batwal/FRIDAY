"""Safe File Manager Tool for local search and inspection."""

import os
import re
import subprocess
from typing import Dict, Any
from backend.tools.base import BaseTool
from backend.config.settings import settings


class FileManagerTool(BaseTool):
    name = "file_manager"
    description = "Search for files in authorized workspace by name/pattern, or read content of a specific local file."
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
    # Sensitive file inspection requires explicit human confirmation (CR-03, 0B.1)
    requires_confirmation = True

    SENSITIVE_PATTERNS = [
        ".ssh", ".env", ".aws", ".git", "id_rsa", "id_ed25519",
        "keychain", ".pem", ".key", "friday.db", "secrets", "credential", ".cert"
    ]

    SYSTEM_RESTRICTED_PREFIXES = [
        "/etc/", "/system/", "/library/", "/private/etc/", "/private/var/root/", "/private/var/db/"
    ]

    def _get_workspace_root(self) -> str:
        """Resolve absolute normalized workspace root."""
        raw_root = getattr(settings, "WORKSPACE_ROOT", ".") or "."
        return os.path.realpath(os.path.abspath(os.path.expanduser(raw_root)))

    def _is_sensitive(self, path: str) -> bool:
        """Check if path or filename matches any restricted pattern or system directory."""
        lower_path = path.lower()
        lower_base = os.path.basename(lower_path)

        for sys_prefix in self.SYSTEM_RESTRICTED_PREFIXES:
            if lower_path.startswith(sys_prefix) or sys_prefix in lower_path:
                return True

        for pattern in self.SENSITIVE_PATTERNS:
            if pattern in lower_base or pattern in lower_path.split(os.sep):
                return True
        return False

    async def execute(self, arguments: Dict[str, Any]) -> str:
        action = arguments.get("action", "find").lower().strip()
        target = str(next((arguments[k] for k in ("target", "query", "pattern", "path", "file") if arguments.get(k)), "")).strip()

        if not target:
            return "Error: Target filename or path must be specified."

        workspace_root = self._get_workspace_root()

        if action in ("find", "search", "list"):
            clean_name = target.replace("'", "").replace('"', "").replace("*", "").strip()
            if not clean_name or not re.match(r"^[\w.\-\s/]+$", clean_name):
                return "Error: Invalid filename pattern. Allowed characters: letters, digits, dots, hyphens, underscores, slashes."
            matches = []

            # 1. Spotlight search bounded strictly to workspace root
            try:
                proc = subprocess.run(["mdfind", "-onlyin", workspace_root, "-name", clean_name], capture_output=True, text=True, timeout=4)
                if proc.returncode == 0 and proc.stdout.strip():
                    for l in proc.stdout.strip().splitlines():
                        line = l.strip()
                        if line and not self._is_sensitive(line):
                            matches.append(line)
                            if len(matches) >= 10:
                                break
            except Exception:
                pass

            # 2. Filesystem fallback strictly inside workspace root
            if not matches:
                for root, dirs, files in os.walk(workspace_root):
                    dirs[:] = [d for d in dirs if not d.startswith(".") and d not in ("node_modules", ".venv", "__pycache__", "secrets")]
                    for f in files:
                        if clean_name.lower() in f.lower():
                            cand = os.path.join(root, f)
                            if not self._is_sensitive(cand):
                                matches.append(cand)
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
            # Resolve target relative to workspace root if relative path
            if not os.path.isabs(target):
                expanded_path = os.path.realpath(os.path.abspath(os.path.join(workspace_root, os.path.expanduser(target))))
            else:
                expanded_path = os.path.realpath(os.path.abspath(os.path.expanduser(target)))

            # Security 1: Prevent path traversal outside authorized workspace root (0B.2)
            try:
                common = os.path.commonpath([expanded_path, workspace_root])
                if common != workspace_root:
                    return f"Access Denied: Access to '{target}' is outside the authorized workspace."
            except ValueError:
                return f"Access Denied: Access to '{target}' is outside the authorized workspace."

            # Security 2: Disallow sensitive paths and patterns inside workspace
            if self._is_sensitive(expanded_path) or self._is_sensitive(target):
                return f"Access Denied: Reading sensitive or system file '{target}' is restricted for security."

            if not os.path.exists(expanded_path):
                return f"Error: File not found at '{expanded_path}'."
            if os.path.isdir(expanded_path):
                entries = [e for e in os.listdir(expanded_path) if not self._is_sensitive(e)][:20]
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
