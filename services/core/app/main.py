import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.core.app.config import settings
from services.core.db.database import init_db
from services.core.api.routes.health import router as health_router
from services.core.api.routes.chat import router as chat_router
from services.core.api.routes.conversations import router as conversations_router
from services.core.api.routes.voice import router as voice_router
from services.core.api.websocket.handler import ws_router

app = FastAPI(
    title="FRIDAY Core Service",
    description="Core AI Orchestration, Conversation & Voice Pipeline Service",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(chat_router)
app.include_router(conversations_router)
app.include_router(voice_router)
app.include_router(ws_router)

@app.on_event("startup")
async def on_startup():
    await init_db()
    print("==================================================")
    print(f"       FRIDAY Core v0.1 Online                     ")
    print(f"       Host: {settings.HOST}:{settings.PORT}       ")
    print(f"       AI Provider: {settings.AI_PROVIDER.upper()} ")
    print("==================================================")

if __name__ == "__main__":
    uvicorn.run("services.core.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
