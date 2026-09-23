# FRIDAY Improvement Plan (Detailed)

Expands `IMPROVEMENTS.md` into executable work. Security items stay in `FIX-PLAN.md` — **do not mix**.

**Conventions:** each task = smallest shippable change + one test where logic is non-trivial. PR order is dependency-safe. Estimates assume one familiar contributor.

**Repo facts baked in:** no auth; `process_stream` is the only orchestrator entry; settings DB keys mismatch in-memory attrs (`temperature` vs `LLM_TEMPERATURE`); Android has zero SharedPreferences; tests already have `tests/conftest.py` with `temp_db` + `client`.

---

## PR 1 — Backend feel (streaming, history, settings, voice truth)

**Goal:** replies stream immediately; reopen shows latest turn; settings stick across restart; voice status honest.  
**Est:** 1–1.5 days · **Files:** ~8 · **Risk:** medium (chat path)

### 1.1 History: latest messages on reopen

| | |
|--|--|
| Change | `MessageRepository.get_by_conversation`: `ORDER BY timestamp DESC LIMIT ?` then `rows.reverse()` before return (`repositories.py:106-126`) |
| Test | `test_friday_core.py` — insert 60 msgs, assert returned list length=50 and last element is the 60th message |
| Done when | Open long conversation → last ~50 turns visible; export still chronological |

### 1.2 Real streaming (kill fake replay)

Current: `client.chat()` full completion (`orchestrator.py:204`) → tool detect → or 3-char/10ms replay (`:247-251`, fast-path `:137-140`).

| Path | Change |
|------|--------|
| **No-tool (common)** | Replace non-stream first pass with `async for token in client.chat_stream(...)`. Buffer tokens until (a) a tool-safety window closes (no `{tool:` prefix after N chars) **or** (b) tool syntax detected. Ponytail: simplest correct approach — stream to client as “provisional” answer **only after** first 200 chars with no tool marker; if `{tool:` appears mid-stream, abort client stream, run tool branch, second `chat_stream` for final answer (existing `:208-230`). Tool calls are rare relative to chatty answers. |
| **Tool branch** | Keep two-pass; drop non-stream `client.chat` for pass-1 → use `chat_stream`, accumulate full text, then `parse_tool_call` (parser needs complete text). First tokens of a tool-using reply may be discarded — acceptable; do **not** forward raw tool syntax to UI (already cleaned at `:254`). |
| **Fast path** | Replace 3-char sleep loop with single yield of full `_format_fast_path_response` string (or yield as one `assistant_token`). |
| **No-tool replay** | Delete sleep loop; either pure `chat_stream` (preferred) or if still using cached `initial_response`, yield one event with full text. |

| | |
|--|--|
| Ollama client | Keep `chat()` for translate/tasks callers; orchestrator uses only `chat_stream`. Lower default timeout: `httpx.Timeout(connect=5.0, read=60.0, ...)` on client (`ollama_client.py:24`) so preflight+first-byte fail fast. |
| SSE contract | Unchanged event names (`assistant_token`, `tool_*`, `error`, `assistant_finished`) so `web/app.js` reader (`:801-873`) needs no structural change. |
| Tests | Extend `test_laya_brain.py`: mock `chat_stream` yielding `["Hel","lo"]` → events contain tokens in order, no `asyncio.sleep` delay (assert wall time or call count). Fast-path test already asserts no `client.chat` — keep. New: tool-call path still emits `tool_started`/`tool_completed`. |
| Done when | First `assistant_token` arrives before full completion (manual: watch SSE with Ollama up); no artificial 7s lag on short replies |

### 1.3 Settings that actually apply + survive restart

Root causes: (a) `temperature`/`top_p` are **default args** bound at import (`ollama_client.py:48-49,89-90`); (b) lifespan never reads `SettingsRepository`; (c) PUT stores DB key `temperature` but field is `LLM_TEMPERATURE`; (d) model 404 silently falls back (`:74-83`).

| Step | Detail |
|------|--------|
| 1.3.1 | `chat`/`chat_stream`: read `settings.LLM_TEMPERATURE`, `settings.LLM_TOP_P`, `settings.LLM_MAX_TOKENS` **inside** the function (drop default-arg binding). |
| 1.3.2 | Define one mapping used by PUT + load: request key → settings attr → DB key. Canonical DB keys = settings field names (`LLM_TEMPERATURE`, …) or lowercase consistently — pick **settings attr name** to avoid drift. Fix PUT write path (`api/settings.py:42-47`). |
| 1.3.3 | Lifespan after `init_db()`: `for k,v in SettingsRepository.get_all():` if key maps to known attr, coerce (`bool`/`float`/`int`/`str`) and `setattr(settings, ...)`. Invalid value → log + skip (don’t crash boot). |
| 1.3.4 | On 404 fallback, set a response/event field or `settings` warning flag the UI can show; minimally log WARNING and include `model_fallback: true` in non-stream chat JSON when it happened (thread a return value from `ollama_client` — e.g. `self.last_fallback_model`). |
| Tests | PUT temperature=0.7 → new `Settings()`/reload path sees 0.7; `chat` builds payload with options.temperature==0.7 (mock httpx); restart simulation: `SettingsRepository.set` then call load helper → `settings.LLM_TEMPERATURE==...`; invalid DB value skipped. |
| Done when | Change temp → next completion uses it; restart server → still used; missing model surfaces fallback |

### 1.4 Voice status + local-first TTS

| Step | File | Change |
|------|------|--------|
| 1.4.1 | `api/voice.py:32` | `tts_available`: true only if local `say` **or** deliberate cloud allowed; include `tts_provider: "local"\|"cloud"`, `stt.loaded` from whisper state |
| 1.4.2 | `whisper_stt.py` | Add `loaded` bool; set true after model load; `get_status()` reports real device/engine |
| 1.4.3 | Lifespan (optional P1) | If `ENABLE_VOICE`, `await whisper_stt` warmup in background task — skip if load >2s risk; else leave first-call cost but status shows `loaded:false` → UI “Loading…” |
| 1.4.4 | `voice_service.py:162,186-213` | Default **local-first**: try `say` before `edge_tts` unless `TTS_ALLOW_CLOUD=true`. Flip `TTSRequest.prefer_local` default to `True` **or** ignore flag when settings say local-only (prefer settings flag `TTS_ALLOW_CLOUD`). |
| 1.4.5 | Fix `.aiff` leak | `finally` cleanup in `voice_service.py` around afconvert failure path (`:124-153`) |
| Tests | Status contract: `tts_available` not hardcoded; mock network → default TTS path makes zero outbound calls; STT `loaded` false→true after load. Existing `test_voice_status_contract` extended. |

### PR 1 verification

```
pytest -q
# manual: SSE first token <1s after Ollama responds; reopen 100-msg chat shows tail;
# PUT temp, restart uvicorn, temp still applied; /api/voice/status truthful
```

---

## PR 2 — Web polish (mobile nav, errors, truth, save feedback)

**Goal:** mobile can reach chats; failures recoverable; badges/tiles match reality; settings save confirms.  
**Est:** 1–1.5 days · **Files:** `web/app.js`, `web/index.html`, `web/style.css`

### 2.1 Mobile: surface Saved Chats + New Chat

| | |
|--|--|
| Option A (lazy) | Command palette (`⌘K`) gets “New chat” + “Open chat…” entries that call existing `createConversation` / list picker — no new layout |
| Option B (better) | Hamburger in mobile top bar toggles sidebar as overlay (`.sidebar.open` + backdrop); reuse existing list DOM |
| Pick | **B** if sidebar markup already complete (it is — just `display:none`); add button in mobile bar (`index.html:600-626`), CSS overlay (`style.css` near `:1803`), close on select |
| Test | Manual breakpoint <768px; optional: no JS unit (DOM-heavy) — checklist only |

### 2.2 Chat error recovery + real HTTP detail

| Step | Where | Change |
|------|-------|--------|
| 2.2.1 | `app.js:799` | On `!res.ok`, `const detail = await res.json().catch(()=>null)` → `throw new Error(detail?.detail \|\| \`HTTP ${res.status}\`)` |
| 2.2.2 | `app.js:874-879` | Error card HTML includes `<button data-retry>` → clears card, re-invokes `sendMessage(lastUserText)`; disable while sending |
| 2.2.3 | `app.js:871` | Parse failures: `console.warn` + surface once |
| 2.2.4 | Same pattern | Translate/email/analyze handlers (`:1152,1210,1264`) show `err.message` not bare status |
| Test | Manual: stop backend mid-chat → Retry works; kill Ollama → message includes “unreachable… ollama serve” |

### 2.3 Dashboard/badge truth

| Step | Change |
|------|--------|
| 2.3.1 | `app.js` health poll: write `llm_model` (add field in `health.py` response — **tiny backend add in this PR** or PR1 leftover: `components.llm_model = settings.LLM_MODEL`), `database`, voice flags into DOM |
| 2.3.2 | Replace static `index.html:112,139-147` badges with ids; update on health tick (30s poll already at `:1678`) |
| 2.3.3 | Tiles `:1307,1311`: `Array.isArray(t) ? t.length : …` for tools/memory |
| 2.3.4 | Sidebar/onboarding version: single source `const APP_VERSION` from `/api/info` (`main.py:116`) or package.json injected — fix v2.5 vs v3.0 |

### 2.4 Settings save feedback + wire or kill voice persona

| | |
|--|--|
| Save | `app.js:1339-1347`: `const res = await fetch(PUT)`; `res.ok ? showToast("Settings saved") : showToast(err, "error")`; include temperature/top_p fields in GET load + PUT body |
| Voice persona | If backend has no per-voice selection API: **remove** `#settings-voice` + `settingsVoice` refs (dead control worse than missing). If keeping: persist via PUT new optional field + send `voice` in WS `user_speech` (needs `voice_pipeline.py:207` to read it) — **cut from PR2**, remove control only |

### 2.5 Web quick wins (bundle in PR2)

| Item | Change | Lines |
|------|--------|-------|
| Loading vs empty | `loadConversations` catch → `#conv-list` error row + retry; success `[]` → empty state | `app.js:409-417` |
| Delete/create `res.ok` | Check before toast / surface create error | `app.js:510,635` |
| Active row by id | Compare `data-id` not title text | `app.js:530` |
| Toasts over alert/confirm | Replace ~7 sites with `showToast` / confirm-shaped modal already in palette | `app.js:1194…` |
| IME | `if (e.isComposing \|\| e.keyCode===229) return` | `app.js:897` |
| Translate retry | Bind banner click → last translate fn, or delete “Click to retry” | `app.js:1158` |
| Permission mic | On toggle grant: `getUserMedia({audio:true})` → real GRANTED/DENIED; label files/screen as “app-only” honestly | `app.js:376-398` |
| Voice STT errors | `onerror` → banner text by `error` code; show WS disconnected state | `app.js:1079,989` |
| Stream throttle | rAF-coalesce `renderMarkdown`; only autoscroll if near bottom | `app.js:865` |
| A11y minimal | `for`/`id` on labels; `role="dialog"` + Escape on tool modal | `index.html`, `app.js:1513` |

### PR 2 verification

Mobile <768px: open saved chat, new chat. Backend stop: chat error + retry. Health stop/start: badges flip. Settings change: toast + survives F5 (depends on PR1). Full `pytest` still green.

---

## PR 3 — Android trust (URL persistence, honest errors, no stuck spinner)

**Goal:** configured server sticks; offline is visible; SEND never bricks.  
**Est:** 1–1.5 days · **Files:** ~8 Kotlin + maybe `Application` class

### 3.1 Single shared client + persisted base URL

| Step | Detail |
|------|--------|
| 3.1.1 | No DataStore dep — use **`context.getSharedPreferences("friday", MODE_PRIVATE)`** (framework, zero new deps) |
| 3.1.2 | `object FridayClientHolder` or `FridayApplication.getClient(context)`: constructs `FridayApiClient(baseUrl = prefs.getString("server_url", DEFAULT)!!)` once; `fun setBaseUrl(context, url)` writes prefs + updates client |
| 3.1.3 | Replace all four `FridayApiClient()` sites: `FridayViewModel.kt:59`, `ProcessTextActivity.kt:51`, `FridayAccessibilityService.kt:17`, `FridayFloatingService.kt:45` → holder |
| 3.1.4 | `setCustomServerUrl` → validate `URL` parse + scheme http/https → holder.setBaseUrl + existing health refresh |
| 3.1.5 | STATUS field: `LaunchedEffect(state.customServerUrl) { serverUrlInput = ... }` so external changes sync (`FridayScreen.kt:2014`) |
| Test | JVM unit: prefs round-trip URL (Robolectric not present — keep pure: extract `UrlValidator` fun + JUnit). Manual: set URL, kill app, relaunch, ProcessText uses new URL |

### 3.2 Honest offline / no fake success

| Call site | Change |
|-----------|--------|
| `sendChat` non-200/exception (`:128,131`) | Return `ChatResult(reply = fallback, isOnline = false, isError = true)` **or** dedicated offline message “Backend offline at {url} — start friday backend” without pretending it’s the model |
| UI `FridayViewModel` | When `!isOnline`: toast/banner `state.backendHealth` already flips (`:164`) — add visible snackbar in `FridayScreen` when offline after send |
| `searchWeb` non-200 (`:219`) | Stop `isSuccess=true` on fake list → `isSuccess=false`, message “offline” |
| Other tools | Calculate/email/grammar: keep local fallback but set `isSuccess=false` **or** add `source="local_fallback"` and badge in UI (`FridayScreen.kt:782` stop always “ON-DEVICE”) |
| Test | Mock URL to closed port: `sendChat` → `isOnline=false` (pure JVM if `HttpURLConnection` mocked — else instrumented later); assert no `isSuccess=true` on HTTP 500 for search |

### 3.3 Stuck spinner + command errors

| | |
|--|--|
| Change | `sendMessage` (`FridayViewModel.kt:150-181`): wrap body in `try { ... } catch (e) { insert assistant error msg } finally { isSending=false; assistantState=IDLE }` |
| Same | `handlePotentialDeviceCommand` / `runTool` catch `ActivityNotFoundException` → `ToolResult(..., isSuccess=false, message=e.humanMessage)` |
| Test | Unit: viewmodel with fake client throwing → `isSending` false (requires extracting interface for client — **small seam**: `interface ChatApi { suspend fun sendChat(...) }`, FridayApiClient implements — only if test cost acceptable; else manual checklist) |

### 3.4 Voice permission without CAMERA scare

| | |
|--|--|
| Change | `MainActivity.kt:35-39`: request `RECORD_AUDIO` + notifications only; drop `CAMERA` (torch uses `setTorchMode`, no CAMERA perm). Optional separate path if a future feature needs camera |
| Denial | `:44-49` → toast “Mic needed for voice — enable in Settings” + still open app |
| Manual | Fresh install → PTT asks only mic |

### 3.5 QS tile priority

| | |
|--|--|
| Change | `FridayQuickSettingsTileService.kt:16-20`: **default → open MainActivity**; if `extra = "fix_field"` (or long-press unsupported) then fix-field. Simplest: always open app (fix-field available in-app / overlay). Or: open app when `instance==null` already works; when instance exists, still open app unless tile is in “fix” mode — **prefer always open app** for least surprise |
| Status copy | Soften `FridayScreen.kt:2163` “Hooks active…” if service not actually intervening |

### PR 3 verification

Set custom URL → force-stop → relaunch → health hits new host. Airplane mode → send → banner offline, spinner clears. PTT without camera permission never prompts camera. Tile opens app.

---

## PR 4 — Flow leftovers (onboarding, health, web a11y, placeholders)

**Est:** 1 day

### 4.1 Onboarding durable + name used

| Step | Where | Change |
|------|-------|--------|
| Persist | `api/onboarding.py` | Replace module dict with `SettingsRepository` keys `onboarding_completed`, `user_name`, `persona`, `enabled_tools` (JSON str). GET/POST same routes. |
| Client | `app.js:1572,1595` | Only set localStorage after `res.ok`; on failure show error, don’t skip |
| Name | `prompt_manager` or orchestrator system prompt | If `settings.user_name` / onboarding name ≠ default, inject `The user's name is {name}.` |
| Enabled tools | orchestrator/registry | Filter executable tools to allowlist from onboarding (ties to FIX-PLAN tool policy later — **optional here**: store only, filter if trivial) |
| Test | POST complete → new app state / GET returns persisted after simulating reload of module state (call GET after clearing in-memory if refactored to DB-only) |

### 4.2 Health tells truth

| Field | Source |
|-------|--------|
| `database` | already counts — report `ok` if query succeeded (wrap try/except → false) |
| `voice` | `whisper_stt.get_status().loaded` + tts config |
| `tools` | len(registry) > 0 && init |
| `llm_model` | `settings.LLM_MODEL` (for 2.3) |
| Status | `degraded` if any critical component false |

`test_health_contract` extended: monkeypatch failed DB → `database:false`.

### 4.3 Static serving polish

| | |
|--|--|
| `/web` mount | `html=True` or drop mount if unused (`main.py:151`) |
| Cache | StaticFiles: add middleware `Cache-Control: no-cache` for `*.js,*.css` in dev; `max-age=3600` prod — simplest: custom subclass or header middleware |
| SSE CORS | Remove manual `Access-Control-Allow-Origin: *` (`chat.py:100`) — same-origin web doesn’t need it |

### 4.4 Android placeholders honesty

| Item | Change |
|------|--------|
| Weather `DeviceActionManager.kt:197` | Label “Sample (Mumbai)” or read last location setting; don’t say live |
| Badge `FridayScreen.kt:782` | `source` from ChatResult |
| Version `FridayScreen.kt:441` | Read `BuildConfig.VERSION_NAME` |
| Offline templates signature | Setting default or omit name |
| Sandbox placeholder | Empty string |

### 4.5 Remaining web a11y

Focus trap on open modal; `aria-live` → announce on `assistant_finished` only (remove live from token stream container); `navigator.platform` → `navigator.userAgentData` fallback.

---

## Test matrix (cumulative)

| Concern | Test home | PR |
|---------|-----------|-----|
| Latest-50 history | `tests/test_friday_core.py` | 1 |
| Token streaming order / no fake delay | `tests/test_laya_brain.py` | 1 |
| Settings persist + apply to payload | `tests/test_ui_contracts.py` + unit | 1 |
| Voice status truthful; local TTS no egress | `tests/test_voice_pipeline.py` | 1 |
| Chat HTTP error surface (backend `success` flag) | new `tests/test_chat_api.py` | 1 optional / 2 |
| Health real components | `tests/test_ui_contracts.py` | 4 |
| Onboarding restart | `tests/test_onboarding_and_api.py` | 4 |
| Android URL validate | `android/app/src/test` | 3 |
| Android offline ChatResult | unit or manual checklist | 3 |

**Not in this plan:** auth, tool approval tokens, HTTPS-only Android, rate limits → `FIX-PLAN.md` P0.

---

## Execution order & gates

```
PR1 backend-feel ──► PR2 web ──► PR3 android ──► PR4 leftovers
        │                │              │
        └── pytest green ┴── manual UX checklist ┴── assembleDebug
```

**Global checklist (end state):**
- [ ] First stream byte before full completion; no 3-char replay
- [ ] Reopen long chat → tail visible
- [ ] temperature/model survive restart and affect next call
- [ ] `/api/voice/status` reflects loaded/real TTS provider; default TTS no network
- [ ] Mobile opens saved chats; settings save toasts; dashboard numbers non-zero when data exists
- [ ] Chat/translate errors show server `detail` + retry where applicable
- [ ] Android: URL survives process death; offline ≠ fake AI; SEND never stuck; no CAMERA on mic flow; tile opens app
- [ ] Onboarding name persists and appears in system prompt
- [ ] `pytest -q` green; `./gradlew test` green

## Out of scope (explicit)

Auth/ACL, cleartext network config, tool confirmation tokens, voice payload size caps, rate-limit middleware → see `FIX-PLAN.md`. Do not silently pull those into these PRs.
