# 🤖 FRIDAY — AI Operating Assistant

<div align="center">

<img src="https://raw.githubusercontent.com/OK45batwal/FRIDAY/main/apps/desktop/public/favicon.svg" width="96" height="96" alt="FRIDAY Logo" />

# FRIDAY 1.0 (Cyber AI Operating Assistant)
### Private On-Device Neural Intelligence • Voice Cockpit • Multi-Platform

[![Release](https://img.shields.io/github/v/release/OK45batwal/FRIDAY?style=for-the-badge&color=rose)](https://github.com/OK45batwal/FRIDAY/releases/latest)
[![Android](https://img.shields.io/badge/Android-APK%20Native-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/OK45batwal/FRIDAY/releases/latest)
[![macOS](https://img.shields.io/badge/macOS-Apple%20Silicon%20%7C%20Intel-000000?style=for-the-badge&logo=apple)](https://github.com/OK45batwal/FRIDAY/releases/latest)
[![Windows](https://img.shields.io/badge/Windows-10%20%7C%2011-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/OK45batwal/FRIDAY/releases/latest)

</div>

---

## 📥 Official Download Links (Choose Your Platform)

<div align="center">

| 📱 Android Mobile | 🍎 macOS Desktop | 🪟 Windows Desktop |
|:---:|:---:|:---:|
| <img src="https://raw.githubusercontent.com/OK45batwal/FRIDAY/main/apps/desktop/android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png" width="56" height="56" /><br>**Android Phone / Tablet** | 🍏<br>**macOS (Apple Silicon & Intel)** | 🪟<br>**Windows 10 / 11** |
| [⬇️ **Download Android APK**](https://github.com/OK45batwal/FRIDAY/releases/latest) | [⬇️ **Download for Mac**](https://github.com/OK45batwal/FRIDAY/releases/latest) | [⬇️ **Download for Windows**](https://github.com/OK45batwal/FRIDAY/releases/latest) |
| *v0.1.0 • Standalone APK (4.1 MB)* | *v0.1.0 • Universal macOS Client* | *v0.1.0 • Windows 64-bit Client* |

</div>

---

## ✨ Features & Architecture

### 📱 1. Mobile Experience (Android)
- **Mobile-Optimized Touch HUD**: Native safe-area insets, gesture navigation, and full-width fluid dock.
- **Hardware Voice Pipeline**: Low-latency microphone speech-to-text with auto-endpointing.
- **Sub-380MB RAM Neural Engine**: Designed specifically for smartphone processors with zero battery drain.

### 🖥️ 2. Desktop Cockpit (Mac & Windows)
- **Frameless Glass Cyber HUD**: Dark aesthetic with neon rose & cyan ambient glow.
- **Global Summon Hotkey**: Press `Cmd + Shift + Space` (Mac) or `Ctrl + Shift + Space` (Windows) to toggle the cockpit over any app.
- **Top Menu Bar Tray**: Quick hardware telemetry and background process controls.
- **Autonomous OS Agent Tools**: Reminders, web searches, workspace file inspection, and math solvers.

---

## ⚡ Quick Start (Developers)

```bash
# 1. Start Python AI Core Backend
cd services/core
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python -m app.main

# 2. Start Frontend Cockpit
cd apps/desktop
npm install
npm run dev               # Web UI (http://localhost:5173)
npm run start:electron    # Native Desktop Window
```

---

## 📄 License
MIT © 2026 Omkar. All rights reserved.
