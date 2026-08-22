import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings:
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    CORS_ORIGINS: list[str] = ["*"]

    # Active AI Provider: "local_llm" | "openrouter" | "gemini"
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "local_llm")
    
    # Local Custom SLM: FRIDAY 1.0
    MODEL_NAME: str = "FRIDAY 1.0"
    MODEL_PARAMETERS: str = "1.1B Parameters"
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "friday-1.0")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    # Cloud Frontier LLMs (ChatGPT, Claude 3.5 Sonnet, Gemini 2.0)
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-001")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{BASE_DIR}/friday.db")

settings = Settings()
