# FRIDAY — Autonomous Local AI Assistant & Neural Lab

> **College Project Expo Showcase • Version 2.0.0**  
> A private, offline-first personal AI assistant and neural architecture laboratory powered by **Ollama (`gemma2:2b`)**, an asynchronous **FastAPI** agentic backend, **SQLite WAL** long-term memory, and a custom **PyTorch Transformer** built completely from scratch.

---

## Architecture Overview

FRIDAY is architected in two complementary layers:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRIDAY FRONTEND (HUD)                            │
│   Futuristic Neon HUD • Real-time SSE Streams • Web Speech API • Expo Mode │
└───────────────────────┬─────────────────────────────────────────────────────┘
                        │ HTTP / SSE / WebSockets
┌───────────────────────▼─────────────────────────────────────────────────────┐
│                        BACKEND ORCHESTRATION ENGINE                         │
│                    FastAPI • Asyncio • Pydantic v2                          │
├───────────────────────┬───────────────────────────────┬─────────────────────┤
│     AI ORCHESTRATOR   │        MEMORY ENGINE          │    TOOL REGISTRY    │
│  • Intent Classifier  │  • Short-term Rolling Window  │  • Safe Math AST    │
│  • Prompt Manager     │  • Long-term SQLite WAL       │  • System Status    │
│  • Stream Parser      │  • Auto-extract facts/profile │  • Weather (Meteo)  │
│  • Ollama Client      │  • Semantic / Keyword Recall  │  • DuckDuckGo Lite  │
│    (gemma2:2b)        │                               │  • Local File Search│
│                       │                               │  • Time & Timezones │
└───────────────────────┴───────────────────────────────┴─────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────────────┐
│                      CUSTOM PYTORCH NEURAL LAB (TAB 3)                      │
│   Scratch 17.5M Decoder-Only Transformer • RoPE • RMSNorm • SwiGLU • GQA    │
│   Zero-copy Memory-mapped Training Pipeline • KV-Cache In-browser Testing   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Features

- **100% Local & Offline**: Powered by Ollama (`gemma2:2b`) running on Apple Silicon Metal or CPU. Zero cloud API subscription required.
- **Agentic Tool Calling**: Synthesizes structured tool invocations:
  - `calculator`: Deterministic Python AST evaluation with safe operator limits.
  - `system_status`: Real-time macOS battery, CPU, RAM, and disk utilization via `psutil`/`sysctl`.
  - `weather`: Meteorological conditions and forecasts via Open-Meteo.
  - `web_search`: Live web snippets via DuckDuckGo Lite.
  - `file_manager`: Local file search and safe sandbox inspection.
  - `current_time`: Precise local and international timestamps.
- **Dual-Tier Memory System**:
  - **Short-Term**: Configurable in-memory sliding window for active conversation turns.
  - **Long-Term**: SQLite WAL database storing categorized knowledge (profile, preferences, facts) with automatic heuristic extraction.
- **Cyberpunk HUD Interface**:
  - Tab 1: **Command Center** (interactive chat with markdown rendering, code copying, live telemetry, and tool activity accordions).
  - Tab 2: **Voice HUD** (circular audio visualizer with Web Speech API speech-to-text and text-to-speech).
  - Tab 3: **Neural Lab** (interactive scratch PyTorch LLM playground and architecture specs).
  - Tab 4: **College Expo Demo Mode** (5 guided presentation buttons and 1-click Auto-Run full flow).
  - Tab 5: **System Settings** (temperature, max tokens, memory toggles).

---

## Quickstart

### Prerequisites
- macOS (Apple Silicon recommended) or Linux
- Python 3.10+
- [Ollama](https://ollama.ai) installed with `gemma2:2b`

### 1-Click Startup
Start Ollama and the FRIDAY web server in a single command:
```bash
./run.sh
```

Then open your browser to:
- **HUD Interface**: [http://127.0.0.1:8080](http://127.0.0.1:8080)
- **Interactive API Docs**: [http://127.0.0.1:8080/docs](http://127.0.0.1:8080/docs)
- **Health Check**: [http://127.0.0.1:8080/api/health](http://127.0.0.1:8080/api/health)

### Manual Setup
```bash
# 1. Create and activate virtualenv
python3 -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start Ollama and pull model
ollama serve &
ollama pull gemma2:2b

# 4. Start FRIDAY
python -m backend.main
```

---

## College Expo Live Demonstration Guide

To demonstrate FRIDAY to project evaluators:
1. Navigate to the **Expo Demo Mode** tab in the HUD.
2. Click **"Auto-Run Full Demo (1 → 4)"** for an autonomous sequential demonstration, or click individual cards:
   - **Demo 1 (Conversation)**: Tests greeting and low-latency token streaming.
   - **Demo 2 (Deep Reasoning)**: Prompts multi-layer neural network explanation.
   - **Demo 3 (Live Tools)**: Runs math AST (`125 * 48`) and retrieves live system hardware status.
   - **Demo 4 (Long-Term Memory)**: Ingests user identity and recalls it from SQLite.
   - **Demo 5 (Voice HUD)**: Activates real-time speech input and reactive HUD visualizer.
3. Observe live tool calls, parameters, and timings in the **Live Telemetry Inspector** card below the buttons.

---

## Directory Structure

```text
.
├── backend/                   # FRIDAY v2 Full-Stack Backend
│   ├── ai/                    # LLM Orchestrator, Ollama Client, Prompt Manager
│   ├── api/                   # FastAPI Endpoints (Chat SSE, Memory, Tools, Settings)
│   ├── config/                # Environment Settings (Pydantic Settings)
│   ├── database/              # SQLite WAL Engine, Models, Repositories
│   ├── memory/                # Short-term Window & Long-term Knowledge Extractors
│   ├── tools/                 # Tool Registry & 6 Pluggable Tool Implementations
│   ├── utils/                 # Structured Logger
│   ├── voice/                 # Voice Configuration & Audio Handlers
│   └── main.py                # FastAPI Application Entrypoint
├── web/                       # Cyberpunk HUD Frontend
│   ├── index.html             # Single-Page Application (5 views)
│   ├── style.css              # Glassmorphic Futuristic Styling
│   └── app.js                 # SSE Streaming, Web Speech, Tab Routing
├── model/                     # Custom Scratch PyTorch LLM Architecture
│   ├── transformer.py         # RMSNorm, RoPE, SwiGLU, GQA, CustomLLM
│   ├── rope.py                # Rotary Position Embeddings
│   └── generate.py            # KV-Cache Autoregressive Generator
├── train/                     # Neural Pretraining Engine
│   ├── train.py               # AdamW + Cosine Warmup Training Loop
│   └── checkpoint.py          # Weight Serialization
├── data/                      # Memory-Mapped Dataset Shard Pipeline
├── tests/                     # Unified Test Suite (11 Tests)
│   ├── test_friday_core.py    # FRIDAY DB, Memory, Parser & Tools Integration Tests
│   ├── test_model.py          # PyTorch Transformer Block & KV-Cache Tests
│   └── test_training_step.py  # PyTorch Backprop Tests
├── run.sh                     # Automated 1-Click Startup Script
├── requirements.txt           # Unified Python Dependencies
└── pyproject.toml             # Standard Project Metadata
```

---

## Running the Automated Test Suite

```bash
pytest tests/ -v
```

All 11 unit and integration tests validate:
- SQLite WAL database lifecycle and message persistence
- Memory categorization and retrieval
- Safe math AST calculation
- System status hardware probe
- PyTorch custom transformer forward pass and KV-cache exact parity
- RoPE rotary position embeddings calculations
