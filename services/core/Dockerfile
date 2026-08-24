# FRIDAY Core API server.
#
# This file was referenced by docker-compose.yml but did not exist, so
# `docker compose build` failed immediately. It installs only the runtime
# requirements — the training stack (torch et al.) is multi-gigabyte and is not
# needed to serve the API.
#
# Note: the macOS-native tools (say, osascript, Reminders) are unavailable in a
# Linux container, so agent_tools and TTS degrade to their "unsupported"
# branches. The container is for the API, not for OS automation.

FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install deps first so a source-only change does not invalidate this layer.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# The app imports itself as `services.core.*`, so it must sit at that path with
# the repo root on sys.path.
ENV PYTHONPATH=/app
COPY . /app/services/core/

# Run as a non-root user. The default root would own the mounted data volume and
# any file the agent tools write.
RUN useradd --create-home --uid 10001 friday \
    && mkdir -p /app/services/core/memory_data /app/services/core/learning_data /data \
    && chown -R friday:friday /app /data
USER friday

# Bind all interfaces INSIDE the container only; the compose port mapping decides
# what is actually reachable from the host.
ENV HOST=0.0.0.0 \
    PORT=8000 \
    DATABASE_URL=sqlite+aiosqlite:////data/friday.db

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=4).status==200 else 1)"

CMD ["python", "-m", "uvicorn", "services.core.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
