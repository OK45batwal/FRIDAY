# FRIDAY — Autonomous Local AI Assistant & Neural Lab

<div align="center">

```
  ███████╗██████╗ ██╗██████╗  █████╗ ██╗   ██╗
  ██╔════╝██╔══██╗██║██╔══██╗██╔══██╗╚██╗ ██╔╝
  █████╗  ██████╔╝██║██║  ██║███████║ ╚████╔╝ 
  ██╔══╝  ██╔══██╗██║██║  ██║██╔══██║  ╚██╔╝  
  ██║     ██║  ██║██║██████╔╝██║  ██║   ██║   
  ╚═╝     ╚═╝  ╚═╝╚═╝╚═════╝ ╚═╝  ╚═╝   ╚═╝   
      v2.5 • Tactile Precision Instrument & Neural Engine
```

**A private, offline-first personal AI assistant and neural architecture laboratory.**  
Powered by **Ollama (`gemma2:2b` / `go1.0`)**, an asynchronous **FastAPI** agentic backend, **SQLite WAL** long-term memory with semantic vector embeddings, and a custom **PyTorch Transformer** engineered completely from scratch.

[![Tests](https://img.shields.io/badge/tests-29%20passed-00e599?style=flat-square&logo=pytest)](file:///Users/omkar/FRIDAY/tests)
[![Python](https://img.shields.io/badge/python-3.10%2B-ff5500?style=flat-square&logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-00e599?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20LLM-white?style=flat-square&logo=ollama)](https://ollama.ai)
[![PyTorch](https://img.shields.io/badge/PyTorch-MPS%20Accelerated-ee4c2c?style=flat-square&logo=pytorch)](https://pytorch.org)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

</div>

---

## Architecture Overview

FRIDAY combines an asynchronous agentic orchestration backend with a modern **Yellow Brutalism Local Intelligence Console**:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   FRIDAY FRONTEND (LOCAL INTELLIGENCE CONSOLE)                         │
│   Yellow Brutalism Design System • 0px Radius • 6px Offset Shadows • Dual Themes       │
│   Hash-Routed Left Rail • Push-to-Talk Voice Meter • Action Ledger • Permission Center │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTP / Server-Sent Events (SSE) / WebSockets
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│                              FASTAPI BACKEND ORCHESTRATOR                              │
│                         Asynchronous • Streaming • Pydantic v2                         │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│     AI ORCHESTRATION     │        MEMORY ENGINE        │         TOOL REGISTRY         │
│  • Streaming Generator   │  • Short-term Sliding Turn  │  • System Info (Hardware)     │
│  • Tool Call Extractor   │  • Long-term SQLite WAL     │  • Safe Math AST Calculator   │
│  • Intent Classifier     │  • Semantic Vector Search   │  • Open-Meteo Weather         │
│  • Ollama Client         │  • Auto-Extracted Facts     │  • DuckDuckGo Search          │
│    (gemma2:2b / go1.0)   │  • Profile & Preferences    │  • Sandboxed File Manager     │
│                          │                             │  • Time & Timezone Tool       │
├──────────────────────────┴─────────────────────────────┴───────────────────────────────┤
│                               MULTIMODAL VOICE PIPELINE                                │
│  • Local Whisper Speech-to-Text (STT)      • Audio-Reactive Waveform Meters            │
│  • Edge-TTS Neural Voice Synthesis (TTS)   • Barge-in & Interruption Detection         │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│                         CUSTOM PYTORCH NEURAL LAB (LAB TAB)                            │
│   17.5M Parameter Decoder-Only Transformer • RoPE • RMSNorm • SwiGLU • GQA             │
│   Memory-Mapped Dataset Pipeline • In-Browser Autoregressive Generation with KV-Cache  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Highlights & Innovations

### 1. Tactile "Precision Instrument" UI/UX
- **Design Pedigree**: Inspired by **Teenage Engineering** (OP-1, TP-7), **Raycast**, **Nothing OS**, and **Linear**.
- **Dark Obsidian Substrate**: Engineered palette using obsidian (`#08090b`), matte instrument panels (`#0e1012`), and precision card surfaces (`#111316`).
- **Signal Accents**: High-contrast, purposeful indicators using Signal Orange (`#ff5500`), Phosphor Green (`#00e599`), and Industrial Amber (`#ffb700`).
- **Hairline Geometry**: Crisp 1px hairline borders (`rgba(255, 255, 255, 0.08)`) and multi-layer atmospheric depth replacing legacy brutalist styling.
- **Precision Typography**: Clean geometric pairing of [Inter](https://fonts.google.com/specimen/Inter) for prose and [Geist Mono](https://fonts.google.com/specimen/Geist+Mono) for telemetry, data, and tabular numbers (`font-feature-settings: "tnum"`).

### 2. Generative Tool Widget System
Rather than outputting raw plain text from tools, FRIDAY renders purpose-built interactive widget cards:
- **Hardware Telemetry (`system_info`)**: Dynamic gauge bars for battery percentage, live memory, disk utilization, and processor architecture chips.
- **Calculation Tape (`calculator`)**: Retro LED-style calculation tape with monospaced expression preview and highlighted answer card with one-click clipboard copying.
- **Weather Station (`weather`)**: Meteorological card displaying current temperature, apparent temperature, humidity, and wind conditions.
- **Precision Clock (`time`)**: Tabular digital clock display with localized date and timezone badges.
- **Search Inspector (`web_search`)**: Numbered result cards with clickable titles, source attribution, and snippet previews.
- **File System Tree (`file_manager`)**: Visual directory listing with file-type iconography and path tracking.

### 3. Voice Mode & Acoustic Meters
- **Glassmorphic Audio Orb**: Precision spherical orb with radial depth, orbital hairline rings, and state-reactive glow rings (`#ff5500` speaking, `#ef4444` listening, `#ffb700` thinking).
- **Segmented Digital Audio Meters**: 32-bar audio spectrum visualizer inspired by Teenage Engineering TP-7 audio hardware.
- **Barge-In & Live Interruption**: Real-time voice interruption allowing users to speak over the assistant and immediately clear the speech queue.
- **Whisper & Edge-TTS Pipeline**: Flexible hybrid architecture supporting local Whisper STT and natural neural speech synthesis.

### 4. Dual-Tier Memory with Semantic Embeddings
- **Short-term Memory**: In-memory sliding window holding recent conversation turns for context continuity.
- **Long-term SQLite WAL**: Persistent knowledge repository auto-extracting user preferences, personal facts, and system metadata.
- **Semantic Vector Recall**: Integrated cosine similarity embedding search for semantic memory retrieval alongside keyword indexing.

### 5. From-Scratch 17.5M PyTorch Transformer
- A clean-room PyTorch implementation of a modern autoregressive transformer:
  - **RMSNorm** for pre-normalization stability
  - **Rotary Position Embeddings (RoPE)** for relative positional encoding
  - **SwiGLU Activation** for enhanced non-linear representation
  - **Grouped-Query Attention (GQA)** for efficient inference memory scaling
  - **KV-Cache** integration for fast incremental token generation

---

## Quickstart

### Prerequisites
- **macOS** (Apple Silicon Metal MPS recommended) or **Linux**
- **Python 3.10+**
- **[Ollama](https://ollama.ai)** installed with `gemma2:2b` or `go1.0`

### 1-Click Startup
Start Ollama and the FRIDAY web server in a single command:
```bash
./run.sh
```

## Android client (new)

The existing FastAPI/web assistant is preserved. The Android-first client lives in
[`android/`](android/) and is intentionally independent: it uses Android system tools and
local storage directly, rather than sending microphone audio or private data to the Python
backend. Cloud AI is not enabled by default.

Open `android/` in a current Android Studio installation with Android SDK 36 and JDK 17+, then:

```bash
cd android
./gradlew :app:assembleDebug
```

The first implementation provides a Compose control surface, a transparent microphone
foreground-service lifecycle, manual-microphone fallback, Room database foundation,
deterministic local request routing, model-runtime interfaces, resource policy, and an
allowlisted tool-safety boundary. A real offline wake-word engine and a local LLM/STT runtime
are deliberately not bundled yet: these are device/model artifacts that must be selected and
licensed before integration. Until then, FRIDAY reports the absence of a local model rather
than silently using cloud processing.

See [`android/README.md`](android/README.md) for architecture, permissions, and limitations.

Then open your browser to:
- **FRIDAY Dashboard**: [http://127.0.0.1:8080](http://127.0.0.1:8080)
### Launching as an Application

- **Native macOS Application (`FRIDAY.app`)**:
  Build and launch the standalone macOS app bundle:
  ```bash
  ./scripts/build_macos_app.sh
  open FRIDAY.app
  ```
- **Installable Progressive Web App (PWA)**:
  Open [http://127.0.0.1:8080](http://127.0.0.1:8080) in Chrome, Safari, or Edge and click **Install FRIDAY** or **Add to Dock** to run it in standalone window mode.
- **Android Native Application**:
  ```bash
  cd android
  ./gradlew :app:assembleDebug
  ```

### Manual Setup

```bash
# 1. Clone repository
git clone https://github.com/OK45batwal/FRIDAY.git
cd FRIDAY

# 2. Set up virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Pull local LLM
ollama pull gemma2:2b

# 5. Run backend server
python -m backend.main
```

---

## Directory Structure

```text
.
├── backend/                   # Full-Stack Asynchronous Backend
│   ├── ai/                    # Orchestration, Ollama Client, Response Parser
│   ├── api/                   # REST & SSE Endpoints (Chat, Voice, Memory, Tools, Settings)
│   ├── config/                # Configuration & Environment Settings (Pydantic)
│   ├── database/              # SQLite WAL Engine, Models, Repositories
│   ├── memory/                # Short-term Window, Long-term DB, Semantic Embeddings
│   ├── tools/                 # Tool Registry & 6 Pluggable Agentic Tools
│   ├── utils/                 # Structured Color Logger
│   ├── voice/                 # Voice Service, Whisper STT, Audio Pipeline
│   └── main.py                # FastAPI Application Entrypoint
├── web/                       # Precision Instrument Frontend
│   ├── index.html             # Single-Page App Structure & Modal Dialogs
│   ├── style.css              # Precision Instrument Tokens, Widgets & Animations
│   └── app.js                 # SSE Streaming, Generative Widgets, TP-7 Audio Meter
├── android/                   # Native Android Assistant (Jetpack Compose + Siri-like Services)
│   ├── app/src/main/java/com/friday/assistant/
│   │   ├── service/           # AccessibilityService, FloatingService & QuickSettingsTile
│   │   ├── ui/                # FridayScreen, ProcessTextActivity, FridayViewModel
│   │   ├── network/           # FridayApiClient with Offline Grammar & Tone Engine
│   │   └── MainActivity.kt    # Main Console Host Activity
│   └── app/src/main/res/      # Layouts, Icons, Dialog Themes & Accessibility Configs
├── model/                     # From-Scratch PyTorch LLM Architecture
│   ├── transformer.py         # RMSNorm, RoPE, SwiGLU, GQA, CustomLLM
│   ├── rope.py                # Rotary Position Embeddings
│   └── generate.py            # KV-Cache Autoregressive Generator
├── train/                     # Neural Pretraining Engine
│   ├── train.py               # AdamW + Cosine Warmup Training Loop
│   └── checkpoint.py          # Model Weight Serialization
├── data/                      # Memory-Mapped Dataset Shard Pipeline
├── tests/                     # Comprehensive Pytest Suite (22 Tests)
│   ├── test_friday_core.py    # Database, Memory, Parser & Tools Tests
│   ├── test_model.py          # PyTorch Transformer & KV-Cache Parity Tests
│   ├── test_tokenizer.py      # Tokenizer Roundtrip Tests
│   ├── test_training_step.py  # Backward Pass Gradient Tests
│   ├── test_translate_and_tasks.py # Translation & Text Processing Tests
│   └── test_voice_pipeline.py # Voice WebSocket, STT & Semantic Search Tests
├── run.sh                     # 1-Click Automated Startup Script
├── requirements.txt           # Unified Dependencies
└── pyproject.toml             # Project Metadata
```

---

## Native Android System Assistant & Siri-Like Integration

FRIDAY includes a native Android companion (`android/`) engineered in Kotlin and Jetpack Compose that brings Siri-like pervasive intelligence directly into the Android operating system:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          ANDROID OS SYSTEM-WIDE INTEGRATIONS                           │
├────────────────────────────────┬───────────────────────────┬───────────────────────────┤
│    CROSS-APP TEXT COMPANION    │    ACCESSIBILITY OBSERVER │    SYSTEM-WIDE OVERLAYS   │
│  • System Process Text Menu    │  • WhatsApp & Gmail Hook  │  • Floating Draggable Pill│
│  • Instant In-Place Replace    │  • Real-Time Edit Detection│  • Quick Settings Tile   │
│  • Tone Rewriter (Work/Chat)   │  • One-Tap Correction API │  • Microphone Hotkey      │
└────────────────────────────────┴───────────────────────────┴───────────────────────────┘
```

1. **System-Wide Text Selection Companion (`ACTION_PROCESS_TEXT`)**:
   - Highlight any text in **WhatsApp**, **Gmail**, **Google Chrome**, **Slack**, or **Notes**.
   - Tap **FRIDAY: Fix Grammar** or **FRIDAY: Rewrite** in the Android context menu to open the floating writing assistant.
   - Switch between **Grammar**, **Gmail (Professional)**, and **WhatsApp (Casual)** modes and tap **REPLACE** to update the text in-place in the source app without copy-pasting.

2. **Real-Time Input Observer (`FridayAccessibilityService`)**:
   - Listens to focused text fields in messaging and email applications.
   - Automatically supports direct in-place text replacement (`ACTION_SET_TEXT`) when invoked.

3. **Siri-Style Draggable Floating Pill (`FridayFloatingService`)**:
   - A persistent, tactile floating overlay with real-time mic and quick-launch triggers accessible from any app across the OS.

4. **Notification Quick Settings Tile (`FridayQuickSettingsTileService`)**:
   - Pull down Android notification quick settings and tap the FRIDAY tile to launch the assistant instantly.

5. **Guaranteed Offline Resilience**:
   - Uses a dual-tier architecture: queries local Ollama models when connected to the host, and automatically falls back to an internal syntax, grammar, and tone engine when completely offline.

---

## Running the Automated Test Suite

Run the full automated test suite verifying database integrity, tool AST evaluation, voice WebSockets, semantic embeddings, and PyTorch model tensor operations:

```bash
pytest tests/ -v
```

```text
============================== test session starts ===============================
collected 22 items

tests/test_friday_core.py::test_database_and_repositories PASSED           [  4%]
tests/test_friday_core.py::test_tools PASSED                               [  9%]
tests/test_friday_core.py::test_response_parser PASSED                     [ 13%]
tests/test_friday_core.py::test_memory_systems PASSED                      [ 18%]
tests/test_friday_core.py::test_voice_service PASSED                       [ 22%]
tests/test_model.py::test_rmsnorm PASSED                                   [ 27%]
tests/test_model.py::test_rope PASSED                                      [ 31%]
tests/test_model.py::test_transformer_forward PASSED                       [ 36%]
tests/test_model.py::test_kv_cache_parity PASSED                           [ 40%]
tests/test_tokenizer.py::test_tokenizer_roundtrip PASSED                   [ 45%]
tests/test_tokenizer.py::test_tokenizer_tensor_return PASSED               [ 50%]
tests/test_training_step.py::test_backward_pass_gradients PASSED           [ 54%]
tests/test_translate_and_tasks.py::test_translate_endpoint_success PASSED   [ 59%]
tests/test_translate_and_tasks.py::test_translate_empty_text PASSED        [ 63%]
tests/test_translate_and_tasks.py::test_email_draft_endpoint PASSED        [ 68%]
tests/test_translate_and_tasks.py::test_text_analysis_endpoint PASSED      [ 72%]
tests/test_voice_pipeline.py::test_voice_service_sentences PASSED          [ 77%]
tests/test_voice_pipeline.py::test_voice_service_local_or_cloud PASSED     [ 81%]
tests/test_voice_pipeline.py::test_whisper_stt_status PASSED               [ 86%]
tests/test_voice_pipeline.py::test_voice_api_endpoints PASSED              [ 90%]
tests/test_voice_pipeline.py::test_voice_websocket_handshake PASSED        [ 95%]
tests/test_voice_pipeline.py::test_semantic_embeddings PASSED              [100%]

======================== 22 passed, 2 warnings in 1.29s =========================
```

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
