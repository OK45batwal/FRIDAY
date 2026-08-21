# FRIDAY Architecture Overview

## Monorepo Layout

```text
FRIDAY/
├── apps/
│   └── desktop/                 # Electron + React + TypeScript Frontend
├── services/
│   └── core/                    # FastAPI Backend + SQLite + AI Providers
├── packages/
│   └── shared/                  # Shared TypeScript types & constants
└── docs/                        # Specifications and Guides
```

## Request Pipeline

```text
                USER
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
      TEXT              VOICE
         │                 │
         │          Speech-to-Text
         │                 │
         └────────┬────────┘
                  │
                  ▼
          REQUEST VALIDATION
                  │
                  ▼
        CONVERSATION MANAGER (SQLite)
                  │
                  ▼
      ASSISTANT ORCHESTRATOR
                  │
                  ▼
            AI PROVIDER (Mock / OpenAI / Gemini / Ollama)
                  │
                  ▼
          RESPONSE PROCESSOR
                  │
          ┌───────┴────────┐
          ▼                ▼
        TEXT              VOICE (Web Speech Synthesis / TTS)
```
