# FRIDAY Improvements — UX / Flow / Backend Behavior

Lighter pass than `FIX-PLAN.md` (security). Aimed at daily use of the website + Android app. Ordered by user impact; each item is a small, shippable change.

---

## Top 10 (do these first)

| # | Area | Problem | Fix | Where |
|---|------|---------|-----|-------|
| 1 | Backend chat | Fake streaming: full LLM completion first, then replayed 3 chars / 10ms (~7s artificial lag) | Stream first token from Ollama; yield real chunks (or whole string, no sleep) | `backend/ai/orchestrator.py:204,247` |
| 2 | Backend history | Reopened long chat shows **oldest** 50 messages, not latest | `ORDER BY timestamp DESC LIMIT 50` + reverse in Python | `backend/database/repositories.py:109` |
| 3 | Backend settings | Temperature/top-p changes ignored; nothing survives restart; model 404 silently falls back | Read settings inside call; load settings table in lifespan; surface fallback to UI | `backend/ai/ollama_client.py:48,74`, `backend/main.py` |
| 4 | Web mobile | Sidebar (chats + New Chat) `display:none` <768px → mobile can't reach history | Bottom-sheet or palette entry for Saved Chats / New Chat | `web/style.css:1803`, `web/index.html:600` |
| 5 | Web chat | Errors: static red card, no retry; HTTP failures show "HTTP 503" not server detail | Retry button re-calls `sendMessage`; parse `err.detail` | `web/app.js:874,1152` |
| 6 | Web trust | Hardcoded badges ("MPS ACTIVE", "LOCAL ONLY") never update; dashboard tiles tools/memory stuck at 0 | Derive from `/api/health`; use `arr.length` | `web/index.html:112,139`, `web/app.js:1307` |
| 7 | Android config | Server URL not persisted; ProcessText/overlay/accessibility each build their own client with default `10.0.2.2` | Persist URL (SharedPreferences); share one `FridayApiClient` singleton | `FridayViewModel.kt:110`, `FridayApiClient.kt:43`, entry points |
| 8 | Android errors | Backend-down → canned **fake** replies marked success (incl. fabricated search results) | Propagate offline/`isError`; show "Backend offline" banner | `FridayApiClient.kt:128,425` |
| 9 | Backend voice | Status lies (`tts_available:true` hardcoded); first transcribe pays model load; cloud TTS first | Real ready flags; preload STT; local TTS first | `backend/api/voice.py:32`, `whisper_stt.py`, `voice_service.py:193` |
| 10 | Web settings save | Fire-and-forget `PUT`, no `res.ok`, no toast; Voice Persona select is dead | Check response + toast; wire voice → WS message or remove control | `web/app.js:1340,113` |

---

## Web UI/UX (quick wins)

- **Loading vs empty:** `loadConversations` silent-catch shows "No saved chats yet" on network failure — distinguish error; use dead `.skeleton` CSS (`app.js:409`, `style.css:1839`).
- **Voice errors swallowed:** `speechRecognition.onerror` → all failures become READY; WS reconnect invisible (`app.js:1079,989`).
- **Permission Center is theater:** toggles only write localStorage; mic defaults GRANTED without prompting (`app.js:31,376`).
- **Translate "Click to retry"** — no handler bound (`app.js:1158`).
- **Replace `alert()`/`confirm()`** with existing toast system (`app.js:1194` etc → `showToast` at `:142`).
- **IME:** Enter sends during composition — guard `e.isComposing` (`app.js:897`).
- **Stream render throttle:** full markdown re-render + force-scroll every token → rAF throttle, respect scroll-up (`app.js:865`).
- **A11y:** labels missing `for`; modals lack `role="dialog"`/focus trap; announce completed messages only (`index.html`, `app.js:1513`).
- **Version mismatch:** sidebar v2.5 vs onboarding v3.0 (`index.html:35,678`).
- **Conversation list:** active row matched by title not id; delete/create skip `res.ok` (`app.js:530,510,635`).

## Backend → user-facing flow

- **Ollama down UX:** preflight message is good; cut 60s hang → short connect/first-byte timeout so error fires in ~5s (`ollama_client.py:24`).
- **Non-stream chat lies:** returns `success:true` after exception (`chat.py:73`).
- **Onboarding:** in-memory dict, lost on restart; `user_name` never reaches prompt; client sets localStorage even if POST failed (`onboarding.py:16`, `app.js:1595`).
- **Conversations API:** Python-slice pagination, no `total`; web never passes `limit` (`conversations.py:23`).
- **Health:** `database`/`voice`/`tools` hardcoded true (`health.py:58`); dashboard reads `h.llm_model` never returned (`app.js:1303`).
- **Static:** `/web` mount `html=False` 404s; no `Cache-Control` → stale UI after deploy (`main.py:151`).
- **SSE CORS:** manual `Access-Control-Allow-Origin: *` fights credentialed middleware (`chat.py:100`).

## Android app flow

- **No first-run onboarding:** straight to screen; permissions only if user finds VOICE; backend unreachable → silent "LOCAL ONLY" (`MainActivity.kt:63`).
- **Stuck spinner:** `sendMessage` no try/finally — throw leaves `isSending=true` forever (`FridayViewModel.kt:156`).
- **Misplaced replies:** VOICE-tab prompt and tool output render on CHAT tab (`FridayScreen.kt:359`, `FridayViewModel.kt:317`).
- **Camera permission scare:** voice request bundles CAMERA; torch needs no permission (`MainActivity.kt:35`).
- **QS tile dead end:** prefers fix-field over opening app (`FridayQuickSettingsTileService.kt:16`).
- **URL input:** no validation, field desyncs from state (`FridayScreen.kt:2014,2041`).
- **Placeholders:** Mumbai weather labeled "live", always "ON-DEVICE" badge, v3.0 • METAL claim, demo sandbox text (`DeviceActionManager.kt:197`, `FridayScreen.kt:782,441`).

---

## Suggested order

**PR 1 — Backend feel:** items 1–3, 9 (streaming, history order, settings apply, voice status).  
**PR 2 — Web polish:** items 4–6, 5-retry, loading/error states, toast unification.  
**PR 3 — Android trust:** items 7–8, stuck spinner, URL validation.  
**PR 4 — Remaining:** onboarding, health truth, a11y, placeholders.

Verify: stream first byte <1s (Ollama up); reopen long chat shows latest turn; settings temp change affects next completion after restart; mobile can open saved chats; Android restart keeps server URL; backend-down shows offline, not fake answers.
