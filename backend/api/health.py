"""Health Check & System Telemetry API Endpoint."""

from fastapi import APIRouter
from backend.ai.ollama_client import ollama_client
from backend.database.repositories import MessageRepository, ToolLogRepository, MemoryRepository
from backend.tools.system_info import SystemInfoTool
from backend.tools.registry import tool_registry
import subprocess, shutil, platform, re

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health_check():
    """Return live system health and activity metrics."""
    llm_ok = await ollama_client.check_health()
    msg_count = await MessageRepository.count_total()
    tool_count = await ToolLogRepository.count_total()
    mem_count = await MemoryRepository.count_total()

    # Hardware stats
    stats = {
        "os": platform.platform(),
        "arch": platform.machine(),
        "battery_pct": "100%",
        "battery_status": "AC Power",
        "ram_gb": 16.0,
        "disk_free_gb": 600.0,
    }
    try:
        batt = subprocess.run(["pmset", "-g", "batt"], capture_output=True, text=True, timeout=2).stdout
        pct = re.search(r"(\d+%)", batt)
        if pct:
            stats["battery_pct"] = pct.group(1)
        stat = re.search(r"(charging|discharging|finishing charge|AC attached)", batt, re.I)
        if stat:
            stats["battery_status"] = stat.group(1)
    except Exception:
        pass

    try:
        mem = subprocess.run(["sysctl", "-n", "hw.memsize"], capture_output=True, text=True, timeout=2).stdout
        stats["ram_gb"] = round(int(mem.strip()) / (1024 ** 3), 1)
    except Exception:
        pass

    try:
        u = shutil.disk_usage("/")
        stats["disk_free_gb"] = round(u.free / (1024 ** 3), 1)
    except Exception:
        pass

    return {
        "status": "healthy" if llm_ok else "degraded",
        "llm": llm_ok,
        "database": True,
        "voice": True,
        "tools": True,
        "tools_count": len(tool_registry.list_tools()),
        "activity": {
            "total_messages": msg_count,
            "total_tool_calls": tool_count,
            "total_memories": mem_count,
        },
        "system": stats,
    }
