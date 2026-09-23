"""Hermetic test fixtures and environment isolation for FRIDAY test suite."""

import os
import asyncio
import pytest
from unittest.mock import patch


def pytest_configure(config):
    """Sanitize environment variables before test collection begins."""
    # Ensure conflicting ambient shell flags do not break settings
    if os.environ.get("FRIDAY_DEBUG", "").lower() in ("release", "prod", "production"):
        os.environ["FRIDAY_DEBUG"] = "false"
    elif "FRIDAY_DEBUG" not in os.environ:
        os.environ["FRIDAY_DEBUG"] = "true"

    os.environ["FRIDAY_ENVIRONMENT"] = "testing"
    os.environ["FRIDAY_HOST"] = "127.0.0.1"
    os.environ["FRIDAY_PORT"] = "8080"


@pytest.fixture(autouse=True)
def temp_db(tmp_path, monkeypatch):
    """Isolate SQLite database to a temporary directory per test."""
    from backend.config.settings import settings
    from backend.database import database

    test_db = str(tmp_path / "test_friday.db")
    monkeypatch.setattr(settings, "SQLITE_DB_PATH", test_db)
    monkeypatch.setattr(database, "DB_PATH", test_db)

    asyncio.run(database.init_db())
    yield test_db


@pytest.fixture
def client(temp_db):
    """FastAPI TestClient initialized against hermetic test database."""
    from fastapi.testclient import TestClient
    from backend.main import app

    with TestClient(app) as test_client:
        yield test_client
