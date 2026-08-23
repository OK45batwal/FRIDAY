# FRIDAY — AI Operating Assistant

<div align="center">

![FRIDAY Cyber Architecture](https://img.shields.io/badge/Architecture-Neural%20LoRA%200.5B-rose?style=for-the-badge)
![macOS](https://img.shields.io/badge/macOS-Apple%20Silicon%20%7C%20Intel-000000?style=for-the-badge&logo=apple)
![Android](https://img.shields.io/badge/Android-APK%20Native-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-v0.115-009688?style=for-the-badge&logo=fastapi)

**FRIDAY is an on-device, low-latency AI Operating Assistant & engineering copilot designed for macOS and Android.**

[**📥 Download Latest Releases**](https://github.com/OK45batwal/FRIDAY/releases) • [**📖 Architecture Docs**](docs/architecture.md) • [**🛠️ Build Guide**](docs/BUILD_MAC_AND_ANDROID.md)

</div>

---

## 📥 Download Links

| Platform | Package | Architecture | Direct Link |
|:---|:---|:---|:---|
| **macOS (Apple Silicon)** | `FRIDAY-macOS-arm64.dmg` | M1 / M2 / M3 / M4 | [⬇️ Download .dmg](https://github.com/OK45batwal/FRIDAY/releases/latest) |
| **macOS (Intel)** | `FRIDAY-macOS-x64.dmg` | Intel 64-bit | [⬇️ Download .dmg](https://github.com/OK45batwal/FRIDAY/releases/latest) |
| **Android Mobile** | `FRIDAY-Android.apk` | ARM64 / Universal | [⬇️ Download .apk](https://github.com/OK45batwal/FRIDAY/releases/latest) |

---

## 🌟 Key Capabilities
- **🧠 On-Device Neural LLM**: Zero-latency neural model with LoRA fine-tuning running directly on Apple Silicon Metal GPU (`mps`).
- **🎙️ Responsive Voice HUD**: Real-time STT speech recognition and multi-tier speech synthesis across installed natural voices.
- **⚡ Native macOS Hotkey**: Press `Cmd + Shift + Space` anywhere to summon the frameless cyber cockpit.
- **📱 Android APK Client**: Native mic permissions, touch haptics, and local network AI sync.
- **🛠️ Native OS Automation**: Mac reminders, browser web searching, workspace file operations, and real-time CPU telemetry.

---

## 🏗️ Monorepo Structure

```text
FRIDAY/
├── apps/
│   └── desktop/                 # Electron Desktop + Capacitor Android + React TS
│       ├── android/             # Android Studio Native Gradle Project
│       ├── electron/            # Native macOS Main, Preload & Tray
│       └── src/                 # Cyber HUD UI Components & Voice Engine
├── services/
│   └── core/                    # FastAPI Backend + SQLite + Neural Inference Engine
│       ├── core/ai/             # On-device Neural LLM & LoRA fine-tuned adapters
│       ├── core/voice/          # Multi-tier Text-To-Speech & Audio synthesis
│       └── training/            # SFT & DPO fine-tuning pipeline
└── docs/                        # Complete setup, API, and packaging guides
```

---

## ⚡ Quick Start (Developers)

### 1. Start the Backend Service
```bash
cd services/core
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python -m app.main
```

### 2. Start the Frontend & Desktop App
```bash
cd apps/desktop
npm install
npm run dev              # Launch Web UI (http://localhost:5173)
npm run start:electron   # Launch Standalone macOS Desktop App
```

### 3. Build Android Mobile APK
```bash
cd apps/desktop
npm run android:sync     # Sync web bundle into native Android project
npm run android:open     # Open directly in Android Studio
```

---

## 📄 License
MIT © 2026 Omkar. All rights reserved.
