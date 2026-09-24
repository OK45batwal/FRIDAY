"""FRIDAY Application Configuration.

Loads environment variables with robust defaults for local development.
"""

import os
from typing import Optional
from pydantic import Field, AliasChoices, ValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for FRIDAY assistant."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = Field(default="FRIDAY", validation_alias=AliasChoices("FRIDAY_APP_NAME", "APP_NAME"))
    APP_VERSION: str = Field(default="2.0.0", validation_alias=AliasChoices("FRIDAY_APP_VERSION", "APP_VERSION"))
    ENVIRONMENT: str = Field(default="development", validation_alias=AliasChoices("FRIDAY_ENVIRONMENT", "ENVIRONMENT"))
    DEBUG: bool = Field(default=True, validation_alias="FRIDAY_DEBUG")

    # Server Binding
    HOST: str = Field(default="127.0.0.1", validation_alias=AliasChoices("FRIDAY_HOST", "HOST"))
    PORT: int = Field(default=8080, validation_alias=AliasChoices("FRIDAY_PORT", "PORT"))

    # Local LLM Runtime (Ollama)
    LLM_PROVIDER: str = "ollama"
    LLM_MODEL: str = "gemma2:2b"
    OLLAMA_BASE_URL: str = "http://127.0.0.1:11434"
    LLM_TEMPERATURE: float = 0.3
    LLM_TOP_P: float = 0.9
    LLM_MAX_TOKENS: int = 512

    # Database
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./friday.db",
        validation_alias=AliasChoices("FRIDAY_DATABASE_URL", "DATABASE_URL"),
    )
    SQLITE_DB_PATH: str = Field(
        default="friday.db",
        validation_alias=AliasChoices("FRIDAY_SQLITE_DB_PATH", "SQLITE_DB_PATH"),
    )

    # Feature Flags
    ENABLE_MEMORY: bool = True
    ENABLE_VOICE: bool = True
    ENABLE_DEMO_MODE: bool = True

    # Laya Fast Decision Router (System 1)
    ENABLE_LAYA: bool = True
    LAYA_CHECKPOINT: str = "convaiinnovations/laya"
    LAYA_PRELOAD: bool = True
    LAYA_CONFIDENCE_THRESHOLD: float = 0.75
    LAYA_DEVICE: Optional[str] = None

    # Security & Trust Boundary (P0-A)
    FRIDAY_ALLOW_REMOTE: bool = Field(
        default=False,
        validation_alias=AliasChoices("FRIDAY_ALLOW_REMOTE", "ALLOW_REMOTE"),
    )
    FRIDAY_API_KEY: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("FRIDAY_API_KEY", "API_KEY"),
    )

    # Tools & Workspace Sandbox (P0-B)
    WORKSPACE_ROOT: str = Field(
        default=".",
        validation_alias=AliasChoices("FRIDAY_WORKSPACE_ROOT", "WORKSPACE_ROOT"),
    )

    # Voice Pipeline & TTS Policy (P0-B)
    TTS_ALLOW_CLOUD: bool = Field(
        default=False,
        validation_alias=AliasChoices("FRIDAY_TTS_ALLOW_CLOUD", "TTS_ALLOW_CLOUD"),
    )
    TTS_MODE: str = Field(
        default="local",
        validation_alias=AliasChoices("FRIDAY_TTS_MODE", "TTS_MODE"),
    )
    MAX_VOICE_PAYLOAD_BYTES: int = Field(
        default=10 * 1024 * 1024,  # 10 MB
        validation_alias=AliasChoices("FRIDAY_MAX_VOICE_PAYLOAD_BYTES", "MAX_VOICE_PAYLOAD_BYTES"),
    )
    MAX_TTS_TEXT_LENGTH: int = Field(
        default=4000,
        validation_alias=AliasChoices("FRIDAY_MAX_TTS_TEXT_LENGTH", "MAX_TTS_TEXT_LENGTH"),
    )

    # Logging
    LOG_LEVEL: str = "INFO"

    # Project Metadata
    PROJECT_NAME: str = "FRIDAY"
    GITHUB_URL: str = "https://github.com/OK45batwal/FRIDAY"


_settings_load_error: Optional[ValidationError] = None

try:
    settings = Settings()
except ValidationError as _exc:
    _settings_load_error = _exc
    settings = Settings.model_construct()


def validate_settings() -> Settings:
    """Validate runtime settings and raise clearly if configuration failed to load."""
    if _settings_load_error is not None:
        raise _settings_load_error

    # CR-01 / 0A.1: Fail startup if binding non-loopback unless ENVIRONMENT=production and FRIDAY_ALLOW_REMOTE=true
    loopback_hosts = {"127.0.0.1", "localhost", "::1"}
    if settings.HOST not in loopback_hosts:
        if not (settings.ENVIRONMENT == "production" and settings.FRIDAY_ALLOW_REMOTE):
            raise RuntimeError(
                f"Refusing to bind to non-loopback host '{settings.HOST}'. "
                "Non-loopback binding requires ENVIRONMENT=production and FRIDAY_ALLOW_REMOTE=true."
            )

    return settings

