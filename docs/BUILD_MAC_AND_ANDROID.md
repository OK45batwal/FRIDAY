# 📱 FRIDAY: macOS & Android Application Build Guide

This guide details how to run, test, and distribute FRIDAY as a **Native macOS Desktop Application** and a **Native Android Mobile Application**.

---

## 🍎 1. Standalone macOS Application (Electron)

The macOS desktop application includes:
- **Frameless Glass Look**: Native macOS traffic lights with `titleBarStyle: 'hiddenInset'` and vibrancy.
- **Global Summon Hotkey**: Press **`Command + Shift + Space`** from anywhere on your Mac to toggle the floating Cyber Cockpit.
- **macOS Menu Bar Tray**: Quick status tray icon in your top menu bar with instant toggle and quit controls.

### How to Run Locally:
```bash
# 1. Start the backend service in one terminal
PYTHONPATH=. ./services/core/venv/bin/uvicorn services.core.app.main:app --host 0.0.0.0 --port 8000

# 2. In another terminal, start the Electron Desktop App
cd apps/desktop
npm run dev              # Starts Vite frontend
npm run build:electron   # Compiles Electron main & preload scripts
npm run start:electron   # Launches native macOS window
```

---

## 🤖 2. Native Android Mobile Application (Capacitor)

The Android mobile application is scaffolded under `apps/desktop/android/` with:
- Native permissions for Microphone Voice Recognition (`RECORD_AUDIO`).
- Full network & WebSocket access (`INTERNET`, `ACCESS_NETWORK_STATE`).
- Safe-area support for Android gesture bars and notch displays.

### How to Build & Run on Android:

#### Option A: Android Studio (Recommended)
```bash
cd apps/desktop
npm run android:sync   # Builds latest web bundle and syncs native assets
npm run android:open   # Opens project directly in Android Studio
```
*In Android Studio, click **Run** (Green Play button) to install directly on your connected Android phone or emulator.*

#### Option B: Direct APK Build (Command Line)
```bash
cd apps/desktop
npm run android:sync
cd android
./gradlew assembleDebug
```
The compiled APK will be generated at:
`apps/desktop/android/app/build/outputs/apk/debug/app-debug.apk`

---

## ⚡ 3. Summary of Available Scripts

| Platform | Command | Description |
|---|---|---|
| **macOS** | `npm run build:electron` | Compiles Electron TypeScript (`electron/main.ts` $\rightarrow$ `dist-electron/`) |
| **macOS** | `npm run start:electron` | Launches standalone macOS Electron desktop window |
| **Android** | `npm run android:sync` | Builds web app & syncs into native Android project |
| **Android** | `npm run android:open` | Launches project in Android Studio |
