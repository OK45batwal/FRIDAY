---
status: issues_found
depth: deep
files_reviewed: 108
files_reviewed_list: /private/tmp/friday-code-review-scope.txt (106 maintained source, config, and test files), README.md, .env.example
findings:
  critical: 5
  warning: 10
  info: 4
  total: 19
reviewed: 2026-09-23
---

# FRIDAY Whole-Codebase Review

## Scope and method

This was a read-only deep review of the 106 files in the supplied maintained-source scope, plus `README.md` and `.env.example`. It traced the browser, FastAPI, tool, persistence, voice, Android, and test boundaries rather than limiting review to the most recent commit. Generated assets, datasets, lockfiles, and build output were excluded.

The Python source tree compiles with `.venv/bin/python -m compileall`. The complete test run cannot collect in this environment: the process-level `DEBUG=release` overrides `.env` and `Settings.DEBUG: bool` rejects it during import. That is recorded below as a configuration robustness issue; it is not evidence that the test assertions pass.

## Executive assessment

FRIDAY has sensible local primitives (parameterized SQLite queries, AST-based calculator evaluation, command-array subprocess use, and HTML escaping before markdown rendering). The shipping boundary is not safe, however: the backend can bind publicly while exposing every conversation, memory, settings, tool, voice, and administrative action without authentication. The Android client also permits plaintext requests to arbitrary server URLs, including text selected from other apps. Address the trust boundary before adding capabilities.

## BLOCKER findings

### CR-01: Network-reachable backend exposes all private data and tool execution without authentication

**Evidence:** `backend/config/settings.py:25-27`, `backend/main.py:84-101`, `backend/api/conversations.py:20-98`, `backend/api/memory.py:17-40`, `backend/api/settings.py:21-48`, `backend/api/tools.py:15-34`, `backend/api/chat.py:37-140`, `backend/api/voice.py:28-107`

**Impact:** The production default binds Uvicorn to `0.0.0.0`, yet there is no authentication or authorization on any API or WebSocket. Any host that can reach the port can read, alter, or delete conversations and memories; change model settings; invoke file search/read and web tools; send prompts; and use voice resources. Browser CORS does not protect direct HTTP clients, native apps, or WebSockets.

**Remediation:** Bind to loopback by default and fail startup on non-loopback binding unless an explicit production mode is configured. Add an authentication dependency to every HTTP router and verify a token/origin during WebSocket handshake; authorize conversation and memory ownership. Add CSRF protection if cookie authentication is selected. Integration-test anonymous requests and cross-user object access as `401`/`403`.

### CR-02: Android deliberately permits cleartext traffic and sends sensitive text to arbitrary endpoints

**Evidence:** `android/app/src/main/AndroidManifest.xml:14-21`, `android/app/src/main/java/com/friday/assistant/network/FridayApiClient.kt:42-44`, `android/app/src/main/java/com/friday/assistant/ui/FridayViewModel.kt:110-117`, `android/app/src/main/java/com/friday/assistant/ui/ProcessTextActivity.kt:53-77`

**Impact:** `usesCleartextTraffic="true"` and a mutable, UI-controlled base URL allow chat, selected text from other apps, and grammar/translation payloads to travel over HTTP to any host. On a physical device, a network attacker can read or modify requests and responses; a mistaken or malicious endpoint configuration can exfiltrate text selected from Gmail, WhatsApp, browsers, and other apps.

**Remediation:** Make release builds HTTPS-only with a restrictive Network Security Config. Keep `10.0.2.2` and HTTP only in a debug flavor. Parse and validate server URLs, restrict them to an explicit developer allowlist or a paired server identity, and persist them only in encrypted developer settings. Clearly disclose outbound processing before PROCESS_TEXT/accessibility workflows send text.

### CR-03: Voice endpoints accept unbounded request bodies and base64 data before validation

**Evidence:** `backend/api/voice.py:68-100`, `backend/voice/voice_pipeline.py:159-176`, `backend/voice/whisper_stt.py:105-140`

**Impact:** Unauthenticated callers can submit arbitrarily large HTTP bodies or WebSocket base64 frames. The server decodes them fully in memory, writes them to disk, and starts expensive transcription work. A few requests can exhaust memory, disk, workers, or model capacity and deny service to local users.

**Remediation:** Enforce a request/content-length and decoded-audio byte limit before decoding, configure WebSocket frame/message limits, validate base64 with `validate=True`, permit only a fixed media-type/suffix allowlist, impose per-client concurrency and timeouts, and return `413`/`429`. Add boundary tests for oversized HTTP and WebSocket audio.

### CR-04: “Local” voice synthesis sends text to a cloud service by default

**Evidence:** `backend/api/voice.py:14-56`, `backend/voice/voice_service.py:156-207`

**Impact:** `prefer_local` defaults to `False`, so every normal TTS request attempts `edge_tts.Communicate` before the macOS local engine. Private assistant replies and selected-text results are therefore transmitted to an external TTS service despite the product repeatedly describing itself as local/on-device. This is a privacy and consent violation, especially combined with accessibility features.

**Remediation:** Default to local-only synthesis, make cloud TTS an opt-in setting with a provider-specific disclosure, and expose actual provider/egress status in the response and UI. Prevent cloud fallback entirely in privacy/local mode. Test the default path by mocking network access and asserting no outbound call.

### CR-05: LLM output can invoke workspace-reading tools without a policy or confirmation gate

**Evidence:** `backend/ai/orchestrator.py:203-224`, `backend/tools/registry.py:86-103`, `backend/tools/base.py:10-26`, `backend/tools/file_manager.py:10-105`

**Impact:** A model response parsed as a tool call is immediately executed. `requires_confirmation` is metadata only; the registry never enforces it, and `file_manager` is explicitly marked safe. Prompt injection in conversation history, retrieved memories, search results, or model behavior can make the backend enumerate or read workspace files and return their content into the model/UI. The blacklist does not protect arbitrary sensitive project files such as credentials, customer exports, or proprietary documents.

**Remediation:** Introduce a server-side capability policy that validates each tool and typed argument before execution; require an explicit, request-bound user approval token for file reads and all data-exfiltrating tools. Use a deny-by-default workspace sandbox with explicit roots and sensitive-file classification, redact/log minimally, and never trust the model’s declared risk. Add prompt-injection and direct-tool API authorization tests.

## WARNING findings

### WR-01: Settings writes claim persistence but are never loaded on startup

**Evidence:** `backend/api/settings.py:39-48`, `backend/database/repositories.py:259-281`, `backend/config/settings.py:11-62`, `backend/main.py:65-73`

**Impact:** `PUT /api/settings` writes rows to SQLite and mutates the in-process singleton, but startup never reads those rows. A restart silently reverts behavior while the database implies the change was saved.

**Remediation:** Choose one source of truth. Either remove persistence and label settings session-only, or load/validate persisted values during lifespan before consumers initialize. Use typed settings and test restart persistence and invalid stored values.

### WR-02: Memory importance of `0.0` is silently stored as `1.0`

**Evidence:** `backend/api/memory.py:23-32`

**Impact:** `req.importance or 1.0` treats the valid numeric value `0.0` as absent. Users cannot store a least-important memory, distorting recall ranking.

**Remediation:** Use `1.0 if req.importance is None else req.importance`, enforce `ge=0`/`le=1` with Pydantic, and add tests for `0`, out-of-range, and omitted values.

### WR-03: Public chat WebSocket bypasses rate limiting and request concurrency controls

**Evidence:** `backend/api/chat.py:19-28`, `backend/api/chat.py:37-51`, `backend/api/chat.py:105-135`

**Impact:** Only the HTTP endpoint applies a mutable in-memory rate map. `/ws/chat` has no limit, and the HTTP key is caller-controlled `conversation_id` (or one global bucket), so it is neither a client identity nor an effective fairness boundary. Requests can consume concurrent LLM/tool capacity indefinitely.

**Remediation:** Apply a shared, bounded rate/concurrency limiter to HTTP and WebSocket sessions keyed by authenticated principal/IP as appropriate. Bound map cardinality and clean expired keys. Add tests for WebSocket flood, reconnects, and parallel long-running prompts.

### WR-04: Onboarding preferences are global, unauthenticated, and lost at restart

**Evidence:** `backend/api/onboarding.py:16-39`

**Impact:** Every client observes and overwrites one process-global onboarding record; a restart drops it. With current network exposure, any caller can change another user’s persona/tool list.

**Remediation:** Store validated preferences per authenticated user in the database, or make onboarding explicitly client-local. Validate persona and tool identifiers against allowlists and add restart/isolation tests.

### WR-05: Invalid runtime configuration can prevent all imports and test collection

**Evidence:** `backend/config/settings.py:11-62`

**Impact:** A process environment value `DEBUG=release` makes `Settings()` raise during module import, preventing FastAPI startup and collecting six test modules in the reviewed environment. Generic names like `DEBUG` are especially prone to collision with shell/CI settings.

**Remediation:** Namespace environment variables (for example `FRIDAY_DEBUG`), validate configuration in a dedicated startup path with a clear error, and isolate test configuration with an explicit env file/fixture. Add a startup contract test for malformed and colliding environment values.

### WR-06: Accessibility service retains an accessibility node and leaves its coroutine scope alive after destruction

**Evidence:** `android/app/src/main/java/com/friday/assistant/service/FridayAccessibilityService.kt:16-18`, `33-45`, `52-56`, `58-87`

**Impact:** `lastFocusedNode` is retained without recycling/replacing the previous node, and `serviceScope` is never cancelled. A delayed grammar response can target a stale field after focus changed or service teardown, while retained nodes/scopes can leak resources.

**Remediation:** Keep only a short-lived node reference or re-resolve focus immediately before replacement; recycle prior/current nodes as required, cancel the job in `onDestroy`, and guard UI/action work with service lifecycle checks. Add instrumentation tests for focus changes and service destruction during a request.

### WR-07: Device launch reports success even when Android cannot handle the intent

**Evidence:** `android/app/src/main/java/com/friday/assistant/device/DeviceActionManager.kt:130-186`, `android/app/src/main/java/com/friday/assistant/ui/FridayViewModel.kt:183-229`

**Impact:** `startActivity` can throw `ActivityNotFoundException` (for example no compatible email/maps/browser handler). Most branches return a success message unconditionally; command failures can leave the coroutine/UI state inconsistent and tell the user an action happened when it did not.

**Remediation:** Resolve the intent first, catch activity-launch exceptions, return the actual success state, and centralize command execution error handling so `isSending`/assistant state is reset in `finally`. Instrument no-handler cases.

### WR-08: Runtime request models lack bounds and allow invalid semantic settings

**Evidence:** `backend/api/settings.py:12-18`, `backend/api/conversations.py:12-26`, `backend/api/memory.py:11-14`, `backend/api/voice.py:14-26`

**Impact:** Titles, memory content/category, tool input, TTS text/rate/pitch, pagination, temperature, top-p, and token limits are mostly unbounded or unconstrained. This permits database growth, invalid model options, extreme work requests, and inconsistent API behavior.

**Remediation:** Replace loose fields with constrained Pydantic types/enums; cap payloads and pagination, validate numeric ranges, and produce stable `422` responses. Add table-driven boundary tests.

### WR-09: Backend error details are reflected to remote callers

**Evidence:** `backend/api/chat.py:71-73`, `86-92`; `backend/ai/orchestrator.py:266-269`; `backend/api/translate.py:165-167`, `257-259`, `321-323`; `backend/voice/voice_pipeline.py:152-155`, `174-176`

**Impact:** Exception strings can disclose filesystem paths, implementation details, or upstream service messages. The non-streaming chat path even reports `success: true` after an exception, making clients act on a failed request.

**Remediation:** Log detailed exceptions server-side with a correlation ID; return stable public error codes/messages and correct success status. Test that internal exception text is absent from HTTP/SSE/WebSocket responses.

### WR-10: No tests cover the highest-risk trust boundaries

**Evidence:** `tests/test_ui_contracts.py:28-90`, `tests/test_voice_pipeline.py:34-83`, `tests/test_onboarding_and_api.py:29-55`; no tests cover auth, CORS origin rejection, WebSocket limits, direct file-read authorization, oversized audio, Android HTTPS policy, accessibility lifecycle, or persistence across restart.

**Impact:** Existing tests mainly assert happy-path schema/UI contracts and mocked inference. Regressions in authorization, privacy, resource limits, and mobile lifecycle behavior can ship undetected.

**Remediation:** Add a security and resilience suite before feature expansion, then run it in CI against an isolated temporary database and local mock services. Include Android instrumented tests and a release-build network policy check.

## INFO findings

### IN-01: Test environment is not hermetic

**Evidence:** `backend/config/settings.py:14-18`, test modules import global application objects at module load (for example `tests/test_ui_contracts.py:9-12`).

**Impact:** Ambient process settings alter import behavior and database location, making results machine-dependent.

**Remediation:** Provide a settings factory/dependency override and per-test temporary SQLite path; construct the app in fixtures instead of at import time.

### IN-02: Long-term memory retrieval does synchronous local scoring over every memory row

**Evidence:** `backend/memory/long_term.py:65-92`, `backend/memory/embeddings.py:60-102`

**Impact:** Retrieval semantics are simple and deterministic but unbounded as memory grows, and no persisted embedding/index exists.

**Remediation:** After correctness/security work, cap candidate retrieval and introduce a persisted/indexed embedding strategy only if measurements justify it.

### IN-03: The Android tool safety abstraction is not connected to actual device command execution

**Evidence:** `android/app/src/main/java/com/friday/assistant/tools/ToolSafety.kt:3-14`, `android/app/src/main/java/com/friday/assistant/ui/FridayViewModel.kt:255-324`

**Impact:** The allowlist/confirmation model gives a false sense of enforcement because `runTool` and natural-language device commands call `DeviceActionManager` directly.

**Remediation:** Route all tool actions through one policy-enforcing executor and model confirmation as an explicit UI state, not a caller-supplied risk enum.

### IN-04: Backend health claims components are online without verifying them

**Evidence:** `backend/api/health.py:13-74`

**Impact:** `database`, `voice`, and `tools` are reported true/ready even if their dependencies or initialization have failed, which misleads clients and operations.

**Remediation:** Report individual checked readiness/degraded states and include safe diagnostics; test unavailable database, TTS, STT, and tool conditions.

## Prioritized improvement roadmap

1. **Establish a secure deployment boundary (P0).** Change the server default to loopback, add authenticated/authorized HTTP and WebSocket access, lock down CORS, and make release Android HTTPS-only with server identity validation. Verify with anonymous-access, cross-user, and MITM-policy tests.
2. **Make tools and voice safe to expose (P0).** Implement capability-based tool authorization and explicit confirmations, restrict file roots/sensitive content, set HTTP/WebSocket audio limits and concurrency caps, and stop cloud TTS unless the user opts in. Verify with prompt-injection, direct-tool, oversized-audio, and no-egress tests.
3. **Repair correctness and state contracts (P1).** Fix `importance=0`, load validated persistent settings, make onboarding user-scoped/persistent, return correct error states, bound inputs, and reliably clean Android lifecycle state. Verify with restart, validation, and instrumentation tests.
4. **Make testing repeatable (P1).** Introduce a test settings factory, temporary database fixture, mocked Ollama/TTS/STT, and CI gates for formatting, compile, unit/integration/security tests, and Android release network configuration.
5. **Improve observability and maintainability (P2).** Standardize typed API errors, correlation IDs, health checks, and a single policy/executor path for tools. Measure memory retrieval before optimizing it; avoid speculative architecture changes.

## Verification gate for the roadmap

Do not consider the P0 work complete until: a non-loopback server rejects unauthenticated REST and WebSocket requests; unauthorized users cannot access another conversation/memory; HTTP cleartext is rejected in a release APK; cloud TTS is absent by default; file reads require an approved request and cannot read sensitive project material; and oversized voice payloads fail without excessive memory/disk use.

---

_Review performed 2026-09-23. This artifact is read-only analysis; no source files were modified._
