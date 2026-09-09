"""Tools API Endpoints."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from backend.tools.registry import tool_registry

router = APIRouter(prefix="/api/tools", tags=["tools"])


class ExecuteToolRequest(BaseModel):
    arguments: Optional[Dict[str, Any]] = None


@router.get("")
async def list_tools():
    """List all registered tools and their schemas."""
    return tool_registry.list_tools()


@router.post("/{tool_name}/execute")
async def execute_tool(tool_name: str, req: ExecuteToolRequest):
    """Directly execute a registered tool."""
    tool = tool_registry.get(tool_name)
    if not tool:
        raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found")

    args = req.arguments or {}
    result = await tool_registry.execute(tool_name, args)
    return {
        "tool": tool_name,
        "arguments": args,
        "result": result,
    }
