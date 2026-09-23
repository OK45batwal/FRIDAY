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
    return settings

