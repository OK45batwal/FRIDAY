# 🤖 FRIDAY — AI Operating Assistant

<div align="center">

<img src="https://raw.githubusercontent.com/OK45batwal/FRIDAY/main/apps/desktop/public/favicon.svg" width="108" height="108" alt="FRIDAY Arc Reactor Logo" />

# FRIDAY 1.0
### High-Performance Multi-Platform AI Assistant • Ambient Voice Cockpit • Local Ollama & Cloud LLMs

[![Release](https://img.shields.io/github/v/release/OK45batwal/FRIDAY?style=for-the-badge&color=rose)](https://github.com/OK45batwal/FRIDAY/releases/latest)
[![PWA Ready](https://img.shields.io/badge/PWA-1--Click%20Install-10b981?style=for-the-badge&logo=pwa)](https://github.com/OK45batwal/FRIDAY)
[![Ollama](https://img.shields.io/badge/Ollama-Offline%20Ready-blue?style=for-the-badge)](https://ollama.ai)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

**FRIDAY** is a unified, high-performance AI Operating Assistant designed to run and install seamlessly across **macOS**, **Android**, and **Windows** with **zero installation friction**.

</div>

---

## 🚀 1-Click Multi-Platform Installation (PWA)

FRIDAY is built as an installable **Progressive Web Application (PWA)**:

| 🍏 macOS Desktop | 📱 Android Mobile | 🪟 Windows Desktop |
|:---:|:---:|:---:|
| Open in Chrome / Safari $\rightarrow$ Click **"Install App"** in Navbar or address bar (⨁). Runs as a native desktop window with keyboard shortcuts (`⌘K`). | Open in Chrome $\rightarrow$ Click **"Install App"** or tap **Menu (⋮) → "Add to Home screen"**. Runs full-screen with native mic audio. | Open in Chrome / Edge $\rightarrow$ Click **"Install App"** (⨁). Runs as a dedicated standalone desktop app. |

---

## 🌟 Key Capabilities

* **🎙️ Fullscreen Ambient Voice Cockpit**:
  - Siri & Google Assistant-style full-screen HUD with 3D glowing Voice Orb.
  - Zero-latency turn-taking Voice Activity Detection (VAD) loop.
  - Real-time speech transcription & streaming neural speech synthesis.
* **💻 Claude-Style Artifact Canvas**:
  - Interactive split-pane workspace for generated code, diffs, and live syntax highlighting.
  - 1-click clipboard copy, fullscreen expansion, and code runner.
* **⚡ Spotlight Command Palette (`⌘K` / `Ctrl+K`)**:
  - Floating Raycast-style command bar for instant math, system queries, and quick agent prompts.
* **🧠 Multi-Engine Intelligence**:
  - **Local Offline Ollama (`localhost:11434`)**: Direct integration with Llama 3, Qwen 2.5, and DeepSeek with 0 cloud dependencies.
  - **Cloud Ultra-Fast Streaming**: Direct connector for Groq (<50ms TTFT), OpenRouter, Claude, and OpenAI.
* **🏪 Integrated Store & Agent Hub**:
  - 1-click install and toggle personas: **Senior Architect**, **Calculus & Physics Tutor**, **DevSecOps SRE**, **Technical Writer**.

---

## ⚡ Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/OK45batwal/FRIDAY.git
cd FRIDAY

# 2. Install dependencies & launch
npm install --prefix apps/desktop
npm run dev

# 3. Open in your browser
# Navigate to http://localhost:5173 and click "Install App" ⚡
```

---

## 🥣 Soup Layer-Streaming Fine-Tuning Recipe

FRIDAY includes **Soup (`soup.yaml`)** to fine-tune 7B/8B models on consumer laptops (<4 GB RAM):

```bash
pip install "soup-cli[train]"
npm run train:soup
```


---

## 📄 License
MIT © 2026 Omkar. All rights reserved.
