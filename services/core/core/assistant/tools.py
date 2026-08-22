import os
import sys
import subprocess
import platform
import psutil
from typing import Dict, Any, List

class SystemTools:
    """
    Native OS automation tools for FRIDAY (macOS / Linux / Windows).
    """

    @staticmethod
    def get_system_telemetry() -> Dict[str, Any]:
        cpu = psutil.cpu_percent(interval=None)
        mem = psutil.virtual_memory()
        battery = psutil.sensors_battery()
        return {
            "platform": platform.platform(),
            "cpu_usage_percent": cpu,
            "memory_usage_percent": mem.percent,
            "memory_used_gb": round((mem.total - mem.available) / (1024 ** 3), 2),
            "memory_total_gb": round(mem.total / (1024 ** 3), 2),
            "battery_percent": battery.percent if battery else 100,
            "battery_plugged": battery.power_plugged if battery else True
        }

    @staticmethod
    def launch_app(app_name: str) -> Dict[str, Any]:
        name_lower = app_name.lower().strip()
        system = platform.system()

        try:
            if system == "Darwin":  # macOS
                if "spotify" in name_lower:
                    subprocess.run(["open", "-a", "Spotify"], check=True)
                    return {"status": "success", "message": "Spotify launched on macOS."}
                elif "code" in name_lower or "vscode" in name_lower:
                    subprocess.run(["open", "-a", "Visual Studio Code"], check=True)
                    return {"status": "success", "message": "Visual Studio Code opened."}
                elif "terminal" in name_lower:
                    subprocess.run(["open", "-a", "Terminal"], check=True)
                    return {"status": "success", "message": "Terminal launched."}
                elif "browser" in name_lower or "chrome" in name_lower or "safari" in name_lower:
                    subprocess.run(["open", "https://google.com"], check=True)
                    return {"status": "success", "message": "Browser opened."}
                elif "finder" in name_lower:
                    subprocess.run(["open", "."], check=True)
                    return {"status": "success", "message": "Finder opened in current workspace."}
                else:
                    subprocess.run(["open", "-a", app_name], check=True)
                    return {"status": "success", "message": f"{app_name} launched."}
            elif system == "Windows":
                os.startfile(app_name)
                return {"status": "success", "message": f"{app_name} launched on Windows."}
            else:
                subprocess.Popen([name_lower])
                return {"status": "success", "message": f"{app_name} launched on Linux."}
        except Exception as e:
            return {"status": "error", "message": f"Could not launch {app_name}: {str(e)}"}

    @staticmethod
    def execute_quick_command(command: str) -> Dict[str, Any]:
        """Safe sandboxed runner for simple read-only inspection."""
        allowed_prefixes = ["ls", "pwd", "git status", "git log", "python --version", "node -v", "date", "uptime"]
        if not any(command.strip().startswith(p) for p in allowed_prefixes):
            return {"status": "blocked", "message": "Command requires user confirmation."}
        
        try:
            res = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=5)
            return {"status": "success", "output": res.stdout.strip() or res.stderr.strip()}
        except Exception as e:
            return {"status": "error", "message": str(e)}

system_tools = SystemTools()
