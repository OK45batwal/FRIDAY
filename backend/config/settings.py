"""FRIDAY Application Configuration.

Loads environment variables with robust defaults for local development.
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for FRIDAY assistant."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "FRIDAY"
    APP_VERSION: str = "2.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Server Binding
    HOST: str = "127.0.0.1"
    PORT: int = 8080

    # Local LLM Runtime (Ollama)
    LLM_PROVIDER: str = "ollama"
    LLM_MODEL: str = "gemma2:2b"
    OLLAMA_BASE_URL: str = "http://127.0.0.1:11434"
    LLM_TEMPERATURE: float = 0.3
    LLM_TOP_P: float = 0.9
    LLM_MAX_TOKENS: int = 512

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./friday.db"
    SQLITE_DB_PATH: str = "friday.db"

    # Feature Flags
    ENABLE_MEMORY: bool = True
    ENABLE_VOICE: bool = True
    ENABLE_DEMO_MODE: bool = True

    # Logging
    LOG_LEVEL: str = "INFO"

    # Project Metadata
    PROJECT_NAME: str = "FRIDAY"
    GITHUB_URL: str = "https://github.com/OK45batwal/FRIDAY"


# Global singleton instance
settings = Settings()
