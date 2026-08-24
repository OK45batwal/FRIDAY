import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from services.core.api.routes.chat import router as chat_router
from services.core.api.routes.conversations import router as conversations_router
from services.core.api.routes.download import router as download_router
from services.core.api.routes.health import router as health_router
from services.core.api.routes.voice import router as voice_router
from services.core.api.websocket.handler import manager as ws_manager
from services.core.api.websocket.handler import ws_router
from services.core.app.config import settings
from services.core.app.security import (
    TOKEN_HEADER,
    TOKEN_QUERY_PARAM,
    get_api_token,
    is_authorized,
    is_public_path,
)
from services.core.db.database import engine, init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    token = get_api_token()
    logger.info("=" * 58)
    logger.info("FRIDAY Core v0.1 online")
    logger.info("Listening on   http://%s:%s", settings.HOST, settings.PORT)
    logger.info("AI provider    %s", settings.AI_PROVIDER.upper())
    logger.info("Allowed origins %s", ", ".join(settings.CORS_ORIGINS) or "(none)")
    logger.info("API token file %s", settings.TOKEN_FILE)
    logger.info("API token      %s…%s", token[:6], token[-4:])
    logger.info("=" * 58)

    yield

    # Shutdown: previously absent, so connection pools and sockets were never
    # released and uvicorn's --reload leaked a DB handle on every restart.
    logger.info("FRIDAY Core shutting down…")
    await ws_manager.close_all()
    await engine.dispose()


app = FastAPI(
    title="FRIDAY Core Service",
    description="Core AI Orchestration, Conversation & Voice Pipeline Service",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + ["capacitor://localhost", "http://localhost", "https://localhost", "ionic://localhost"],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=600,
)



@app.middleware("http")
async def enforce_request_limits(request: Request, call_next):
    """
    Reject oversized bodies and unauthorized callers before routing.

    Body size is checked here because FastAPI buffers and parses the whole body
    before a handler (or a Pydantic max_length) ever runs, so per-field limits
    alone leave a trivial memory-exhaustion vector.
    """
    if request.method == "OPTIONS":
        return await call_next(request)

    content_length = request.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > settings.MAX_REQUEST_BYTES:
                return JSONResponse(
                    status_code=413,
                    content={"detail": f"Request body exceeds {settings.MAX_REQUEST_BYTES} bytes."},
                )
        except ValueError:
            return JSONResponse(status_code=400, content={"detail": "Malformed Content-Length header."})

    if not is_public_path(request.url.path):
        origin = request.headers.get("origin")
        token = request.headers.get(TOKEN_HEADER) or request.query_params.get(TOKEN_QUERY_PARAM)
        if not is_authorized(origin, token):
            logger.warning(
                "Rejected unauthorized %s %s (origin=%r)", request.method, request.url.path, origin
            )
            return JSONResponse(
                status_code=403,
                content={
                    "detail": "Untrusted origin. Supply a valid X-FRIDAY-Token "
                    "or call from an allowlisted origin."
                },
            )

    return await call_next(request)


app.include_router(health_router)
app.include_router(chat_router)
app.include_router(conversations_router)
app.include_router(voice_router)
app.include_router(download_router)
app.include_router(ws_router)

if __name__ == "__main__":
    # reload is a development convenience and must not be hardcoded on: it
    # spawns a file-watching supervisor and is unsafe for any real deployment.
    uvicorn.run(
        "services.core.app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
    )
