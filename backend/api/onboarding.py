"""Onboarding API for FRIDAY first-run experience."""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])


class OnboardingPayload(BaseModel):
    user_name: Optional[str] = "User"
    persona: Optional[str] = "precise"
    enabled_tools: Optional[List[str]] = None


_onboarding_state = {
    "completed": False,
    "user_name": "User",
    "persona": "precise",
    "enabled_tools": ["calculate", "time", "weather", "system_info", "file_manager", "search"],
}


@router.get("/status")
async def get_onboarding_status():
    """Check if first-run onboarding was completed."""
    return _onboarding_state


@router.post("/complete")
async def complete_onboarding(data: OnboardingPayload):
    """Mark onboarding as complete and store preferences."""
    _onboarding_state["completed"] = True
    if data.user_name:
        _onboarding_state["user_name"] = data.user_name
    if data.persona:
        _onboarding_state["persona"] = data.persona
    if data.enabled_tools is not None:
        _onboarding_state["enabled_tools"] = data.enabled_tools
    return {"status": "ok", "state": _onboarding_state}
