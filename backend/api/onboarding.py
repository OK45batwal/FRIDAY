"""Onboarding API for FRIDAY first-run experience (Batch P1.3)."""

import json
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from backend.database.repositories import SettingsRepository
from backend.tools.registry import tool_registry

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])

ALLOWED_PERSONAS = {"precise", "creative", "concise", "iron_man", "helpful"}
DEFAULT_ENABLED_TOOLS = [
    "calculator",
    "time",
    "weather",
    "system_info",
    "file_manager",
    "web_search",
    "open_website",
    "open_application",
    "terminal",
    "screenshot",
    "notes",
]


class OnboardingPayload(BaseModel):
    user_name: Optional[str] = Field("User", min_length=1, max_length=50)
    persona: Optional[str] = Field("precise", max_length=50)
    enabled_tools: Optional[List[str]] = Field(None, max_length=50)


@router.get("/status")
async def get_onboarding_status():
    """Check if first-run onboarding was completed (persisted across restarts)."""
    completed_str = await SettingsRepository.get("onboarding_completed", "false")
    user_name = await SettingsRepository.get("user_name", "User")
    persona = await SettingsRepository.get("persona", "precise")
    tools_json = await SettingsRepository.get("enabled_tools")

    if tools_json:
        try:
            enabled_tools = json.loads(tools_json)
        except Exception:
            enabled_tools = DEFAULT_ENABLED_TOOLS
    else:
        enabled_tools = DEFAULT_ENABLED_TOOLS

    return {
        "completed": completed_str.lower() in ("true", "1", "yes"),
        "user_name": user_name,
        "persona": persona,
        "enabled_tools": enabled_tools,
    }


@router.post("/complete")
async def complete_onboarding(data: OnboardingPayload):
    """Validate and persist onboarding preferences to the database."""
    # Validate persona against allowlist
    persona_clean = (data.persona or "precise").strip().lower()
    if persona_clean not in ALLOWED_PERSONAS:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid persona '{data.persona}'. Allowed personas: {sorted(list(ALLOWED_PERSONAS))}",
        )

    # Validate tools against registered tools/aliases
    validated_tools = []
    if data.enabled_tools is not None:
        for t in data.enabled_tools:
            t_clean = t.strip().lower()
            if tool_registry.get(t_clean) is not None:
                # Store the canonical tool name
                canonical = tool_registry.get(t_clean).name
                if canonical not in validated_tools:
                    validated_tools.append(canonical)
            else:
                raise HTTPException(
                    status_code=422,
                    detail=f"Invalid tool '{t}'. Tool is not registered.",
                )
    else:
        validated_tools = DEFAULT_ENABLED_TOOLS

    user_name_clean = (data.user_name or "User").strip()

    # Persist in DB
    await SettingsRepository.set("onboarding_completed", "true")
    await SettingsRepository.set("user_name", user_name_clean)
    await SettingsRepository.set("persona", persona_clean)
    await SettingsRepository.set("enabled_tools", json.dumps(validated_tools))

    return {
        "status": "ok",
        "state": {
            "completed": True,
            "user_name": user_name_clean,
            "persona": persona_clean,
            "enabled_tools": validated_tools,
        },
    }
