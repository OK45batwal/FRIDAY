import os
import sys
import psutil
import datetime
import subprocess
from typing import Dict, Any, Optional

class AgentToolRegistry:
    """
    Native OS & System Tools for FRIDAY 1.0 AI Agent.
    Allows FRIDAY to execute actions across your Mac and system environment.
    """

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
            "safari": "Safari"
        }
        resolved = app_map.get(app_name.lower(), app_name)
        try:
            subprocess.Popen(["open", "-a", resolved])
            return {"status": "success", "launched_app": resolved}
        except Exception as e:
            return {"status": "failed", "error": str(e)}

    @staticmethod
    def execute_safe_bash(command: str) -> Dict[str, Any]:
        """Executes safe local development commands."""
        # Restrict dangerous commands
        forbidden = ["rm -rf /", "mkfs", ":(){ :|:& };:"]
        if any(f in command for f in forbidden):
            return {"status": "blocked", "reason": "Dangerous operation prohibited."}

        try:
            res = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=10)
            return {
                "status": "completed",
                "exit_code": res.returncode,
                "stdout": res.stdout.strip(),
                "stderr": res.stderr.strip()
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

agent_tools = AgentToolRegistry()
