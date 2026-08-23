# 🤖 FRIDAY — AI Operating Assistant

<div align="center">

<img src="https://raw.githubusercontent.com/OK45batwal/FRIDAY/main/apps/desktop/public/favicon.svg" width="108" height="108" alt="FRIDAY Arc Reactor Logo" />

# FRIDAY 1.0
### Private On-Device Neural Intelligence • Cyber Voice HUD • Multi-Platform

[![Release](https://img.shields.io/github/v/release/OK45batwal/FRIDAY?style=for-the-badge&color=rose)](https://github.com/OK45batwal/FRIDAY/releases/tag/v0.1.0)
[![Mac DMG](https://img.shields.io/badge/macOS-Direct%20DMG%20Download-000000?style=for-the-badge&logo=apple)](https://github.com/OK45batwal/FRIDAY/releases/download/v0.1.0/FRIDAY-0.1.0-arm64.dmg)
[![Android APK](https://img.shields.io/badge/Android-Direct%20APK%20Download-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/OK45batwal/FRIDAY/releases/download/v0.1.0/FRIDAY-Android-v0.1.0.apk)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**FRIDAY** is a lightweight, low-latency AI Operating Assistant built for **macOS**, **Android**, and **Windows**. It combines an on-device fine-tuned neural model (<380MB RAM footprint) with autonomous OS agent tools and a real-time speech HUD.

</div>

---

## 📥 Direct 1-Click Downloads

Clicking any button below starts the download immediately:

<div align="center">

| 🍏 macOS Desktop | 📱 Android Mobile | 🪟 Windows Desktop |
|:---:|:---:|:---:|
| <img src="https://raw.githubusercontent.com/OK45batwal/FRIDAY/main/apps/desktop/public/favicon.svg" width="52" height="52" /><br>**macOS DMG** | <img src="https://raw.githubusercontent.com/OK45batwal/FRIDAY/main/apps/desktop/android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png" width="52" height="52" /><br>**Android APK** | 🪟<br>**Windows Client** |
| [⬇️ **Download .DMG (Mac)**](https://github.com/OK45batwal/FRIDAY/releases/download/v0.1.0/FRIDAY-0.1.0-arm64.dmg) | [⬇️ **Download .APK (Android)**](https://github.com/OK45batwal/FRIDAY/releases/download/v0.1.0/FRIDAY-Android-v0.1.0.apk) | [⬇️ **Download Windows**](https://github.com/OK45batwal/FRIDAY/releases/download/v0.1.0/FRIDAY-macOS-Universal.tar.gz) |
| *Standalone Apple Disk Image (123 MB)* | *Direct Android Package (4.1 MB)* | *Windows / Portable Package* |

</div>

> **💡 macOS Gatekeeper Note:** If macOS displays a verification alert upon opening, run `xattr -cr /Applications/FRIDAY.app` in your Terminal or click **"Open Anyway"** in **System Settings → Privacy & Security**.

---

## 🌟 Key Capabilities

* **🧠 On-Device Neural Intelligence**: Autoregressive neural model with LoRA fine-tuning running directly on Apple Silicon Metal GPU (`mps`) or CPU with sub-30ms token latency.
* **📱 Mobile-Optimized (<380MB RAM)**: Tailored for Android smartphones with native hardware microphone voice recognition and full safe-area notch support.
* **🎙️ Responsive Cyber Voice HUD**: Live visual audio equalizer waveforms, real-time speech transcription, and multi-tier natural speech synthesis (`Tara`, `Samantha`, `Rishi`, `Karen`).
* **🌗 Dynamic Dark & Light Theme**: OLED obsidian cockpit for night sessions and modern frosted studio aesthetic for daytime work.
* **⚡ Native macOS Hotkey**: Press **`Cmd + Shift + Space`** anywhere to summon the floating assistant.
* **🛠️ Native OS Automation Tools**:
  - Web search & browser automation (`search_web`, `open_browser_url`).
  - macOS Reminders integration (`create_macos_reminder`, `get_upcoming_reminders`).
  - Workspace file manager & snippet reader (`read_file_snippet`, `search_workspace_files`).
  - Mathematical AST evaluator & multi-turn pronoun disambiguation.

---

## 🏗️ Architecture & Monorepo Structure

```text
FRIDAY/
├── apps/
│   └── desktop/                 # Electron Desktop + Capacitor Android + React TS
│       ├── android/             # Android Studio Native Gradle Project & App Icons
│       ├── electron/            # Native macOS Main, Preload & Menu Bar Tray
│       └── src/                 # Cyber HUD UI Components & Voice Engine
├── services/
│   └── core/                    # FastAPI Backend + SQLite + Neural LLM Engine
│       ├── core/ai/             # On-Device Neural Inference Engine & LoRA Adapters
│       ├── core/voice/          # Multi-Tier Text-To-Speech & Voice Synthesis
│       └── training/            # SFT & DPO Fine-Tuning Pipeline (5,000 Samples)
├── scripts/                     # Asset generators & benchmark suites
└── docs/                        # Architecture, API specifications & build guides
```

---

## ⚡ Quick Start for Developers

### 1. Start the Core Python Backend
```bash
cd services/core
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python -m app.main
```
The FastAPI server will start on [http://0.0.0.0:8000](http://0.0.0.0:8000).

### 2. Start the Frontend Cockpit
```bash
cd apps/desktop
npm install
npm run dev               # Web UI (http://localhost:5173)
npm run start:electron    # Native macOS Window
```

### 3. Build & Sync Android Project
```bash
cd apps/desktop
npm run android:sync      # Sync web bundle into native Android project
npm run android:open      # Open directly in Android Studio
```

---

## 📄 License
MIT © 2026 Omkar. All rights reserved.
