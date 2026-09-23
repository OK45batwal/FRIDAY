# FRIDAY Fix Plan

Source: `CODEBASE-REVIEW.md` (all 19 findings re-verified against HEAD `933b7ff` on 2026-09-23 — none fixed).

## Principles

- Fix trust boundary first; features after.
- Each PR ships with the test that fails before / passes after.
- No new dependencies unless a rung below forces it.
- Batches are ordered; do not start batch N+1 until batch N's verify gate passes.

---

## Batch 0 — Unblock the test suite (WR-05, IN-01) — ~half day

Nothing else is safely verifiable until tests collect reliably.

| # | Change | Files |
|---|--------|-------|
| 0.1 | Namespace env vars: `DEBUG` → `FRIDAY_DEBUG` (and audit remaining generic names: `HOST`, `PORT`, `APP_NAME` → prefix `FRIDAY_`) | `backend/config/settings.py`, `.env`, `.env.example` |
| 0.2 | Move `settings = Settings()` off module-import failure path: validate in lifespan/startup with a clear error; module import must not raise on bad env | `backend/config/settings.py`, `backend/main.py` |
| 0.3 | Add `tests/conftest.py`: temp SQLite fixture (`SQLITE_DB_PATH` → tmp_path), construct app in fixture instead of import-time, mock Ollama/TTS/STT | `tests/conftest.py` (new), touch all 9 test modules |

**Verify:** `pytest -q` collects 42+ tests with `FRIDAY_DEBUG=release` and `DEBUG=release` both set; suite passes.

---

## Batch P0-A — Network trust boundary (CR-01, CR-02, WR-03) — ~2–3 days

| # | Change | Files |
|---|--------|-------|
| 0A.1 | Default `HOST=127.0.0.1`. Fail startup if binding non-loopback unless `ENVIRONMENT=production` **and** `FRIDAY_ALLOW_REMOTE=true` | `backend/config/settings.py`, `backend/main.py` |
| 0A.2 | API-key auth: `FRIDAY_API_KEY` setting; FastAPI dependency `require_api_key` (header `X-API-Key` or `Authorization: Bearer`); apply to all routers except `/api/health`. Skip when key unset **only** in `ENVIRONMENT=development` | `backend/api/auth.py` (new), all `backend/api/*.py`, `backend/main.py` |
| 0A.3 | WebSocket handshake: verify same auth header/`api_key` query param + Origin against CORS allowlist before accept (`/ws/chat`, `/ws/voice`) | `backend/api/chat.py`, `backend/api/voice.py` |
| 0A.4 | Move rate limiter to shared middleware: one bounded LRU map keyed by client IP (+ principal when auth lands); apply to HTTP *and* WebSocket; cap map size, expire keys | `backend/utils/ratelimit.py` (new), `backend/api/chat.py`, `backend/main.py` |
| 0A.5 | CORS: drop `allow_origin_regex` broad match; explicit origin list only; keep credentials only if cookie auth chosen (it won't be — header auth) | `backend/main.py` |
| 0A.6 | Android: `network_security_config.xml` — cleartext only for debug `10.0.2.2`; release build `usesCleartextTraffic=false`. Validate base URL (scheme + host allowlist / HTTPS in release); persist via EncryptedSharedPreferences | `android/.../AndroidManifest.xml`, `android/.../network/security_config.xml` (new), `FridayApiClient.kt`, `FridayViewModel.kt` |
| 0A.7 | Web client: read API key from a one-time setup prompt (or generated local key file), send header on all fetch/WS | `web/app.js` |

**Verify (tests):**
- Anonymous REST → 401 on every non-health route.
- Bad/missing WS Origin or key → rejected.
- Rate-limit flood → 429 on HTTP and WS.
- `HOST=0.0.0.0` without production flags → startup abort.
- Android lint/assembleRelease fails if cleartext enabled (CI check).

---

## Batch P0-B — Tools, voice, privacy (CR-03, CR-04, CR-05) — ~2–3 days

| # | Change | Files |
|---|--------|-------|
| 0B.1 | Tool capability policy: server-side allowlist; file tools (`file_manager`, any read) require `requires_confirmation=True` **and** a request-bound approval token issued by a prior explicit endpoint (`POST /api/tools/{name}/approve`). Registry enforces; model output alone never authorizes | `backend/tools/registry.py`, `backend/tools/base.py`, `backend/tools/file_manager.py`, `backend/ai/orchestrator.py`, `backend/api/tools.py` |
| 0B.2 | Workspace sandbox: explicit roots (config), deny-by-default outside; sensitive-file patterns (`.env`, `*.pem`, `*credential*`, `secrets/*`, `friday.db`) always denied | `backend/tools/file_manager.py`, `backend/config/settings.py` |
| 0B.3 | Voice limits: max HTTP body / Content-Length (e.g. 10 MB), max WS frame (e.g. 10 MB), `base64.b64decode(..., validate=True)`, media-type/suffix allowlist, decode-after-check, per-client concurrency + timeout → 413/429. Cap TTS `text` length | `backend/api/voice.py`, `backend/voice/voice_pipeline.py`, `backend/voice/whisper_stt.py` |
| 0B.4 | TTS default local: `prefer_local=True` (or new `TTS_MODE=local`); cloud `edge_tts` only when `TTS_ALLOW_CLOUD=true`; response reports actual provider used | `backend/api/voice.py`, `backend/voice/voice_service.py`, `backend/config/settings.py` |

**Verify (tests):**
- Direct `POST /api/tools/file_manager/read` without approval token → 403.
- Simulated tool-call in chat reply cannot read outside sandbox / sensitive files.
- Oversized audio body/frame → 413, no temp file written, memory flat.
- Default TTS path: network mocked → assert zero outbound calls; provider field = `local`.

---

## Batch P1 — Correctness contracts (WR-01, WR-02, WR-04, WR-06, WR-07, WR-08, WR-09) — ~2 days

| # | Change | Files |
|---|--------|-------|
| 1.1 | Settings: load `SettingsRepository.get_all()` in lifespan **before** routers consume; apply validated values to `settings` singleton. Or (simpler): stop writing DB, mark session-only. **Choose load-on-startup** (DB write already exists) | `backend/main.py`, `backend/api/settings.py`, `backend/database/repositories.py` |
| 1.2 | `importance`: `1.0 if req.importance is None else req.importance`; Pydantic `Field(default=1.0, ge=0, le=1)` | `backend/api/memory.py` |
| 1.3 | Onboarding: persist per-session/key in DB (or client-local); validate persona/tools against allowlists | `backend/api/onboarding.py`, `backend/database/*` |
| 1.4 | Bound all request models: title/content length, pagination `le`, temperature/top_p ranges, token limits, tool input size → stable 422 | `backend/api/{settings,conversations,memory,voice,chat}.py` |
| 1.5 | Error hygiene: log full exception + correlation id server-side; return generic message + correct status. Fix non-streaming chat returning `success: true` after exception | `backend/api/chat.py`, `backend/api/translate.py`, `backend/ai/orchestrator.py`, `backend/voice/voice_pipeline.py` |
| 1.6 | Android accessibility: recycle/replace `lastFocusedNode`, cancel `serviceScope` in `onDestroy`, re-resolve focus before acting | `FridayAccessibilityService.kt` |
| 1.7 | Android device actions: `resolveActivity` / catch `ActivityNotFoundException`, return real ok flag, try/finally reset `isSending` | `DeviceActionManager.kt`, `FridayViewModel.kt` |

**Verify (tests):** restart-persistence test for settings; `importance=0` round-trip; 422 table-driven bounds; exception text absent from response; accessibility/action unit+instrumented tests.

---

## Batch P1-T — Test & CI hardening (WR-10, IN-01 remainder) — ~1–2 days (overlaps)

| # | Change |
|---|--------|
| T.1 | Security suite from Batch P0 gates wired into CI |
| T.2 | CI: `pytest`, `compileall`, Android `assembleRelease` + cleartext lint check |
| T.3 | Hermetic: no import-time app construction (from 0.3), temp DB always |

---

## Batch P2 — Observability / cleanup (IN-02, IN-03, IN-04) — after P0/P1

| # | Change | Files |
|---|--------|-------|
| 2.1 | Health: real readiness probes (DB ping, tool init, voice deps); report per-component | `backend/api/health.py` |
| 2.2 | Android: route `runTool`/NL commands through one policy executor; wire `ToolSafety` for real (or delete it — false confidence worse than none) | `FridayViewModel.kt`, `DeviceActionManager.kt`, `ToolSafety.kt` |
| 2.3 | Memory retrieval: cap candidates first; index only if measured need | `backend/memory/long_term.py` |

---

## Suggested PR sequence

1. `fix(config): namespace env vars, non-failing settings import, test fixtures` — Batch 0
2. `fix(security): loopback default, API-key auth, WS auth, rate limit, CORS` — Batch P0-A backend
3. `fix(android): HTTPS-only release, URL validation` — Batch P0-A Android (parallel with 2)
4. `fix(security): tool approval policy + workspace sandbox` — Batch P0-B tools
5. `fix(voice): payload limits, local-first TTS` — Batch P0-B voice
6. `fix(api): settings load, importance=0, bounds, error hygiene` — Batch P1
7. `fix(android): accessibility lifecycle, intent errors` — Batch P1 Android
8. `test(ci): security suite + release network gate` — Batch P1-T

## Definition of done (from review, unchanged)

- [ ] Non-loopback server rejects unauthenticated REST and WebSocket
- [ ] Release APK rejects cleartext
- [ ] Cloud TTS absent by default
- [ ] File reads need approval + cannot read sensitive material
- [ ] Oversized voice payloads fail closed
- [ ] `pytest` green with colliding `DEBUG`/`FRIDAY_DEBUG` values present
