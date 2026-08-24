import os
import sys
import glob
import psutil
import datetime
import subprocess
import urllib.parse
from typing import Dict, Any, List
from pathlib import Path
from services.core.app.config import settings

# Sandbox root for every filesystem tool. Deliberately NOT the project root:
# the repo contains .env (OPENROUTER_API_KEY) and friday.db (every
# conversation), so rooting the sandbox there meant "read .env" over an
# unauthenticated endpoint returned the user's API key. The directory is created
# on import so the tools have somewhere valid to operate.
WORKSPACE_ROOT = Path(settings.WORKSPACE_DIR).resolve()
WORKSPACE_ROOT.mkdir(parents=True, exist_ok=True)

# Defence in depth, in case a future change widens WORKSPACE_ROOT again.
DENIED_SUFFIXES = (".env", ".db", ".sqlite3", ".pem", ".key", ".p12", ".keystore")
DENIED_NAMES = ("credentials", "id_rsa", "id_ed25519", ".netrc", ".npmrc", ".git-credentials")

class AgentToolRegistry:
    """
    Native OS & System Tools for FRIDAY 1.0 AI Agent.
    Capabilities:
    1. System Telemetry & Mac Diagnostics
    2. Web Search & Browser Navigation
    3. File System Management (Read, Write, List, Search - Sandbox Protected)
    4. macOS Reminders & Calendar Management (via AppleScript)
    5. Desktop App Launching
    """

    # ---------------- 1. Hardware & System ----------------
    @staticmethod
    def get_system_telemetry() -> Dict[str, Any]:
        """Reads real hardware telemetry (CPU load, RAM usage, battery)."""
        try:
            cpu_percent = psutil.cpu_percent(interval=0.1)
            mem = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            battery = psutil.sensors_battery()
            battery_percent = battery.percent if battery else 100

            return {
                "cpu_usage_percent": cpu_percent,
                "ram_usage_percent": mem.percent,
                "ram_free_gb": round(mem.available / (1024**3), 2),
                "disk_usage_percent": disk.percent,
                "battery_percent": battery_percent,
                "status": "optimal"
            }
        except Exception as e:
            return {"error": str(e), "status": "simulated"}

    @staticmethod
    def get_current_time_and_date() -> Dict[str, str]:
        """Returns the current precise time and date."""
        now = datetime.datetime.now()
        return {
            "time": now.strftime("%I:%M %p"),
            "date": now.strftime("%A, %B %d, %Y"),
            "iso": now.isoformat()
        }

    # ---------------- 2. Web Search & Browser Automation ----------------
    @staticmethod
    def search_web(query: str) -> Dict[str, Any]:
        """Performs a web search by opening the query in the default browser."""
        encoded = urllib.parse.quote(query)
        search_url = f"https://www.google.com/search?q={encoded}"
        try:
            if sys.platform == "darwin":
                subprocess.Popen(["open", search_url])
            return {"status": "success", "url": search_url, "query": query}
        except Exception as e:
            return {"status": "failed", "error": str(e)}

    @staticmethod
    def open_browser_url(url: str) -> Dict[str, Any]:
        """Opens a specific URL in the default macOS browser."""
        if not url.startswith(("http://", "https://")):
            url = "https://" + url
        try:
            if sys.platform == "darwin":
                subprocess.Popen(["open", url])
            return {"status": "success", "url": url}
        except Exception as e:
            return {"status": "failed", "error": str(e)}

    # ---------------- 3. File System Management (Sandbox Enforced) ----------------
    @staticmethod
    def _is_denied_target(path: Path) -> bool:
        """
        Blocks secret-bearing files regardless of where the sandbox root points.

        `_is_safe_workspace_path` proves a path is *inside* the sandbox; this
        proves it is not a credential store. Both checks are required.
        """
        name = path.name.lower()
        if name.startswith("."):
            return True
        if any(name.endswith(suffix) for suffix in DENIED_SUFFIXES):
            return True
        if any(denied in name for denied in DENIED_NAMES):
            return True
        # A dot-directory anywhere in the path (.git, .ssh, .venv) is off limits.
        return any(part.startswith(".") for part in path.parts)

    @staticmethod
    def _is_safe_workspace_path(target_path: Path) -> bool:
        """Ensures the resolved path is strictly contained within the workspace root sandbox."""
        try:
            target_path.resolve().relative_to(WORKSPACE_ROOT)
            return True
        except ValueError:
            return False

    @staticmethod
    def list_directory_contents(target_dir: str = ".") -> Dict[str, Any]:
        """Lists files and folders inside a given workspace directory safely."""
        path = (WORKSPACE_ROOT / target_dir).resolve() if not os.path.isabs(target_dir) else Path(target_dir).resolve()
        
        if not AgentToolRegistry._is_safe_workspace_path(path):
            return {"status": "error", "message": "Access denied: Target path is outside workspace sandbox."}

        if not path.exists() or not path.is_dir():
            return {"status": "error", "message": f"Directory '{target_dir}' does not exist."}

        try:
            entries = []
            for item in sorted(path.iterdir()):
                if item.name.startswith("."):
                    continue
                entries.append({
                    "name": item.name,
                    "type": "directory" if item.is_dir() else "file",
                    "size_bytes": item.stat().st_size if item.is_file() else None
                })
            return {"status": "success", "path": str(path), "entries": entries[:50]}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    @staticmethod
    def read_file_snippet(file_path: str, max_lines: int = 100) -> Dict[str, Any]:
        """Reads content from a text file within workspace safely."""
        path = (WORKSPACE_ROOT / file_path).resolve() if not os.path.isabs(file_path) else Path(file_path).resolve()

        if not AgentToolRegistry._is_safe_workspace_path(path):
            return {"status": "error", "message": "Access denied: Target file is outside workspace sandbox."}

        if AgentToolRegistry._is_denied_target(path):
            return {"status": "error", "message": "Access denied: That file type is protected."}

        if not path.exists() or not path.is_file():
            return {"status": "error", "message": f"File '{file_path}' not found."}

        try:
            lines = []
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                for _ in range(max_lines):
                    # Cap line length too: max_lines alone bounds the number of
                    # reads, not the bytes, so one minified line read the whole file.
                    line = f.readline(4096)
                    if not line:
                        break
                    lines.append(line)
            return {"status": "success", "file": str(path), "content": "".join(lines)}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    @staticmethod
    def search_workspace_files(pattern: str) -> Dict[str, Any]:
        """Finds files in workspace matching a glob pattern."""
        try:
            clean_pattern = pattern.strip().lstrip("/")
            search_str = str(WORKSPACE_ROOT / "**" / clean_pattern)
            matches = glob.glob(search_str, recursive=True)
            rel_matches = [
                os.path.relpath(m, WORKSPACE_ROOT)
                for m in matches
                if AgentToolRegistry._is_safe_workspace_path(Path(m))
                and not AgentToolRegistry._is_denied_target(Path(m).resolve())
            ]
            return {"status": "success", "matches": rel_matches[:20]}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    # ---------------- 4. macOS Reminders (AppleScript with safe parameters) ----------------
    @staticmethod
    def create_macos_reminder(title: str, notes: str = "") -> Dict[str, Any]:
        """Creates a reminder in native macOS Reminders app using parameterized AppleScript."""
        if sys.platform != "darwin":
            return {"status": "unsupported", "platform": sys.platform}

        # Safe AppleScript taking parameters as argv to prevent arbitrary code injection
        script = '''
        on run {reminderTitle, reminderNotes}
            tell application "Reminders"
                make new reminder at end of default list with properties {name:reminderTitle, body:reminderNotes}
            end tell
        end run
        '''
        try:
            subprocess.run(
                # The `--` terminator is load-bearing. Passing values as argv
                # (rather than interpolating them into the script) is necessary
                # but NOT sufficient: osascript parses its own options first, so
                # a title beginning with `-e` injects a second script fragment.
                # A `property` initializer is legal alongside a run handler and
                # executes at load time, giving `do shell script "…"` execution.
                # `--` stops option parsing so the values stay values.
                ["osascript", "-e", script, "--", str(title)[:200], str(notes)[:500]],
                capture_output=True,
                text=True,
                check=True,
                timeout=5
            )
            return {"status": "success", "reminder": title}
        except Exception as e:
            return {"status": "failed", "error": str(e)}

    @staticmethod
    def get_upcoming_reminders() -> Dict[str, Any]:
        """Fetches active reminders from macOS Reminders app."""
        if sys.platform != "darwin":
            return {"status": "unsupported", "reminders": []}

        script = '''
        tell application "Reminders"
            set reminderList to {}
            repeat with r in (reminders of default list whose completed is false)
                set end of reminderList to name of r
            end repeat
            return reminderList
        end tell
        '''
        try:
            res = subprocess.run(["osascript", "-e", script], capture_output=True, text=True, timeout=5)
            names = [n.strip() for n in res.stdout.strip().split(",") if n.strip()]
            return {"status": "success", "reminders": names[:10]}
        except Exception as e:
            return {"status": "failed", "error": str(e), "reminders": []}

    # ---------------- 5. Desktop Application Launching ----------------
    @staticmethod
    def launch_desktop_app(app_name: str) -> Dict[str, Any]:
        """Launches a desktop application on macOS using native 'open -a'."""
        if sys.platform != "darwin":
            return {"status": "unsupported", "platform": sys.platform}

        app_map = {
            "spotify": "Spotify",
            "vscode": "Visual Studio Code",
            "code": "Visual Studio Code",
            "terminal": "Terminal",
            "finder": "Finder",
            "chrome": "Google Chrome",
            "safari": "Safari",
            "reminders": "Reminders",
            "calendar": "Calendar",
            "notes": "Notes"
        }
        resolved = app_map.get(app_name.lower(), app_name)
        try:
            subprocess.Popen(["open", "-a", resolved])
            return {"status": "success", "launched_app": resolved}
        except Exception as e:
            return {"status": "failed", "error": str(e)}

agent_tools = AgentToolRegistry()

