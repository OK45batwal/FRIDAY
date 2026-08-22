import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings:
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    CORS_ORIGINS: list[str] = ["*"]

    # Dedicated AI Engine: FRIDAY 1.0 (1.1 Billion Parameters)
    AI_PROVIDER: str = "local_llm"
    MODEL_NAME: str = "FRIDAY 1.0"
    MODEL_PARAMETERS: str = "1.1B Parameters"
    OLLAMA_MODEL: str = "friday-1.0"
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{BASE_DIR}/friday.db")

settings = Settings()
