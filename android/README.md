# FRIDAY Android

This is the Android-first client added alongside—not in place of—the existing Python/FastAPI
and web project.

## Architecture

`Compose UI → ViewModel → Router → allowlisted Android tools or LocalLlmEngine`

The foreground service is user-visible and never continuously runs an LLM. It exists only for
assistant activity that needs to survive the UI, and the notification explicitly shows that
FRIDAY is active. Microphone activation currently uses the visible manual control. The wake-word,
VAD, STT, TTS, and local-LLM interfaces are isolated so an approved offline implementation can
be connected without changing the UI/router/safety boundary.

## Build

Use Android Studio with JDK 17+, Android SDK 36, then run `./gradlew :app:assembleDebug` from
this directory. A Gradle wrapper is included for reproducible builds.

## Privacy and safety

- Local-only is the default; no Android cloud endpoint is configured.
- The app requests microphone permission only when the user turns on background assistant mode.
- Android 13+ notification permission is requested alongside it to keep background activity
  visible.
- There is no shell, arbitrary command, or arbitrary intent tool.
- Every tool is allowlisted. Sensitive/destructive operations must pass a confirmation step
  before execution.
- Room storage is local. Audio retention is not implemented.

## Current limitations / next integration points

- No model binary, wake-word model, offline STT model, or embedding model is bundled.
- `UnavailableLocalLlmEngine` is an honest safe fallback. Replace it with a vetted Android
  runtime such as llama.cpp or MediaPipe only after deciding model packaging/licensing and testing
  it on target hardware.
- Android app launch, timers, file selection, and confirmation UI are planned tool adapters;
  they must use Android scoped APIs and runtime permission checks.
- The existing Python backend remains available for desktop/local-network development but is not
  a fallback for Android local-only mode.
