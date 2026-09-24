from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from backend.tools.registry import tool_registry
from backend.tools.approval import create_approval_token

router = APIRouter(prefix="/api/tools", tags=["tools"])


class ApproveToolRequest(BaseModel):
    arguments: Optional[Dict[str, Any]] = None


class ExecuteToolRequest(BaseModel):
    arguments: Optional[Dict[str, Any]] = None
    approval_token: Optional[str] = None


@router.get("")
async def list_tools():
    """List all registered tools and their schemas."""
    return tool_registry.list_tools()


@router.post("/{tool_name}/approve")
async def approve_tool(tool_name: str, req: Optional[ApproveToolRequest] = None):
    """Issue a single-use approval token for a confirmation-required tool (0B.1)."""
    tool = tool_registry.get(tool_name)
    if not tool:
        raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found")

    args = req.arguments if req else None
    token = create_approval_token(tool.name, arguments=args)
    return {
        "tool": tool.name,
        "approval_token": token,
        "expires_in": 300,
    }


@router.post("/{tool_name}/execute")
async def execute_tool(tool_name: str, req: ExecuteToolRequest):
    """Directly execute a registered tool."""
    tool = tool_registry.get(tool_name)
    if not tool:
        raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found")

    args = req.arguments or {}

    # If tool requires confirmation and no token was provided, reject immediately with 403
    if tool.requires_confirmation and not req.approval_token:
        raise HTTPException(
            status_code=403,
            detail=f"Access Denied: Tool '{tool_name}' requires explicit confirmation. Please obtain an approval token via POST /api/tools/{tool_name}/approve.",
        )

    try:
        result = await tool_registry.execute(tool_name, args, approval_token=req.approval_token)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

    return {
        "tool": tool_name,
        "arguments": args,
        "result": result,
    }


@router.post("/{tool_name}/read")
async def read_tool_alias(tool_name: str, req: Optional[ExecuteToolRequest] = None):
    """Convenience alias for tool read action with approval token enforcement."""
    req_obj = req or ExecuteToolRequest()
    if req_obj.arguments is None:
        req_obj.arguments = {}
    req_obj.arguments.setdefault("action", "read")
    return await execute_tool(tool_name, req_obj)

