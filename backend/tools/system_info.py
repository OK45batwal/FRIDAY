"""Live System Information Tool for hardware telemetry."""

import os
import re
import shutil
import platform
import subprocess
from typing import Dict, Any
from backend.tools.base import BaseTool


class SystemInfoTool(BaseTool):
    name = "system_info"
    description = "Check live laptop hardware metrics: battery level, power state, RAM, CPU architecture, and disk storage."
    parameters = {}
    requires_confirmation = False

    async def execute(self, arguments: Dict[str, Any]) -> str:
        lines = []
        lines.append(f"Operating System: macOS ({platform.platform()})")
        lines.append(f"Processor Architecture: {platform.machine()}")

        # Battery
        try:
            batt = subprocess.run(["pmset", "-g", "batt"], capture_output=True, text=True, timeout=3).stdout
            pct = re.search(r"(\d+%)", batt)
            stat = re.search(r"(charging|discharging|finishing charge|AC attached)", batt, re.I)
            pct_val = pct.group(1) if pct else "100%"
            stat_val = stat.group(1) if stat else "AC Connected"
            lines.append(f"Battery: {pct_val} ({stat_val})")
        except Exception:
            lines.append("Battery: Desktop / AC Powered")

        # RAM
        try:
            mem = subprocess.run(["sysctl", "-n", "hw.memsize"], capture_output=True, text=True, timeout=3).stdout
            ram_gb = round(int(mem.strip()) / (1024 ** 3), 1)
            lines.append(f"Total RAM: {ram_gb} GB")
        except Exception:
            pass

        # Storage
        try:
            usage = shutil.disk_usage("/")
            free_gb = round(usage.free / (1024 ** 3), 1)
            total_gb = round(usage.total / (1024 ** 3), 1)
            lines.append(f"Disk Storage: {free_gb} GB free of {total_gb} GB")
        except Exception:
            pass

        return "\n".join(lines)
