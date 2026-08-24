import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent.parent
RELEASE_DIR = PROJECT_ROOT / "release"


def _split_csv(raw: str) -> list[str]:
    return [item.strip() for item in raw.split(",") if item.strip()]


class Settings:
    # Bind loopback by default. FRIDAY exposes OS control (launch apps, create
    # reminders, read files) over an HTTP API, so it must not be reachable from
    # the LAN unless the operator explicitly opts in via HOST.
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Browser origins allowed to call the API without a token. Never "*" —
    # a wildcard on an unauthenticated OS-control API lets any page the user
    # visits drive the assistant.
    CORS_ORIGINS: list[str] = _split_csv(
        os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000",
        )
    )

    # Shared secret for non-browser clients (Electron renderer, Capacitor,
    # curl). Auto-generated on first run when unset. See app/security.py.
    API_TOKEN: str = os.getenv("FRIDAY_API_TOKEN", "")
    TOKEN_FILE: Path = Path(os.getenv("FRIDAY_TOKEN_FILE", str(Path.home() / ".friday" / "api_token")))

    # Request body ceiling. rules.MAX_INPUT_LENGTH truncates *after* FastAPI has
    # already buffered the body, so the limit has to be enforced at the edge.
    MAX_REQUEST_BYTES: int = int(os.getenv("MAX_REQUEST_BYTES", str(1 * 1024 * 1024)))

    # AI Engine Provider Configuration: "openrouter" | "local_llm"
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "local_llm")
    SUPPORTED_PROVIDERS: tuple[str, ...] = ("local_llm", "openrouter")

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

    # Paths & Dirs
    PROJECT_ROOT: Path = PROJECT_ROOT
    RELEASE_DIR: Path = RELEASE_DIR

    # Filesystem tool sandbox. Deliberately NOT the repo root: the repo contains
    # .env (API keys) and friday.db (all conversations).
    WORKSPACE_DIR: Path = Path(os.getenv("FRIDAY_WORKSPACE_DIR", str(PROJECT_ROOT / "workspace")))

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{BASE_DIR}/friday.db")


settings = Settings()

