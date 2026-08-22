import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings:
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    CORS_ORIGINS: list[str] = ["*"]

    # AI Engine Provider Configuration: "openrouter" | "gemini" | "openai" | "local_llm"
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "local_llm")
    
    # Cloud Frontier LLM Keys & Models (ChatGPT, Claude, Gemini)
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Dedicated Local SLM Engine & Fine-Tuned Neural Inference
    MODEL_NAME: str = "FRIDAY 1.0"
    MODEL_PARAMETERS: str = "0.5B Parameters"
    LOCAL_MODEL_BASE: str = os.getenv("LOCAL_MODEL_BASE", "Qwen/Qwen2.5-0.5B-Instruct")
    LOCAL_MODEL_PATH: str = os.getenv("LOCAL_MODEL_PATH", str(BASE_DIR / "training/output/friday_1_0_finetuned"))
    OLLAMA_MODEL: str = "friday-1.0"
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{BASE_DIR}/friday.db")

settings = Settings()
