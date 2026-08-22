# 🏛️ FRIDAY AI Core Rules & Architecture Specification

This document defines the **AI Core Rules**, behavioral contracts, and end-to-end decision flow for **FRIDAY** — the Personal AI Operating Assistant for Omkar.

---

## 🎯 1. Core Purpose & Definition
* **Who uses it?**: Omkar.
* **What problem does it solve?**: Private, ultra-fast computational copilot that executes code, controls Mac OS desktop applications, inspects hardware diagnostics, solves mathematics, and retrieves personal project context with zero latency.
* **What can it do?**:
  - Full-stack software engineering and architecture design.
  - Native desktop automation (Spotify, VS Code, Terminal, Finder).
  - Accurate arithmetic and multi-unit conversions.
  - Semantic document search via local RAG vector memory.
  - Multi-turn conversational reasoning.
* **What should it NOT do?**:
  - Take destructive actions (deleting files, wiping system) without explicit confirmation.
  - Invent facts, fake telemetry, or hallucinatory formulas.

---

## 🏗️ 2. The 6-Stage Request-to-Response Pipeline

```text
User Message
    ↓
1. Validation & Normalization Layer (Strip null bytes, length guard)
    ↓
2. Intent Router & Safety Boundary Check (Destructive Actions / OS Tools / Math / RAG)
    ↓
3. Context & Sliding Memory Manager (Short-term window + RAG recall)
    ↓
4. AI Brain (Cloud Frontier GPT-4o/Claude/Gemini OR On-Device FRIDAY 1.0 SLM)
    ↓
5. Output Formatter & Voice Synthesizer (Markdown code blocks & Linear PCM WAV)
    ↓
6. User Screen & Studio Audio Playback
```

---

## 📜 3. The 10 Golden Rules Applied to FRIDAY

| # | Golden Rule | FRIDAY Implementation |
|---|---|---|
| 1 | **Define Purpose Clearly** | Configured as personal AI operating assistant & senior software architect. |
| 2 | **Understand Intent First** | `AICoreRules.classify_intent()` routes before touching LLM. |
| 3 | **Use the Right Tool** | Calculator for math, `psutil` for telemetry, RAG for documents. |
| 4 | **No Hallucinated Facts** | Exact mathematical solver & strict grounded prompt templates. |
| 5 | **Manage Context Carefully** | Sliding 8-turn conversation window + selective long-term vector store. |
| 6 | **Validate Input & Output** | Rejects empty strings, sanitizes control chars, strips code tags in voice. |
| 7 | **Require Confirmation for Risk** | Intercepts `rm -rf`, disk wipes, or database drops with security warning. |
| 8 | **Separate Brain & Components** | Clean modularity: UI, FastAPI Router, Orchestrator, AI Provider, Memory, Tools. |
| 9 | **Test Edge Cases & Failures** | Unit test suite in `services/core/tests/test_core.py` and `ui_ux.test.ts`. |
| 10 | **RLHF Continuous Learning** | Real-time 👍 (Reward +1) and 👎 (Loss -1) feedback memory store. |

---

## 🛡️ 4. Safety & Tool Execution Boundaries

* **Read-Only / Diagnostic Actions**: Executed immediately (Telemetry, Date/Time, Searching RAG).
* **Benign Desktop Actions**: Executed immediately (Launching Spotify, Opening VS Code, Launching Terminal).
* **Destructive Actions**: Flagged with security warning (`AICoreRules.check_safety_boundary`).
